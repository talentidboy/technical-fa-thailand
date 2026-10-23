// Academy Licensing: นำเข้า Excel (รวมแถวเลื่อนระดับ / วันที่ 3 แบบ / ชื่อซ้ำคนละจังหวัด) → ทำเนียบสาธารณะ → หลังบ้าน
const path = require("path");
const { execFileSync } = require("child_process");
const ExcelJS = require("exceljs");

const ROOT = path.resolve(__dirname, "../..");
const day = (d) => new Date(d.getTime() + 7 * 3600_000).toISOString().slice(0, 10);

async function until(fn, timeout = 20_000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (await fn()) return true;
    await new Promise((r) => setTimeout(r, 400));
  }
  return false;
}

async function writeFixture(file) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("2026");
  const d = (y, m, dd) => new Date(Date.UTC(y, m - 1, dd));
  ws.addRow(["No.", "LEVEL", "Academy", "อคาเดมี", "จังหวัด", "ผู้ประสานงาน", "เบอร์โทรศัพท์", "อีเมล", "อนุญาต", "หมดอายุ", "หมายเหตุ"]);
  ws.addRow([1, "BRONZE", "Alpha Academy", "อัลฟา อคาเดมี", "กรุงเทพมหานคร", "คุณเอ", "0811111111", "alpha@test.invalid", d(2025, 1, 7), null, null]);
  ws.addRow([2, "GOLD", "ALPHA ACADEMY", "อัลฟา อคาเดมี", "กรุงเทพมหานคร", "คุณเอ", "0811111111", "alpha@test.invalid", "01/06/2025", null, "T1"]);
  ws.addRow([3, "BRONZE", "Same Name FC", "เซม เนม", "ราชบุรี", null, null, null, null, null, null]);
  ws.addRow([4, "BRONZE", "Same Name FC", "เซม เนม", "พระนครศรีอยุธยา", null, null, null, null, null, null]);
  ws.addRow(["-", null, "Pending Academy", null, null, null, null, null, d(2569, 8, 3), null, null]);
  ws.addRow([6, "SILVER", "Beta Academy", "เบต้า อคาเดมี", "ชลบุรี", "คุณบี", "0822222222", null, d(2025, 2, 1), d(2025, 12, 31), "เลื่อนระดับเป็น Gold"]);
  ws.addRow([]);
  ws.addRow([8, "BRONZE", "Gamma Academy", "แกมมา อคาเดมี", "เชียงใหม่", null, null, null, d(2026, 3, 1), null, "GAMMA FC / แกมมา เอฟซี"]);
  await wb.xlsx.writeFile(file);
}

