// รายงานสรุปการอบรม: ตัวเลขตรงกับฐานข้อมูล, ภูมิภาค, รุ่นอบรม/อัตราผ่าน, ไฟล์ Excel, ตรวจข้อมูลผิดปกติ + แก้ปี พ.ศ.
const path = require("path");
const ExcelJS = require("exceljs");

const Y = "extract(year from issue_date + interval '7 hours')";

module.exports = {
  name: "รายงานสรุปการอบรม",
  async run(ctx) {
    const { check, sql, BASE } = ctx;
    const year = new Date(Date.now() + 7 * 3600_000).getUTCFullYear();
    const d = (y, md = "03-15") => new Date(`${y}-${md}T00:00:00+07:00`);

    // โค้ช 4 ภาค + ไม่ระบุจังหวัด
    const coaches = [];
    for (const [name, gender, prov] of [["เหนือ", "MALE", "50"], ["อีสาน", "FEMALE", "40"], ["กลาง", "MALE", "10"], ["ใต้", "MALE", "90"], ["ไม่ระบุ", null, null]]) {
      coaches.push((await sql(`insert into coaches (name_th, surname_th, gender, province_code, updated_at) values ($1,'ทดสอบ',$2,$3, now()) returning id`, [name, gender, prov]))[0].id);
    }
    const lic = (coach, type, issue) => sql(`insert into license_records (coach_id, license_type, record_type, issue_date, expire_date) values ($1,$2,'TRAINING',$3,$4)`, [coach, type, issue, null]);
    await lic(coaches[0], "G", d(year - 3)); // ใบแรก
    await lic(coaches[0], "C", d(year - 1)); // อัปเกรด
    await lic(coaches[1], "G", d(year));
    await lic(coaches[2], "C", d(year - 2));
    await lic(coaches[2], "B", d(year));
    await lic(coaches[3], "GK_I", d(year - 4));
    await lic(coaches[4], "G", d(year - 8)); // นอกช่วง 5 ปี
    // ข้อมูลผิดปกติ: ปี พ.ศ. / ไม่มีวันที่ / อนาคต
    await lic(coaches[4], "G", d(year + 543, "09-06"));
    await lic(coaches[4], "C", null);
    await lic(coaches[3], "C", d(year + 30));
    // ชื่อซ้ำ 2 ประวัติ (อาจเป็นคนเดียวกัน)
    for (const idn of [null, "1234567890123"]) await sql(`insert into coaches (name_th, surname_th, id_number, updated_at) values ('ซ้ำ','ชื่อเดียวกัน',$1, now())`, [idn]);
    // รุ่นอบรม: ผ่าน 3 ไม่ผ่าน 1
    const course = (await sql("insert into courses (course_type, license_type, title) values ('LICENSE','C','AFC C Diploma') returning id"))[0].id;
    const sess = (await sql("insert into course_sessions (course_id, name, start_date, end_date, status) values ($1,'รุ่นทดสอบ',$2,$3,'COMPLETED') returning id", [course, d(year), d(year, "03-20")]))[0].id;
    for (const [i, c] of coaches.slice(0, 4).entries()) await sql("insert into applications (coach_id, course_session_id, status) values ($1,$2,$3)", [c, sess, i < 3 ? "PASSED" : "FAILED"]);

    const expected = async (a, b) =>
      (await sql(`select count(*)::int n from license_records where issue_date is not null and ${Y} between $1 and $2 and issue_date <= now() + interval '1 day'`, [a, b]))[0].n;
    const kpi = async (p, label) => {
      const c = p.locator("div.rounded-2xl", { hasText: label }).filter({ has: p.locator("p.text-2xl") }).first();
      return Number((await c.locator("p.text-2xl").innerText()).replace(/,/g, ""));
    };

    const ad = await ctx.page(await ctx.login("ADMIN"));
    await ad.goto(`${BASE}/reports`, { waitUntil: "networkidle", timeout: 240_000 });
    const exp5 = await expected(year - 4, year);
    check("ใบอนุญาตที่ออก (5 ปี) ตรงกับฐานข้อมูล", (await kpi(ad, "ใบอนุญาตที่ออก")) === exp5, `${await kpi(ad, "ใบอนุญาตที่ออก")} vs ${exp5}`);
    // ใบแรกในช่วง 5 ปี: เหนือ(G), อีสาน(G), กลาง(C), ใต้(GK_I) = 4 · อัปเกรด: เหนือ G→C, กลาง C→B = 2
    check("ผู้ฝึกสอนใหม่ / อัปเกรด", (await kpi(ad, "ผู้ฝึกสอนใหม่ (ใบแรก)")) === 4 && (await kpi(ad, "อัปเกรดระดับ")) === 2);
    let txt = await ad.locator("main").innerText();
    check("ตารางภูมิภาคครบ 6 ภาค + ไม่ระบุจังหวัด", ["ภาคเหนือ", "ภาคตะวันออกเฉียงเหนือ", "ภาคกลาง", "ภาคตะวันออก", "ภาคตะวันตก", "ภาคใต้", "ไม่ระบุจังหวัด"].every((x) => txt.includes(x)));
    check("รุ่นอบรม: อัตราผ่าน 75%", txt.includes("รุ่นทดสอบ") && txt.includes("75%"));
    check("ข้อมูลที่ควรตรวจสอบ 3 รายการ (พ.ศ. / ไม่มีวันที่ / อนาคต)", txt.includes("ข้อมูลที่ควรตรวจสอบ (3 รายการ)") && txt.includes(`ปีเป็น พ.ศ. ${year + 543}`));

    check("รายการผู้ฝึกสอนที่อาจซ้ำกัน", txt.includes("ผู้ฝึกสอนที่อาจซ้ำกัน (1 ชื่อ)") && txt.includes("ไม่มีเลขบัตร") && txt.includes("มีเลขบัตร"));

    await Promise.all([ad.waitForURL(new RegExp(`from=${year}&to=${year}`)), ad.getByRole("link", { name: "ปีนี้", exact: true }).click()]);
    await ad.waitForLoadState("networkidle");
    check("ปุ่มปีนี้ ตรงกับฐานข้อมูล", (await kpi(ad, "ใบอนุญาตที่ออก")) === (await expected(year, year)));

    // Excel
    await ad.goto(`${BASE}/reports?from=${year - 4}&to=${year}`, { waitUntil: "networkidle" });
    const [dl] = await Promise.all([ad.waitForEvent("download"), ad.getByRole("link", { name: "ดาวน์โหลด Excel" }).click()]);
    const file = path.join(ctx.artifactsDir, "report.xlsx");
    await dl.saveAs(file);
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile(file);
    const names = wb.worksheets.map((w) => w.name);
    check("Excel มีครบทุกชีต", ["สรุป", "ตามปีและระดับ", "ตามภูมิภาค", "ตามเพศ", "รุ่นอบรม", "รายชื่อผู้ได้รับใบอนุญาต", "ข้อมูลควรตรวจสอบ", "อาจซ้ำกัน"].every((n) => names.includes(n)), names.join(","));
    check("Excel รายชื่อ = จำนวนใบที่ออก", wb.getWorksheet("รายชื่อผู้ได้รับใบอนุญาต").rowCount - 1 === exp5);

    // เจ้าหน้าที่ดูได้ แต่ไม่มีปุ่มแก้ข้อมูล
    const stf = await ctx.page(await ctx.login("STAFF"));
    await stf.goto(`${BASE}/reports`, { waitUntil: "networkidle" });
    check("เจ้าหน้าที่ดูได้ ไม่มีปุ่มแก้ปี", (await stf.locator("main").innerText()).includes("รายงานสรุปการอบรม") && (await stf.getByRole("button", { name: /แก้ปี พ.ศ./ }).count()) === 0);

    // แก้ปี พ.ศ.
    ad.on("dialog", (dialog) => dialog.accept());
    await ad.getByRole("button", { name: /แก้ปี พ.ศ./ }).click();
    await ad.waitForTimeout(3000);
    check("แก้ปี พ.ศ. → ค.ศ. แล้ว", (await sql(`select count(*)::int n from license_records where ${Y} >= 2400`))[0].n === 0);
    await ad.reload({ waitUntil: "networkidle" });
    txt = await ad.locator("main").innerText();
    check("รายการที่ต้องตรวจสอบเหลือ 2", txt.includes("ข้อมูลที่ควรตรวจสอบ (2 รายการ)"));

    const ph = await ctx.page(await ctx.login("ADMIN"), { width: 390, height: 844 });
    await ph.goto(`${BASE}/reports`, { waitUntil: "networkidle" });
    check("มือถือ: ไม่มีเลื่อนซ้ายขวา", (await ph.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)) <= 0);
  },
};
