// นำเข้าทะเบียนอคาเดมีจากไฟล์ Excel (Academy Licensing Database) เข้าระบบ Academy Licensing
//   node scripts/import-academies.cjs "<ไฟล์.xlsx>"                  → ทดลองอ่าน (ไม่บันทึก) แสดงรายงาน
//   node scripts/import-academies.cjs "<ไฟล์.xlsx>" --apply          → บันทึกจริง (ระบบต้องยังไม่มีอคาเดมี)
//   เพิ่ม --report <ไฟล์.txt> เพื่อเขียนรายงานละเอียด · TEST_DB_SCHEMA=<schema> ใช้กับ schema ทดสอบ
//
// กติกาการแปลงข้อมูล
// - วันที่: รับทั้งเซลล์วันที่, ข้อความ dd/mm/yyyy และปี พ.ศ. (เกิน 2400 → ลบ 543) · เก็บเป็นเที่ยงคืนเวลาไทย
// - ชื่อ (อังกฤษ) ซ้ำ + จังหวัดเดียวกัน (หรือแถวหนึ่งไม่มีจังหวัด) = อคาเดมีเดียวกันที่เลื่อนระดับ → รวมเป็นประวัติใบอนุญาต
//   ใบระดับสูงสุด/ล่าสุดมีผล ใบก่อนหน้าเป็น "เลื่อนระดับแล้ว" · ชื่อซ้ำแต่คนละจังหวัด = คนละอคาเดมี
// - หมายเหตุ T1/T2/T3 → ระดับย่อย · "เลื่อนระดับเป็น ..." → หมายเหตุของใบอนุญาต · "Last update ..." ไม่นำเข้า
//   หมายเหตุอื่นที่มี "/" → ชื่อเรียกอื่น
const path = require("path");
const fs = require("fs");

const ROOT = path.resolve(__dirname, "..");
require(path.join(ROOT, "node_modules/dotenv")).config({ path: path.join(ROOT, ".env"), quiet: true });
const ExcelJS = require("exceljs");
const { Client } = require("pg");

const LEVEL_RANK = { BRONZE: 1, SILVER: 2, GOLD: 3 };
const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith("--") && args[args.indexOf(a) - 1] !== "--report");
const apply = args.includes("--apply");
const reportFile = args.includes("--report") ? args[args.indexOf("--report") + 1] : null;

const pad = (n) => String(n).padStart(2, "0");

function cellValue(v) {
  if (v == null) return null;
  if (v instanceof Date) return v;
  if (typeof v === "object") {
    if (Array.isArray(v.richText)) return v.richText.map((t) => t.text).join("");
    if ("text" in v) return v.text; // เซลล์ลิงก์ (อีเมล)
    if ("result" in v) return v.result; // เซลล์สูตร
  }
  return v;
}

function text(v) {
  const x = cellValue(v);
  if (x == null || x instanceof Date) return null;
  const s = String(x).replace(/\s+/g, " ").trim();
  return s || null;
}

// คืน { date, kind } — kind: "cell" | "text" | "be" (ปี พ.ศ.) | "bad"
function parseDate(v) {
  const x = cellValue(v);
  if (x == null || x === "") return { date: null, kind: null };
  const make = (y, m, d, kind) => {
    const be = y > 2400;
    const year = be ? y - 543 : y;
    if (year < 1990 || year > 2100 || m < 1 || m > 12 || d < 1 || d > 31) return { date: null, kind: "bad", raw: String(x) };
    const date = new Date(`${year}-${pad(m)}-${pad(d)}T00:00:00+07:00`);
    return Number.isNaN(date.getTime()) ? { date: null, kind: "bad", raw: String(x) } : { date, kind: be ? "be" : kind };
  };
  // เซลล์วันที่ของ Excel → ใช้วันที่ตามปฏิทิน (ไม่สนเวลา)
  if (x instanceof Date) return make(x.getUTCFullYear(), x.getUTCMonth() + 1, x.getUTCDate(), "cell");
  const s = String(x).trim();
  let m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
  if (m) return make(+m[3], +m[2], +m[1], "text");
  m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return make(+m[1], +m[2], +m[3], "text");
  return { date: null, kind: "bad", raw: s };
}

