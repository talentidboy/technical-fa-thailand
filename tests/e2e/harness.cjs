// เครื่องมือกลางของชุดทดสอบ E2E — ทุกอย่างทำบน schema ทดสอบที่แยกจากข้อมูลจริง (ไม่แตะตารางของเว็บจริง)
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const ROOT = path.resolve(__dirname, "../..");
require(path.join(ROOT, "node_modules/dotenv")).config({ path: path.join(ROOT, ".env"), quiet: true });
const { Client } = require("pg");

const SCHEMA = process.env.E2E_SCHEMA || "e2e_test";
const PORT = Number(process.env.E2E_PORT || 3491);
const BASE = `http://localhost:${PORT}`;

if (!/^[a-z_][a-z0-9_]*$/.test(SCHEMA) || SCHEMA === "public") throw new Error(`E2E_SCHEMA ไม่ถูกต้อง: ${SCHEMA}`);

// connection string ที่ชี้ไปยัง schema ทดสอบ (ใช้กับ prisma db push)
function schemaUrl() {
  const u = new URL(process.env.DIRECT_URL);
  u.searchParams.set("schema", SCHEMA);
  return u.toString();
}

async function withDb(fn) {
  const c = new Client({ connectionString: process.env.DIRECT_URL });
  await c.connect();
  try {
    await c.query(`set search_path to ${SCHEMA}`);
    return await fn(c);
  } finally {
    await c.end();
  }
}

const sql = (query, params) => withDb(async (c) => (await c.query(query, params)).rows);

// ล้างทุกตารางใน schema ทดสอบ (ก่อนเริ่มแต่ละไฟล์ทดสอบ)
async function resetSchema() {
  await withDb(async (c) => {
    const t = await c.query(`select table_name from information_schema.tables where table_schema=$1 and table_type='BASE TABLE'`, [SCHEMA]);
    if (t.rows.length) await c.query(`truncate ${t.rows.map((r) => `${SCHEMA}."${r.table_name}"`).join(", ")} restart identity cascade`);
  });
}

async function dropSchema() {
  const c = new Client({ connectionString: process.env.DIRECT_URL });
  await c.connect();
  await c.query(`drop schema if exists ${SCHEMA} cascade`);
  await c.end();
}

// สร้างผู้ใช้ + session แล้วคืน token สำหรับใส่ cookie
async function login(role, { coachId = null, email } = {}) {
  return withDb(async (c) => {
    const mail = email || `e2e-${role.toLowerCase()}-${crypto.randomBytes(3).toString("hex")}@test.invalid`;
    const uid = (await c.query(`insert into system_users (email, role, password_hash, coach_id) values ($1,$2,'x',$3) returning user_id`, [mail, role, coachId])).rows[0].user_id;
    const token = crypto.randomBytes(24).toString("hex");
    await c.query(`insert into sessions (session_token, user_id, expires_at) values ($1,$2, now() + interval '1 day')`, [token, uid]);
    return token;
  });
}

// เที่ยงคืนเวลาไทย ของวันนี้ + n วัน
function thaiMidnight(n = 0) {
  const d = new Date(Date.now() + 7 * 3600_000 + n * 86_400_000);
  return new Date(`${d.toISOString().slice(0, 10)}T00:00:00+07:00`);
}
const todayThai = () => new Date(Date.now() + 7 * 3600_000).toISOString().slice(0, 10);

// เบราว์เซอร์: BROWSER_PATH > Edge บน Windows > Chrome ที่ติดตั้งในเครื่อง (CI ของ GitHub มี Chrome อยู่แล้ว)
function browserOptions() {
  if (process.env.BROWSER_PATH) return { executablePath: process.env.BROWSER_PATH };
  const edge = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
  if (process.platform === "win32" && fs.existsSync(edge)) return { executablePath: edge };
  return { channel: "chrome" };
}

function createContext(browser, artifactsDir) {
  const results = [];
  const pageErrors = [];
  return {
    BASE,
    SCHEMA,
    sql,
    login,
    thaiMidnight,
    todayThai,
    artifactsDir,
    results,
    pageErrors,
    check(name, ok, extra = "") {
      results.push({ name, ok: !!ok, extra: String(extra ?? "") });
      console.log(`  ${ok ? "PASS" : "FAIL"}  ${name}${extra ? `  — ${extra}` : ""}`);
    },
    async page(token, viewport = { width: 1366, height: 900 }) {
      const ctx = await browser.newContext({ viewport, locale: "th-TH", acceptDownloads: true });
      if (token) await ctx.addCookies([{ name: "session_token", value: token, url: BASE }]);
      const p = await ctx.newPage();
      p.setDefaultTimeout(30_000);
      p.on("pageerror", (e) => pageErrors.push(`${p.url()}: ${e.message}`));
      return p;
    },
  };
}

module.exports = { ROOT, SCHEMA, PORT, BASE, schemaUrl, sql, withDb, resetSchema, dropSchema, login, thaiMidnight, todayThai, browserOptions, createContext };
