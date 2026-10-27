// ความปลอดภัย: บัญชีโค้ชเข้าข้อมูลภายในไม่ได้ · จำกัดการเดารหัสผ่าน · หัวข้อความความปลอดภัย · กันยิงบันทึกข้อผิดพลาด
const path = require("path");
const { ROOT } = require("./harness.cjs");
const bcrypt = require(path.join(ROOT, "node_modules", "bcryptjs"));

module.exports = {
  name: "ความปลอดภัย: สิทธิ์ + จำกัดการเดารหัสผ่าน",
  async run(ctx) {
    const { check, sql, BASE } = ctx;
    const fetchAs = (url, token, init = {}) => fetch(`${BASE}${url}`, { redirect: "manual", ...init, headers: { ...(init.headers ?? {}), ...(token ? { cookie: `session_token=${token}` } : {}) } });

    // ===== 1) บัญชีโค้ชเข้าข้อมูลภายในไม่ได้ =====
    const coachId = (await sql(`insert into coaches (name_th, surname_th, updated_at) values ('โค้ช','ทดสอบสิทธิ์', now()) returning id`))[0].id;
    const otherId = (await sql(`insert into coaches (name_th, surname_th, updated_at) values ('คนอื่น','ทดสอบ', now()) returning id`))[0].id;
    const recordId = (await sql(`insert into license_records (coach_id, license_type, record_type, issue_date) values ($1,'C','TRAINING', now()) returning record_id`, [otherId]))[0].record_id;
    const coach = await ctx.login("COACH", { coachId });
    const staff = await ctx.login("STAFF");

    for (const url of ["/talent-id", "/talent-id/players", "/talent-id/stats", "/coaches/export", `/coaches/${otherId}/certificate/${recordId}`]) {
      const res = await fetchAs(url, coach);
      const loc = res.headers.get("location") ?? "";
      check(`โค้ชเปิด ${url} ไม่ได้ (ส่งกลับ /me)`, res.status >= 300 && res.status < 400 && loc.endsWith("/me"), `${res.status} → ${loc}`);
    }
    const staffExport = await fetchAs("/coaches/export", staff);
    check("เจ้าหน้าที่ยังส่งออกรายชื่อผู้ฝึกสอนได้", staffExport.status === 200, String(staffExport.status));

    // ===== 2) หัวข้อความความปลอดภัย =====
    const home = await fetchAs("/", null);
    check(
      "หัวข้อความความปลอดภัยครบ",
      home.headers.get("x-frame-options") === "SAMEORIGIN" && home.headers.get("x-content-type-options") === "nosniff" && (home.headers.get("content-security-policy") ?? "").includes("frame-ancestors"),
      [...home.headers.entries()].filter(([k]) => /frame|nosniff|content-type-options|security-policy/.test(k)).join(" | "),
    );

    // ===== 3) จำกัดการเดารหัสผ่าน: ผิด 8 ครั้ง → แม้รหัสถูกก็ถูกพัก 15 นาที =====
    const email = "lockout@test.invalid";
    await sql(`insert into system_users (email, password_hash, role) values ($1,$2,'STAFF')`, [email, await bcrypt.hash("Correct-Pass-1", 10)]);
    const p = await ctx.page(null);
    const attempt = async (password) => {
      await p.goto(`${BASE}/login`, { waitUntil: "networkidle", timeout: 240_000 });
      await p.locator('input[name="email"]').fill(email);
      await p.locator('input[name="password"]').fill(password);
      await Promise.all([p.waitForURL(/\/login\?error=|\/admin$/, { timeout: 30_000 }), p.locator('form button[type="submit"]').first().click()]);
      return new URL(p.url()).searchParams.get("error");
    };
    const first = await attempt("wrong-1");
    check("รหัสผิด → แจ้งรหัสไม่ถูกต้อง", first === "1", first);
    for (let i = 2; i <= 8; i++) await attempt(`wrong-${i}`);
    const locked = await attempt("Correct-Pass-1");
    check("ผิดครบ 8 ครั้ง → รหัสถูกก็ถูกพักชั่วคราว", locked === "locked", locked);
    check("หน้าเข้าสู่ระบบแจ้งให้ลองใหม่ใน 15 นาที", (await p.locator("body").innerText()).includes("15 นาที"));
    await sql(`delete from login_attempts where email=$1`, [email]);
    const ok = await attempt("Correct-Pass-1");
    check("พ้นช่วงพัก → เข้าสู่ระบบได้ และล้างประวัติผิด", ok === null && (await sql(`select count(*)::int n from login_attempts where email=$1`, [email]))[0].n === 0, ok);

    // ===== 4) กันยิงบันทึกข้อผิดพลาดจากหน้าเว็บ =====
    let last = 0;
    for (let i = 0; i < 32; i++) {
      const r = await fetch(`${BASE}/api/client-error`, { method: "POST", body: JSON.stringify({ message: `spam ${i} ${Math.random()}`, path: "/x" }) });
      last = r.status;
    }
    const stored = (await sql(`select count(*)::int n from error_logs where source='CLIENT' and message like 'spam %'`))[0].n;
    check("ยิงบันทึกข้อผิดพลาดรัวๆ → รับไม่เกิน 30 รายการ", last === 429 && stored <= 30, `last=${last} stored=${stored}`);
    await sql(`delete from error_logs where source='CLIENT' and message like 'spam %'`);
  },
};