// เทียบชื่อโดยไม่สนตัวพิมพ์ ช่องว่าง และเครื่องหมาย (เช่น "KHAWFANGACADEMY" = "Khawfang Academy")
const nameKey = (s) => s.toLowerCase().replace(/[^a-z0-9ก-๙]+/g, "");
const pickLatest = (rows, field) => rows.reduce((v, r) => r[field] ?? v, null);

async function readRows(xlsxPath) {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(xlsxPath);
  const ws = wb.worksheets[0];
  const rows = [];
  ws.eachRow({ includeEmpty: false }, (row, n) => {
    if (n === 1) return;
    const c = (i) => row.getCell(i).value;
    const nameEn = text(c(3));
    const nameTh = text(c(4));
    if (!nameEn && !nameTh) return; // แถวว่าง
    const approved = parseDate(c(9));
    const expires = parseDate(c(10));
    const levelRaw = (text(c(2)) ?? "").toUpperCase();
    const no = cellValue(c(1));
    rows.push({
      sheetRow: n,
      registryNo: typeof no === "number" && Number.isInteger(no) ? no : null,
      level: LEVEL_RANK[levelRaw] ? levelRaw : null,
      nameEn: nameEn ?? nameTh,
      nameTh,
      province: text(c(5)),
      contactName: text(c(6)),
      phone: text(c(7)),
      email: text(c(8)),
      approved,
      expires,
      note: text(c(11)),
    });
  });
  return { sheet: ws.name, rows };
}

