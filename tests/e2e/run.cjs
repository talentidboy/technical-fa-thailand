// ตัวรันชุดทดสอบ E2E:  npm run test:e2e  (หรือ npm run test:e2e -- renewal  เพื่อรันเฉพาะไฟล์ที่ชื่อมีคำนี้)
// 1) สร้าง schema ทดสอบ (แยกจากข้อมูลจริง) 2) build แล้วเปิดเว็บแบบ production ที่ชี้ไป schema นั้น 3) รันทุกไฟล์ *.test.cjs
// (ใส่ --dev เพื่อใช้โหมด dev แทน — เร็วกว่าตอนแก้โค้ด แต่ Next.js 16.4 โหมด dev บางหน้า reload วนเองเมื่อข้อมูลว่าง ทำให้ผลทดสอบไม่นิ่ง)
// 4) ปิดเว็บ + ลบ schema ทดสอบ (ใส่ --keep เพื่อเก็บไว้ดู)  — ถ้ามีข้อใดไม่ผ่าน exit code = 1
const path = require("path");
const fs = require("fs");
const { spawn, execSync } = require("child_process");
const { chromium } = require("playwright-core");
const h = require("./harness.cjs");

const args = process.argv.slice(2);
const keep = args.includes("--keep");
const devMode = args.includes("--dev");
const filters = args.filter((a) => !a.startsWith("--"));
const ARTIFACTS = path.join(h.ROOT, "tests", "e2e", ".artifacts");

function killTree(child) {
  if (!child || child.exitCode != null) return;
  try {
    if (process.platform === "win32") execSync(`taskkill /pid ${child.pid} /T /F`, { stdio: "ignore" });
    else process.kill(-child.pid, "SIGTERM");
  } catch {
    // ปิดไปแล้ว
  }
}

async function waitForServer(child, log) {
  const started = Date.now();
  while (Date.now() - started < 120_000) {
    if (child.exitCode != null) throw new Error(`เว็บทดสอบปิดตัวก่อนพร้อมใช้งาน:\n${log.join("")}`);
    try {
      const res = await fetch(`${h.BASE}/api/deploy-id`);
      if (res.ok) return;
    } catch {
      // ยังไม่พร้อม
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`รอเว็บทดสอบนานเกินไป:\n${log.join("")}`);
}

(async () => {
  if (!process.env.DIRECT_URL || !process.env.DATABASE_URL) throw new Error("ต้องตั้งค่า DATABASE_URL และ DIRECT_URL (ไฟล์ .env)");
  const files = fs
    .readdirSync(__dirname)
    .filter((f) => f.endsWith(".test.cjs") && (filters.length === 0 || filters.some((x) => f.includes(x))))
    .sort();
  if (files.length === 0) throw new Error("ไม่พบไฟล์ทดสอบ");
  fs.mkdirSync(ARTIFACTS, { recursive: true });

  console.log(`▶ สร้าง schema ทดสอบ "${h.SCHEMA}"`);
  execSync("npx prisma db push", { cwd: h.ROOT, stdio: "ignore", env: { ...process.env, DIRECT_URL: h.schemaUrl() } });

  if (!devMode) {
    console.log("▶ build เว็บแบบ production");
    try {
      execSync("npx next build", { cwd: h.ROOT, stdio: "pipe", env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" } });
    } catch (err) {
      throw new Error(`build ไม่สำเร็จ:
${String(err.stdout ?? "").slice(-3000)}
${String(err.stderr ?? "").slice(-2000)}`);
    }
  }
  console.log(`▶ เปิดเว็บทดสอบที่ ${h.BASE}${devMode ? " (dev)" : ""}`);
  const log = [];
  const server = spawn("npx", ["next", devMode ? "dev" : "start", "-p", String(h.PORT)], {
    cwd: h.ROOT,
    // ปิดอีเมลจริง + กำหนดรหัสงานอัตโนมัติสำหรับทดสอบ + เอกสารอคาเดมีเก็บในโฟลเดอร์ทดสอบ (ไม่ขึ้นที่เก็บไฟล์จริง)
    env: { ...process.env, TEST_DB_SCHEMA: h.SCHEMA, EMAIL_DISABLED: "1", CRON_SECRET: h.CRON_SECRET, ACADEMY_DOCS_DIR: path.join(ARTIFACTS, "academy-docs") },
    shell: process.platform === "win32",
    detached: process.platform !== "win32",
  });
  server.stdout.on("data", (d) => log.push(String(d)));
  server.stderr.on("data", (d) => log.push(String(d)));

  let browser;
  const summary = [];
  try {
    await waitForServer(server, log);
    browser = await chromium.launch(h.browserOptions());
    for (const file of files) {
      const test = require(path.join(__dirname, file));
      console.log(`\n■ ${test.name ?? file}`);
      await h.resetSchema();
      const ctx = h.createContext(browser, ARTIFACTS);
      try {
        await test.run(ctx);
      } catch (err) {
        ctx.check(`ไม่มี error ระหว่างทดสอบ`, false, err && err.message ? err.message.split("\n")[0] : err);
      }
      ctx.check("ไม่มี JavaScript error ในหน้าเว็บ", ctx.pageErrors.length === 0, ctx.pageErrors.slice(0, 3).join(" | "));
      const failed = ctx.results.filter((r) => !r.ok);
      summary.push({ file, total: ctx.results.length, failed });
    }
  } finally {
    if (browser) await browser.close();
    killTree(server);
    // เก็บ log ของเว็บทดสอบไว้ดูย้อนหลังเมื่อหน้าค้าง/ช้า
    fs.writeFileSync(path.join(ARTIFACTS, "server.log"), log.join(""));
    if (!keep) await h.dropSchema().catch(() => {});
  }

  console.log("\n================ สรุป ================");
  let failedTotal = 0;
  for (const s of summary) {
    failedTotal += s.failed.length;
    console.log(`${s.failed.length ? "✗" : "✓"} ${s.file}: ผ่าน ${s.total - s.failed.length}/${s.total}`);
    for (const f of s.failed) console.log(`    - ${f.name}${f.extra ? ` (${f.extra})` : ""}`);
  }
  process.exitCode = failedTotal ? 1 : 0;
})().catch((err) => {
  console.error("✗ รันชุดทดสอบไม่สำเร็จ:", err.message);
  process.exitCode = 1;
});
