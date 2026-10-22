// สำรองข้อมูลทุกตารางของเว็บจริง (schema public) เป็นไฟล์ JSON บีบอัดไว้ในเครื่อง:  npm run db:backup
// ไฟล์อยู่ที่โฟลเดอร์ backups/ (ไม่ถูก commit — มีข้อมูลส่วนบุคคล เก็บรักษาให้ปลอดภัย) · อ่านอย่างเดียว ไม่แก้ข้อมูล
const path = require("path");
const fs = require("fs");
const zlib = require("zlib");

const ROOT = path.resolve(__dirname, "..");
require(path.join(ROOT, "node_modules/dotenv")).config({ path: path.join(ROOT, ".env"), quiet: true });
const { Client } = require("pg");

(async () => {
  if (!process.env.DIRECT_URL) throw new Error("ไม่พบ DIRECT_URL ในไฟล์ .env");
  const c = new Client({ connectionString: process.env.DIRECT_URL });
  await c.connect();
  try {
    // อ่านทุกตารางในจังหวะเดียวกัน (snapshot) ให้ข้อมูลสอดคล้องกัน
    await c.query("begin transaction isolation level repeatable read read only");
    const tables = (
      await c.query("select table_name from information_schema.tables where table_schema='public' and table_type='BASE TABLE' order by table_name")
    ).rows.map((r) => r.table_name);
    const data = { createdAt: new Date().toISOString(), tables: {} };
    for (const t of tables) {
      data.tables[t] = (await c.query(`select * from public."${t}"`)).rows;
      console.log(`  ${t}: ${data.tables[t].length.toLocaleString()} แถว`);
    }
    await c.query("commit");

    const dir = path.join(ROOT, "backups");
    fs.mkdirSync(dir, { recursive: true });
    const stamp = new Date(Date.now() + 7 * 3600_000).toISOString().slice(0, 16).replace(/[-:T]/g, "");
    const file = path.join(dir, `backup-${stamp}.json.gz`);
    fs.writeFileSync(file, zlib.gzipSync(JSON.stringify(data)));
    console.log(`✓ สำรองข้อมูล ${tables.length} ตาราง → ${path.relative(ROOT, file)} (${(fs.statSync(file).size / 1048576).toFixed(1)} MB)`);
  } finally {
    await c.end();
  }
})().catch((err) => {
  console.error("✗ สำรองข้อมูลไม่สำเร็จ:", err.message);
  process.exitCode = 1;
});