function build(rows) {
  const flags = [];
  const groups = new Map();
  for (const r of rows) {
    const k = nameKey(r.nameEn);
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(r);
  }

  // แยกเป็นอคาเดมี: ชื่อเดียวกันแต่คนละจังหวัด = คนละแห่ง
  const clusters = [];
  for (const list of groups.values()) {
    const provinces = [...new Set(list.map((r) => r.province).filter(Boolean))];
    if (provinces.length <= 1) {
      clusters.push(list);
      continue;
    }
    for (const p of provinces) clusters.push(list.filter((r) => r.province === p));
    flags.push(`ชื่อซ้ำแต่คนละจังหวัด → แยกเป็นคนละอคาเดมี: ${list[0].nameEn} (${provinces.join(", ")})`);
    for (const r of list.filter((x) => !x.province)) {
      clusters.push([r]);
      flags.push(`แถว ${r.sheetRow} ${r.nameEn}: ไม่มีจังหวัด และมีชื่อซ้ำหลายจังหวัด — แยกไว้ ควรตรวจสอบ`);
    }
  }

  const academies = clusters.map((list) => {
    const sorted = [...list].sort((a, b) => a.sheetRow - b.sheetRow);
    let aliases = null;
    let note = null;
    const licences = sorted.map((r) => {
      let tier = null;
      let licenceNote = null;
      if (r.note) {
        if (/^T\d$/i.test(r.note)) tier = r.note.toUpperCase();
        else if (/^last update/i.test(r.note)) {
          /* หมายเหตุของไฟล์ ไม่ใช่ของอคาเดมี */
        } else if (/เลื่อนระดับ/.test(r.note)) licenceNote = r.note;
        else if (r.note.includes("/")) aliases = r.note;
        else note = r.note;
      }
      return {
        level: r.level,
        tier,
        registryNo: r.registryNo,
        approvedAt: r.approved.date,
        expiresAt: r.expires.date,
        note: licenceNote,
        sheetRow: r.sheetRow,
      };
    });
    // ใบระดับสูงสุด (เท่ากันใช้ใบอนุมัติล่าสุด/แถวล่างสุด) มีผล ที่เหลือ = เลื่อนระดับแล้ว
    licences.sort(
      (a, b) =>
        (LEVEL_RANK[a.level] ?? 0) - (LEVEL_RANK[b.level] ?? 0) ||
        (a.approvedAt?.getTime() ?? 0) - (b.approvedAt?.getTime() ?? 0) ||
        a.sheetRow - b.sheetRow,
    );
    licences.forEach((l, i) => (l.status = i === licences.length - 1 ? "ACTIVE" : "SUPERSEDED"));
    const top = licences[licences.length - 1];
    for (const l of licences) {
      const m = l.note?.match(/เลื่อนระดับเป็น\s*(bronze|silver|gold)/i);
      if (m && (LEVEL_RANK[m[1].toUpperCase()] ?? 0) > (LEVEL_RANK[top.level] ?? 0)) {
        flags.push(`แถว ${l.sheetRow} ${sorted[0].nameEn}: หมายเหตุ "${l.note}" แต่ไม่พบแถวระดับใหม่ — ระดับปัจจุบันยังเป็น ${top.level ?? "ไม่ระบุ"}`);
      }
    }
    return {
      nameEn: sorted[sorted.length - 1].nameEn,
      nameTh: pickLatest(sorted, "nameTh"),
      province: pickLatest(sorted, "province"),
      contactName: pickLatest(sorted, "contactName"),
      phone: pickLatest(sorted, "phone"),
      email: pickLatest(sorted, "email"),
      aliases,
      note,
      merged: sorted.length > 1 ? sorted.map((r) => `${r.level ?? "ไม่ระบุ"}(แถว ${r.sheetRow})`).join(" → ") : null,
      licences,
    };
  });

  for (const r of rows) {
    if (r.approved.kind === "bad") flags.push(`แถว ${r.sheetRow} ${r.nameEn}: อ่านวันที่อนุมัติไม่ได้ "${r.approved.raw}"`);
    if (r.expires.kind === "bad") flags.push(`แถว ${r.sheetRow} ${r.nameEn}: อ่านวันหมดอายุไม่ได้ "${r.expires.raw}"`);
  }
  const emailOwners = new Map();
  for (const a of academies) if (a.email) emailOwners.set(a.email.toLowerCase(), [...(emailOwners.get(a.email.toLowerCase()) ?? []), a.nameEn]);
  for (const [email, names] of emailOwners) if (names.length > 1) flags.push(`อีเมลเดียวกันหลายอคาเดมี (${email.replace(/^(.{2}).*@/, "$1***@")}): ${names.join(", ")}`);

  const count = (fn) => rows.filter(fn).length;
  const stats = {
    rows: rows.length,
    academies: academies.length,
    licences: academies.reduce((n, a) => n + a.licences.length, 0),
    merged: academies.filter((a) => a.merged).length,
    levels: Object.fromEntries(
      ["GOLD", "SILVER", "BRONZE", null].map((l) => [l ?? "ไม่ระบุ", academies.filter((a) => a.licences[a.licences.length - 1].level === l).length]),
    ),
    beDates: count((r) => r.approved.kind === "be" || r.expires.kind === "be"),
    textDates: count((r) => r.approved.kind === "text" || r.expires.kind === "text"),
    noDate: count((r) => !r.approved.date),
    noProvince: academies.filter((a) => !a.province).length,
    noContact: academies.filter((a) => !a.phone && !a.email).length,
  };
  return { academies, flags, stats };
}