module.exports = {
  name: "Academy Licensing: นำเข้า Excel + ทำเนียบ + หลังบ้าน",
  async run(ctx) {
    const { check, sql, BASE } = ctx;
    const licences = (name) =>
      sql(
        `select l.level, l.tier, l.status, l.note, to_char(l.approved_at + interval '7 hours', 'YYYY-MM-DD') approved, to_char(l.expires_at + interval '7 hours', 'YYYY-MM-DD') expires
         from academy_licences l join academies a on a.id = l.academy_id where a.name_en = $1 order by l.id`,
        [name],
      );
    const academyCount = async () => (await sql("select count(*)::int n from academies"))[0].n;

    // ===== 1) นำเข้า Excel =====
    const file = path.join(ctx.artifactsDir, "academy-fixture.xlsx");
    await writeFixture(file);
    const run = (...extra) =>
      execFileSync(process.execPath, [path.join(ROOT, "scripts/import-academies.cjs"), file, ...extra], {
        env: { ...process.env, TEST_DB_SCHEMA: ctx.SCHEMA },
        encoding: "utf8",
      });
    const dry = run();
    check("นำเข้า (ทดลอง): 7 แถว → 6 อคาเดมี 7 ใบอนุญาต", dry.includes("อคาเดมี 6 แห่ง") && dry.includes("ใบอนุญาต 7 ใบ"), dry.split("\n")[1]);
    check("ทดลองอ่านอย่างเดียว ไม่บันทึก", (await academyCount()) === 0);
    run("--apply");
    check("นำเข้าจริง: 6 อคาเดมี", (await academyCount()) === 6);
    const alpha = await licences("ALPHA ACADEMY");
    check(
      "แถวเลื่อนระดับรวมเป็นประวัติ (Bronze → Gold, ชื่อต่างตัวพิมพ์)",
      alpha.length === 2 && alpha.some((l) => l.level === "BRONZE" && l.status === "SUPERSEDED") && alpha.some((l) => l.level === "GOLD" && l.status === "ACTIVE" && l.tier === "T1"),
      JSON.stringify(alpha),
    );
    check("วันที่แบบข้อความ dd/mm/yyyy", alpha.find((l) => l.level === "GOLD")?.approved === "2025-06-01", alpha.find((l) => l.level === "GOLD")?.approved);
    check("วันที่ปี พ.ศ. 2569 → 2026", (await licences("Pending Academy"))[0]?.approved === "2026-08-03");
    check("ชื่อซ้ำคนละจังหวัด → แยกเป็น 2 อคาเดมี", (await sql("select count(*)::int n from academies where name_en='Same Name FC'"))[0].n === 2);
    check("หมายเหตุชื่ออื่น → ชื่อเรียกอื่น", (await sql("select aliases from academies where name_en='Gamma Academy'"))[0].aliases === "GAMMA FC / แกมมา เอฟซี");
    check("มีบันทึกการนำเข้า", (await sql("select count(*)::int n from audit_logs where action='ACADEMY_IMPORT'"))[0].n === 1);
    let refused = false;
    try {
      run("--apply");
    } catch {
      refused = true;
    }
    check("นำเข้าซ้ำถูกปฏิเสธ (ไม่มีข้อมูลซ้ำ)", refused && (await academyCount()) === 6);

    // ===== 2) หน้าสาธารณะ =====
    const pub = await ctx.page(null);
    await pub.goto(`${BASE}/academies`, { waitUntil: "networkidle", timeout: 240_000 });
    const html = await pub.content();
    check("ทำเนียบแสดงอคาเดมี", html.includes("ALPHA ACADEMY") && html.includes("Gamma Academy"));
    check("ไม่แสดงข้อมูลติดต่อส่วนบุคคล", !html.includes("0811111111") && !html.includes("alpha@test.invalid") && !html.includes("คุณเอ"));
    check("อคาเดมีที่ใบหมดอายุมีป้ายหมดอายุ", (await pub.locator("a", { hasText: "Beta Academy" }).innerText()).includes("หมดอายุ"));
    await pub.goto(`${BASE}/academies?level=GOLD`, { waitUntil: "networkidle" });
    const goldText = await pub.locator("#directory").innerText();
    check("กรองระดับ Gold", goldText.includes("ALPHA ACADEMY") && !goldText.includes("Gamma Academy"));
    await pub.goto(`${BASE}/academies?q=${encodeURIComponent("แกมมา เอฟซี")}`, { waitUntil: "networkidle" });
    check("ค้นหาด้วยชื่อเรียกอื่น", (await pub.locator("#directory").innerText()).includes("Gamma Academy"));

    // เกณฑ์มาตรฐาน (กล่องที่เปิดจากปุ่ม): ระดับทองแดงไม่มีข้อตกลงรับผู้ฝึกสอนดูงาน · กดระดับ Gold แล้วเห็น · ตารางเทียบ
    await pub.goto(`${BASE}/academies`, { waitUntil: "networkidle" });
    check("หน้าแรกไม่แสดงเกณฑ์ทั้งหมดจนกว่าจะกดปุ่ม", (await pub.getByText("Internship agreement").count()) === 0 && (await pub.getByRole("dialog").count()) === 0);
    await pub.locator("#levels").getByRole("button", { name: /ดูเกณฑ์/ }).first().click();
    const criteria = pub.getByRole("dialog");
    check("กดดูเกณฑ์ → เปิดกล่องเกณฑ์ (Bronze)", (await criteria.locator('[aria-label="ระดับ"] [aria-selected="true"]').innerText()).includes("Bronze"));
    check("เกณฑ์ Bronze ไม่มีข้อเฉพาะระดับทอง", (await criteria.getByText("Internship agreement").count()) === 0);
    await criteria.getByRole("tab", { name: /Gold/ }).click();
    check("เลือก Gold → เห็นเกณฑ์ระดับทอง + ป้ายเพิ่มใหม่", await until(async () => (await criteria.getByText("Internship agreement").count()) === 1, 3000));
    await criteria.getByRole("tab", { name: /^3\./ }).click();
    check("แยกดูทีละหมวด", (await criteria.getByText("Internship agreement").count()) === 0);
    await criteria.getByRole("button", { name: "ตารางเทียบ 3 ระดับ" }).click();
    check("ตารางเทียบ 3 ระดับ", (await criteria.locator("table th", { hasText: "ระดับทองแดง" }).count()) === 1);
    await pub.keyboard.press("Escape");
    check("กด Esc ปิดกล่องเกณฑ์", (await pub.getByRole("dialog").count()) === 0);
    await pub.goto(`${BASE}/academies?criteria=SILVER#criteria`, { waitUntil: "networkidle" });
    check("ลิงก์ ?criteria=SILVER เปิดกล่องเกณฑ์ระดับเงิน", (await pub.getByRole("dialog").locator('[aria-label="ระดับ"] [aria-selected="true"]').innerText()).includes("Silver"));
    await pub.getByRole("dialog").getByRole("button", { name: "ปิด", exact: true }).click();
    check("ปิดกล่อง → ลบ ?criteria ออกจากลิงก์", !pub.url().includes("criteria"), pub.url());

    const alphaId = (await sql("select id from academies where name_en='ALPHA ACADEMY'"))[0].id;
    await pub.goto(`${BASE}/academies/${alphaId}`, { waitUntil: "networkidle" });
    const profile = await pub.locator("main").innerText();
    check("หน้าโปรไฟล์: ระดับ + ไทยลีก + ประวัติ", profile.includes("FAT Gold Level Academy") && profile.includes("ประวัติการรับรอง") && (await pub.getByText("ไทยลีก 1").count()) > 0);
    check("หน้าโปรไฟล์ไม่มีเบอร์โทร", !(await pub.content()).includes("0811111111"));

    // ===== 3) สิทธิ์ =====
    const anon = await fetch(`${BASE}/academies/manage`, { redirect: "manual" });
    check("ยังไม่ล็อกอิน → หน้าจัดการพาไปเข้าสู่ระบบ", anon.status === 307 || anon.status === 302);
    const coachId = (await sql(`insert into coaches (name_th, surname_th, updated_at) values ('โค้ช','ทดสอบ', now()) returning id`))[0].id;
    const coach = await ctx.page(await ctx.login("COACH", { coachId }));
    await coach.goto(`${BASE}/academies/manage`, { waitUntil: "networkidle", timeout: 240_000 });
    check("โค้ชเข้าหน้าจัดการไม่ได้", new URL(coach.url()).pathname === "/academies");

    // ===== 4) หลังบ้าน =====
    const adminToken = await ctx.login("ADMIN");
    const ad = await ctx.page(adminToken);
    ad.on("dialog", (d) => d.accept());
    await ad.goto(`${BASE}/academies/manage`, { waitUntil: "networkidle", timeout: 240_000 });
    const manageText = await ad.locator("main").innerText();
    check("แสดงข้อมูลติดต่อในหลังบ้าน", manageText.includes("คุณเอ"));
    check(
      "รายการควรตรวจสอบครบ",
      manageText.includes("ยังไม่ระบุระดับ · 1") && manageText.includes("ไม่มีจังหวัด · 1") && manageText.includes("ยังไม่มีใบระดับใหม่ · 1"),
    );

    const submit = async (form, button) => {
      await form.evaluate((f) => f.querySelectorAll('[role="status"], [role="alert"]').forEach((el) => el.setAttribute("data-old", "1")));
      await form.getByRole("button", { name: button, exact: true }).click();
      return form
        .locator('[role="status"]:not([data-old]), [role="alert"]:not([data-old])')
        .filter({ hasNotText: "กำลังบันทึก" })
        .first()
        .innerText({ timeout: 30_000 })
        .catch(() => "ไม่มีผลลัพธ์");
    };

    // เพิ่มอคาเดมี + ใบอนุญาตใบแรก → ไปหน้ารายละเอียด
    await ad.locator("summary", { hasText: "เพิ่มอคาเดมีใหม่" }).click();
    const create = ad.locator("form", { has: ad.getByRole("button", { name: "เพิ่มอคาเดมี", exact: true }) });
    await create.locator('[name="nameEn"]').fill("Delta Academy");
    await create.locator('[name="nameTh"]').fill("เดลต้า อคาเดมี");
    await create.locator('[name="province"]').fill("ภูเก็ต");
    await create.locator('[name="phone"]').fill("0833333333");
    await create.locator('select[name="level"]').selectOption("SILVER");
    await create.locator('[name="approvedAt"]').fill(day(ctx.thaiMidnight(-100)));
    await create.getByRole("button", { name: "เพิ่มอคาเดมี", exact: true }).click();
    await ad.waitForURL(/\/academies\/manage\/\d+$/, { timeout: 60_000 });
    const deltaId = Number(new URL(ad.url()).pathname.split("/").pop());
    check("เพิ่มอคาเดมี + ใบแรก (Silver)", (await licences("Delta Academy")).map((l) => `${l.level}:${l.status}`).join() === "SILVER:ACTIVE");
    check("บันทึกการแก้ไข: เพิ่มอคาเดมี", (await sql("select count(*)::int n from audit_logs where action='ACADEMY_CREATE'"))[0].n === 1);

    // เลื่อนระดับเป็น Gold (แทนที่ใบเดิม) พร้อมวันหมดอายุใกล้ถึง
    const add = ad.locator("form", { has: ad.getByRole("button", { name: "ออกใบอนุญาต", exact: true }) });
    await add.locator('select[name="level"]').selectOption("GOLD");
    await add.locator('[name="approvedAt"]').fill(day(ctx.thaiMidnight(0)));
    await add.locator('[name="expiresAt"]').fill(day(ctx.thaiMidnight(30)));
    const addRes = await submit(add, "ออกใบอนุญาต");
    const delta = await licences("Delta Academy");
    check(
      "เลื่อนระดับ: ใบเดิมเปลี่ยนเป็นเลื่อนระดับแล้ว",
      delta.map((l) => `${l.level}:${l.status}`).join() === "SILVER:SUPERSEDED,GOLD:ACTIVE",
      `${addRes} ${JSON.stringify(delta)}`,
    );
    await ad.goto(`${BASE}/academies/manage?state=expiring`, { waitUntil: "networkidle" });
    check("ตัวกรองใกล้หมดอายุ", (await ad.locator("tbody").innerText()).includes("Delta Academy"));

    // แก้ข้อมูลอคาเดมี
    await ad.goto(`${BASE}/academies/manage/${deltaId}`, { waitUntil: "networkidle" });
    const info = ad.locator("form", { has: ad.getByRole("button", { name: "บันทึกข้อมูล", exact: true }) });
    await info.locator('[name="province"]').fill("พังงา");
    await submit(info, "บันทึกข้อมูล");
    const upd = await sql("select details from audit_logs where action='ACADEMY_UPDATE' order by id desc limit 1");
    check("แก้ไขจังหวัด + บันทึกค่าก่อน/หลัง", upd[0]?.details?.changes?.province?.[1] === "พังงา", JSON.stringify(upd[0]?.details));

    // ระงับใบอนุญาต → หายจากหน้าสาธารณะ
    await ad.locator("summary", { hasText: "แก้ไข / เปลี่ยนสถานะ" }).first().click();
    const editLicence = ad.locator("details[open] form").first();
    await editLicence.locator('select[name="status"]').selectOption("REVOKED");
    await submit(editLicence, "บันทึกใบอนุญาต");
    check("ระงับใบอนุญาต", (await licences("Delta Academy")).some((l) => l.level === "GOLD" && l.status === "REVOKED"));
    const revokedPage = await pub.goto(`${BASE}/academies/${deltaId}`, { waitUntil: "networkidle" });
    check("อคาเดมีที่ถูกระงับไม่มีหน้าสาธารณะ (404)", revokedPage.status() === 404);

    // ลบใบอนุญาตเก่า (กดยืนยัน)
    await ad.goto(`${BASE}/academies/manage/${deltaId}`, { waitUntil: "networkidle" });
    await ad.getByRole("button", { name: "ลบใบอนุญาต" }).last().click();
    check("ลบใบอนุญาต", await until(async () => (await licences("Delta Academy")).length === 1));
    check("ฟอร์มออกใบใหม่บังคับเลือกระดับ", (await ad.locator("form", { has: ad.getByRole("button", { name: "ออกใบอนุญาต", exact: true }) }).locator('select[name="level"]').getAttribute("required")) !== null);

    // ลบใบที่มีผลใบสุดท้าย (เช่น ออกใบใหม่ผิด) → ใบเดิมที่ถูกแทนที่กลับมามีผล ไม่หลุดจากทะเบียน
    await ad.goto(`${BASE}/academies/manage/${alphaId}`, { waitUntil: "networkidle" });
    await ad.getByRole("button", { name: "ลบใบอนุญาต" }).first().click();
    check(
      "ลบใบ Gold ที่มีผล → คืนใบ Bronze เดิมให้มีผล",
      await until(async () => (await licences("ALPHA ACADEMY")).map((l) => `${l.level}:${l.status}`).join() === "BRONZE:ACTIVE"),
      JSON.stringify(await licences("ALPHA ACADEMY")),
    );
    check("บันทึกการคืนใบเดิมไว้ในบันทึกการแก้ไข", !!(await sql(`select 1 from audit_logs where action='ACADEMY_LICENCE_DELETE' and summary like '%คืนใบ Bronze%'`))[0]);

    // ข้อมูลค้าง: ใบถูกแทนที่หมดแต่ไม่มีใบใหม่ → แจ้งในรายการควรตรวจสอบ + ปุ่มคืนสถานะในหน้าอคาเดมี
    await sql(`update academy_licences set status='SUPERSEDED' where academy_id=$1`, [alphaId]);
    await ad.goto(`${BASE}/academies/manage?issue=no-active`, { waitUntil: "networkidle" });
    check("รายการควรตรวจสอบ: ไม่มีใบที่มีผล", (await ad.locator("tbody").innerText()).includes("ALPHA ACADEMY"));
    await ad.goto(`${BASE}/academies/manage/${alphaId}`, { waitUntil: "networkidle" });
    check("หน้าอคาเดมีแจ้งว่าไม่มีใบที่มีผล", (await ad.getByRole("alert").filter({ hasText: "ไม่มีใบอนุญาตที่มีผล" }).count()) === 1);
    await ad.getByRole("button", { name: "คืนสถานะใบนี้เป็นมีผล" }).click();
    check("กดคืนสถานะ → ใบกลับมามีผล", await until(async () => (await licences("ALPHA ACADEMY"))[0]?.status === "ACTIVE"));

    // ส่งออก Excel (เฉพาะแอดมิน)
    const xres = await fetch(`${BASE}/academies/manage/export`, { headers: { cookie: `session_token=${adminToken}` } });
    const xwb = new ExcelJS.Workbook();
    if (xres.ok) await xwb.xlsx.load(Buffer.from(await xres.arrayBuffer()));
    const xs = xwb.getWorksheet("ทะเบียนอคาเดมี");
    check("ส่งออก Excel ครบทุกอคาเดมี + มีเบอร์ติดต่อ", xres.ok && xs?.rowCount === 8 && JSON.stringify(xs.getSheetValues()).includes("0811111111"), `${xres.status} rows=${xs?.rowCount}`);

    // ปิดการแสดง → หายจากทำเนียบ · ลบอคาเดมี
    const gammaId = (await sql("select id from academies where name_en='Gamma Academy'"))[0].id;
    await ad.goto(`${BASE}/academies/manage/${gammaId}`, { waitUntil: "networkidle" });
    await ad.getByRole("button", { name: "ปิดการแสดงบนหน้าสาธารณะ" }).click();
    check("ปิดการแสดง", await until(async () => (await sql("select active from academies where id=$1", [gammaId]))[0].active === false));
    await pub.goto(`${BASE}/academies`, { waitUntil: "networkidle" });
    check("อคาเดมีที่ปิดการแสดงไม่อยู่ในทำเนียบ", !(await pub.locator("#directory").innerText()).includes("Gamma Academy"));
    await ad.goto(`${BASE}/academies/manage/${deltaId}`, { waitUntil: "networkidle" });
    await ad.getByRole("button", { name: "ลบอคาเดมี" }).click();
    await ad.waitForURL(/\/academies\/manage$/, { timeout: 30_000 });
    check("ลบอคาเดมี + เก็บสำเนาในบันทึก", (await academyCount()) === 6 && (await sql("select count(*)::int n from audit_logs where action='ACADEMY_DELETE'"))[0].n === 1);

    // มือถือ: ทำเนียบไม่ล้นแนวนอน
    const mobile = await ctx.page(null, { width: 390, height: 844 });
    await mobile.goto(`${BASE}/academies`, { waitUntil: "networkidle" });
    const overflow = await mobile.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    check("มือถือ: ทำเนียบไม่ล้นแนวนอน", overflow <= 0, `${overflow}px`);
    await mobile.screenshot({ path: path.join(ctx.artifactsDir, "academies-mobile.png"), fullPage: true });
    await pub.goto(`${BASE}/academies`, { waitUntil: "networkidle" });
    await pub.screenshot({ path: path.join(ctx.artifactsDir, "academies-desktop.png"), fullPage: true });
    await ad.goto(`${BASE}/academies/manage`, { waitUntil: "networkidle" });
    await ad.screenshot({ path: path.join(ctx.artifactsDir, "academies-manage.png"), fullPage: true });

    const errors = await sql("select count(*)::int n from error_logs where source='SERVER'");
    check("ไม่มี error ฝั่งเซิร์ฟเวอร์", errors[0].n === 0, JSON.stringify(await sql("select path, message from error_logs limit 3")));
  },
};