async function main() {
  if (!file) throw new Error('ระบุไฟล์ Excel เช่น node scripts/import-academies.cjs "Academy Licensing Database.xlsx"');
  const { sheet, rows } = await readRows(file);
  const { academies, flags, stats } = build(rows);

  const lines = [
    `ไฟล์: ${path.basename(file)} · ชีต "${sheet}"`,
    `แถวที่มีข้อมูล ${stats.rows} → อคาเดมี ${stats.academies} แห่ง · ใบอนุญาต ${stats.licences} ใบ (รวมแถวเลื่อนระดับ ${stats.merged} แห่ง)`,
    `ระดับปัจจุบัน: ${Object.entries(stats.levels)
      .map(([k, v]) => `${k} ${v}`)
      .join(" · ")}`,
    `วันที่: แปลงปี พ.ศ. ${stats.beDates} แถว · ข้อความ dd/mm/yyyy ${stats.textDates} แถว · ไม่มีวันที่อนุมัติ ${stats.noDate} แถว`,
    `ข้อมูลไม่ครบ: ไม่มีจังหวัด ${stats.noProvince} แห่ง · ไม่มีเบอร์/อีเมล ${stats.noContact} แห่ง`,
    `ควรตรวจสอบ ${flags.length} รายการ`,
  ];
  console.log(lines.join("\n"));
  if (reportFile) {
    const merged = academies.filter((a) => a.merged).map((a) => `  ${a.nameEn}: ${a.merged}`);
    fs.writeFileSync(reportFile, [...lines, "", "รวมแถวเลื่อนระดับ:", ...merged, "", "ควรตรวจสอบ:", ...flags.map((f) => `  - ${f}`)].join("\n"));
    console.log(`รายงานละเอียด → ${reportFile}`);
  }
  if (!apply) {
    console.log("(ทดลองอ่านเท่านั้น — เพิ่ม --apply เพื่อบันทึก)");
    return;
  }

  const schema = process.env.TEST_DB_SCHEMA;
  if (schema && !/^[a-z_][a-z0-9_]*$/.test(schema)) throw new Error("TEST_DB_SCHEMA ไม่ถูกต้อง");
  const c = new Client({ connectionString: process.env.DIRECT_URL });
  await c.connect();
  try {
    if (schema) await c.query(`set search_path to ${schema}`);
    const existing = (await c.query("select count(*)::int n from academies")).rows[0].n;
    if (existing) throw new Error(`ในระบบมีอคาเดมีอยู่แล้ว ${existing} แห่ง — ไม่นำเข้าซ้ำ`);
    const iso = (d) => (d ? d.toISOString() : null); // เก็บแบบ UTC ให้ตรงกับที่ Prisma เขียน
    await c.query("begin");
    for (const a of academies) {
      const id = (
        await c.query(
          `insert into academies (name_en, name_th, aliases, province, contact_name, phone, email, note, updated_at)
           values ($1,$2,$3,$4,$5,$6,$7,$8, now()) returning id`,
          [a.nameEn, a.nameTh, a.aliases, a.province, a.contactName, a.phone, a.email, a.note],
        )
      ).rows[0].id;
      for (const l of a.licences)
        await c.query(
          `insert into academy_licences (academy_id, level, tier, registry_no, approved_at, expires_at, status, note, updated_at)
           values ($1,$2,$3,$4,$5,$6,$7,$8, now())`,
          [id, l.level, l.tier, l.registryNo, iso(l.approvedAt), iso(l.expiresAt), l.status, l.note],
        );
    }
    await c.query(`insert into audit_logs (actor_email, action, summary, details) values ($1, 'ACADEMY_IMPORT', $2, $3)`, [
      "import-script",
      `นำเข้าทะเบียนอคาเดมีจาก ${path.basename(file)}: ${stats.academies} แห่ง ใบอนุญาต ${stats.licences} ใบ`,
      JSON.stringify({ file: path.basename(file), ...stats, flags: flags.length }),
    ]);
    await c.query("commit");
    console.log(`✓ บันทึกแล้ว: อคาเดมี ${stats.academies} แห่ง · ใบอนุญาต ${stats.licences} ใบ`);
  } catch (err) {
    await c.query("rollback").catch(() => {});
    throw err;
  } finally {
    await c.end();
  }
}

main().catch((err) => {
  console.error("✗ นำเข้าไม่สำเร็จ:", err.message);
  process.exitCode = 1;
});
