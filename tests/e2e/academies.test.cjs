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
    check("กดดูเกณฑ์จากการ์ด → เปิดกล่องเกณฑ์เฉพาะระดับ Bronze", (await criteria.locator("[data-level-lock]").innerText()).includes("Bronze") && (await criteria.locator('[aria-label="ระดับ"]').count()) === 0);
    check("เกณฑ์ Bronze ไม่มีข้อเฉพาะระดับทอง", (await criteria.getByText("Internship agreement").count()) === 0);
    const box = await criteria.boundingBox();
    check("กล่องเกณฑ์ลอยอยู่กลางจอ (ไม่ติดในการ์ด) + ปุ่มปิดกดได้", !!box && box.y >= 0 && (await criteria.getByRole("button", { name: "ปิด", exact: true }).isVisible()));
    await criteria.getByRole("button", { name: "ปิด", exact: true }).click();
    check("กดปิด → กล่องหาย", (await pub.getByRole("dialog").count()) === 0);
    await pub.locator("#map").getByRole("button", { name: "เกณฑ์มาตรฐาน", exact: true }).click();
    check("ปุ่มเกณฑ์มาตรฐาน (ฮีโร่) → เลือกได้ทุกระดับ เริ่มที่ Bronze", (await criteria.locator('[aria-label="ระดับ"] [aria-selected="true"]').innerText()).includes("Bronze"));
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
    const openTab = (id, tab) => ad.goto(`${BASE}/academies/manage/${id}${tab ? `?tab=${tab}` : ""}`, { waitUntil: "networkidle" });

    // ภาพรวม: เมนูซ้ายครบ + งานที่ต้องทำ
    await ad.goto(`${BASE}/academies/manage`, { waitUntil: "networkidle", timeout: 240_000 });
    const nav = await ad.getByRole("navigation", { name: "เมนูจัดการ" }).innerText();
    check("เมนูจัดการครบทุกหน้า", ["ภาพรวม", "อคาเดมี", "ใบอนุญาต", "ใบสมัคร", "บัญชีอคาเดมี", "บันทึกการแก้ไข"].every((x) => nav.includes(x)), nav.replace(/\n/g, " | "));
    check("ภาพรวม: งานที่ต้องทำ + ข้อมูลที่ควรตรวจสอบ", (await ad.locator("main").innerText()).includes("ข้อมูลในทะเบียนที่ควรตรวจสอบ"));
    await ad.goto(`${BASE}/academies/manage?state=expired`, { waitUntil: "networkidle" });
    check("ลิงก์เดิม /academies/manage?state= → ส่งไปหน้าทะเบียน", new URL(ad.url()).pathname === "/academies/manage/academies" && ad.url().includes("state=expired"));

    // ทะเบียน
    await ad.goto(`${BASE}/academies/manage/academies`, { waitUntil: "networkidle" });
    const manageText = await ad.locator("main").innerText();
    check("แสดงข้อมูลติดต่อในหลังบ้าน", manageText.includes("คุณเอ"));
    check(
      "รายการควรตรวจสอบครบ",
      manageText.includes("ยังไม่ระบุระดับ · 1") && manageText.includes("ไม่มีจังหวัด · 1") && manageText.includes("ยังไม่มีใบระดับใหม่ · 1"),
    );

    // เพิ่มอคาเดมี (หน้าแยก) + ใบอนุญาตใบแรก → ไปหน้ารายละเอียด · เลขที่ออกให้อัตโนมัติ
    await ad.getByRole("link", { name: "เพิ่มอคาเดมี" }).first().click();
    await ad.waitForURL(/\/academies\/manage\/academies\/new$/);
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
    const silverNo = (await sql(`select licence_no from academy_licences where academy_id=$1`, [deltaId]))[0]?.licence_no;
    check("เพิ่มอคาเดมี + ใบแรก (Silver)", (await licences("Delta Academy")).map((l) => `${l.level}:${l.status}`).join() === "SILVER:ACTIVE");
    check("เลขที่ใบอนุญาตรูปแบบมาตรฐาน (FAT-S-ปี-0001)", /^FAT-S-\d{4}-0001$/.test(silverNo ?? ""), silverNo);
    check("บันทึกการแก้ไข: เพิ่มอคาเดมี", (await sql("select count(*)::int n from audit_logs where action='ACADEMY_CREATE'"))[0].n === 1);
    const tabText = await ad.getByRole("navigation", { name: "แท็บ" }).innerText();
    check("หน้ารายละเอียดแยกเป็นแท็บ", ["ภาพรวม", "ข้อมูลอคาเดมี", "ใบอนุญาต", "บุคลากรและทีม", "ใบสมัคร", "บัญชีผู้ดูแล", "ประวัติการแก้ไข"].every((x) => tabText.includes(x)), tabText.replace(/\n/g, " | "));

    // คำสั่งใบอนุญาต: เปลี่ยนระดับ (ระดับเดิมเลือกไม่ได้) → ใบเดิมถูกแทนที่อัตโนมัติ
    await openTab(deltaId, "licences");
    await ad.getByRole("button", { name: "เปลี่ยนระดับ", exact: true }).click();
    const change = ad.locator("form", { has: ad.getByRole("button", { name: "ยืนยันเปลี่ยนระดับ" }) });
    check("เปลี่ยนระดับ: ไม่มีระดับเดิมให้เลือก", (await change.locator('select[name="level"] option[value="SILVER"]').count()) === 0);
    await change.locator('select[name="level"]').selectOption("GOLD");
    await change.locator('[name="expiresAt"]').fill(day(ctx.thaiMidnight(30)));
    const changeRes = await submit(change, "ยืนยันเปลี่ยนระดับ");
    const delta = await licences("Delta Academy");
    check("เปลี่ยนระดับ: ใบเดิมเปลี่ยนเป็นเลื่อนระดับแล้ว", delta.map((l) => `${l.level}:${l.status}`).join() === "SILVER:SUPERSEDED,GOLD:ACTIVE", `${changeRes} ${JSON.stringify(delta)}`);
    check("ใบใหม่ได้เลขที่ FAT-G + หมายเหตุที่มา", !!(await sql(`select 1 from academy_licences where academy_id=$1 and licence_no like 'FAT-G-%' and note like 'เปลี่ยนระดับจาก Silver%'`, [deltaId]))[0]);
    await ad.goto(`${BASE}/academies/manage/licences?tab=expiring`, { waitUntil: "networkidle" });
    check("หน้าใบอนุญาต: แท็บใกล้หมดอายุ", (await ad.locator("tbody").innerText()).includes("Delta Academy"));

    // ต่ออายุ: ระดับคงเดิม ใบเดิมถูกแทนที่
    await openTab(deltaId, "licences");
    await ad.getByRole("button", { name: "ต่ออายุ", exact: true }).click();
    const renew = ad.locator("form", { has: ad.getByRole("button", { name: "ยืนยันต่ออายุ" }) });
    await renew.locator('[name="expiresAt"]').fill(day(ctx.thaiMidnight(400)));
    await submit(renew, "ยืนยันต่ออายุ");
    check("ต่ออายุ: ได้ใบ Gold ใหม่ ใบเดิมถูกแทนที่", (await licences("Delta Academy")).map((l) => `${l.level}:${l.status}`).join() === "SILVER:SUPERSEDED,GOLD:SUPERSEDED,GOLD:ACTIVE");

    // แก้ข้อมูลอคาเดมี (แท็บข้อมูล)
    await openTab(deltaId, "info");
    const info = ad.locator("form", { has: ad.getByRole("button", { name: "บันทึกข้อมูล", exact: true }) });
    await info.locator('[name="province"]').fill("พังงา");
    await submit(info, "บันทึกข้อมูล");
    const upd = await sql("select details from audit_logs where action='ACADEMY_UPDATE' order by id desc limit 1");
    check("แก้ไขจังหวัด + บันทึกค่าก่อน/หลัง", upd[0]?.details?.changes?.province?.[1] === "พังงา", JSON.stringify(upd[0]?.details));

    // พักใช้ (ต้องมีเหตุผล) → หายจากหน้าสาธารณะ · ฟอร์มแก้ไขไม่มีช่องสถานะแล้ว
    await openTab(deltaId, "licences");
    check("ฟอร์มแก้ไขใบอนุญาตไม่มีช่องเปลี่ยนสถานะ", (await ad.locator('select[name="status"]').count()) === 0);
    await ad.getByRole("button", { name: "พักใช้ / เพิกถอน" }).click();
    const revoke = ad.locator("form", { has: ad.getByRole("button", { name: "ยืนยันพักใช้" }) });
    await revoke.locator('[name="reason"]').fill("ไม่ผ่านการตรวจประเมินประจำปี");
    await revoke.getByRole("button", { name: "ยืนยันพักใช้" }).click();
    check("พักใช้ใบอนุญาต + เก็บเหตุผล", await until(async () => !!(await sql(`select 1 from academy_licences where academy_id=$1 and status='REVOKED' and note like '%ไม่ผ่านการตรวจประเมิน%'`, [deltaId]))[0]));
    const revokedPage = await pub.goto(`${BASE}/academies/${deltaId}`, { waitUntil: "networkidle" });
    check("อคาเดมีที่ถูกพักใช้ไม่มีหน้าสาธารณะ (404)", revokedPage.status() === 404);

    // คืนสถานะใบที่ถูกพักใช้ → กลับมามีผล
    await openTab(deltaId, "licences");
    await ad.getByRole("button", { name: "คืนสถานะใบที่ถูกพักใช้" }).click();
    check("คืนสถานะใบที่ถูกพักใช้", await until(async () => !!(await sql(`select 1 from academy_licences where academy_id=$1 and status='ACTIVE' and level='GOLD'`, [deltaId]))[0]));

    // ลบใบเก่าที่บันทึกผิด (กดยืนยัน)
    await openTab(deltaId, "licences");
    await ad.getByRole("button", { name: "ลบใบอนุญาต" }).last().click();
    check("ลบใบอนุญาต", await until(async () => (await licences("Delta Academy")).length === 2));

    // ลบใบที่มีผลใบสุดท้าย (เช่น ออกใบใหม่ผิด) → ใบเดิมที่ถูกแทนที่กลับมามีผล ไม่หลุดจากทะเบียน
    await openTab(alphaId, "licences");
    await ad.getByRole("button", { name: "ลบใบอนุญาต" }).first().click();
    check(
      "ลบใบ Gold ที่มีผล → คืนใบ Bronze เดิมให้มีผล",
      await until(async () => (await licences("ALPHA ACADEMY")).map((l) => `${l.level}:${l.status}`).join() === "BRONZE:ACTIVE"),
      JSON.stringify(await licences("ALPHA ACADEMY")),
    );
    check("บันทึกการคืนใบเดิมไว้ในบันทึกการแก้ไข", !!(await sql(`select 1 from audit_logs where action='ACADEMY_LICENCE_DELETE' and summary like '%คืนใบ Bronze%'`))[0]);

    // ข้อมูลค้าง: ใบถูกแทนที่หมดแต่ไม่มีใบใหม่ → แจ้งในรายการควรตรวจสอบ + ปุ่มคืนสถานะในหน้าอคาเดมี
    await sql(`update academy_licences set status='SUPERSEDED' where academy_id=$1`, [alphaId]);
    await ad.goto(`${BASE}/academies/manage/academies?issue=no-active`, { waitUntil: "networkidle" });
    check("รายการควรตรวจสอบ: ไม่มีใบที่มีผล", (await ad.locator("tbody").innerText()).includes("ALPHA ACADEMY"));
    await openTab(alphaId);
    check("หน้าอคาเดมีแจ้งว่าไม่มีใบที่มีผล", (await ad.getByRole("alert").filter({ hasText: "ไม่มีใบอนุญาตที่มีผล" }).count()) === 1);
    await ad.getByRole("button", { name: "คืนสถานะใบนี้เป็นมีผล" }).click();
    check("กดคืนสถานะ → ใบกลับมามีผล", await until(async () => (await licences("ALPHA ACADEMY"))[0]?.status === "ACTIVE"));

    // ออกใบใหม่ต้องเลือกระดับ · ออกซ้อนใบที่มีผลไม่ได้ (ต้องใช้ต่ออายุ/เปลี่ยนระดับ)
    const pendingId = (await sql("select id from academies where name_en='Pending Academy'"))[0].id;
    await sql(`update academy_licences set status='SUPERSEDED' where academy_id=$1`, [pendingId]);
    await openTab(pendingId, "licences");
    await ad.getByRole("button", { name: "ออกใบอนุญาตใหม่" }).click();
    const issue = ad.locator("form", { has: ad.getByRole("button", { name: "ออกใบอนุญาต", exact: true }) });
    check("ฟอร์มออกใบใหม่บังคับเลือกระดับ", (await issue.locator('select[name="level"]').getAttribute("required")) !== null);
    await issue.locator('select[name="level"]').selectOption("BRONZE");
    const issueRes = await submit(issue, "ออกใบอนุญาต");
    check("ออกใบอนุญาตใหม่ (Bronze)", !!(await sql(`select 1 from academy_licences where academy_id=$1 and status='ACTIVE' and level='BRONZE'`, [pendingId]))[0], issueRes);

    // บันทึกการแก้ไข (หน้ารวม)
    await ad.goto(`${BASE}/academies/manage/activity`, { waitUntil: "networkidle" });
    check("หน้าบันทึกการแก้ไขแสดงรายการ", (await ad.locator("main").innerText()).includes("พักใช้ใบอนุญาต"));

    // ส่งออก Excel (เฉพาะแอดมิน)
    const xres = await fetch(`${BASE}/academies/manage/export`, { headers: { cookie: `session_token=${adminToken}` } });
    const xwb = new ExcelJS.Workbook();
    if (xres.ok) await xwb.xlsx.load(Buffer.from(await xres.arrayBuffer()));
    const xs = xwb.getWorksheet("ทะเบียนอคาเดมี");
    check("ส่งออก Excel ครบทุกอคาเดมี + มีเบอร์ติดต่อ", xres.ok && xs?.rowCount === 8 && JSON.stringify(xs.getSheetValues()).includes("0811111111"), `${xres.status} rows=${xs?.rowCount}`);

    // ปิดการแสดง → หายจากทำเนียบ · ลบอคาเดมี (แท็บข้อมูล)
    const gammaId = (await sql("select id from academies where name_en='Gamma Academy'"))[0].id;
    await openTab(gammaId);
    await ad.getByRole("button", { name: "ปิดการแสดงบนหน้าสาธารณะ" }).click();
    check("ปิดการแสดง", await until(async () => (await sql("select active from academies where id=$1", [gammaId]))[0].active === false));
    await pub.goto(`${BASE}/academies`, { waitUntil: "networkidle" });
    check("อคาเดมีที่ปิดการแสดงไม่อยู่ในทำเนียบ", !(await pub.locator("#directory").innerText()).includes("Gamma Academy"));
    await openTab(deltaId, "info");
    await ad.getByRole("button", { name: "ลบอคาเดมี" }).click();
    await ad.waitForURL(/\/academies\/manage\/academies$/, { timeout: 30_000 });
    check("ลบอคาเดมี + เก็บสำเนาในบันทึก", (await academyCount()) === 6 && (await sql("select count(*)::int n from audit_logs where action='ACADEMY_DELETE'"))[0].n === 1);

    // มือถือ: ทำเนียบ + หน้าจัดการไม่ล้นแนวนอน
    const mobile = await ctx.page(null, { width: 390, height: 844 });
    await mobile.goto(`${BASE}/academies`, { waitUntil: "networkidle" });
    const overflow = await mobile.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    check("มือถือ: ทำเนียบไม่ล้นแนวนอน", overflow <= 0, `${overflow}px`);
    await mobile.screenshot({ path: path.join(ctx.artifactsDir, "academies-mobile.png"), fullPage: true });
    const madm = await ctx.page(adminToken, { width: 390, height: 844 });
    await madm.goto(`${BASE}/academies/manage/${alphaId}?tab=licences`, { waitUntil: "networkidle" });
    const mOverflow = await madm.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    check("มือถือ: หน้าจัดการไม่ล้นแนวนอน", mOverflow <= 0, `${mOverflow}px`);
    await pub.goto(`${BASE}/academies`, { waitUntil: "networkidle" });
    await pub.screenshot({ path: path.join(ctx.artifactsDir, "academies-desktop.png"), fullPage: true });
    for (const [url, name] of [
      ["/academies/manage", "manage-dashboard"],
      ["/academies/manage/academies", "manage-registry"],
      [`/academies/manage/${alphaId}`, "manage-academy"],
      [`/academies/manage/${alphaId}?tab=licences`, "manage-licences-tab"],
      ["/academies/manage/licences", "manage-licences"],
    ]) {
      await ad.goto(`${BASE}${url}`, { waitUntil: "networkidle" });
      await ad.screenshot({ path: path.join(ctx.artifactsDir, `${name}.png`), fullPage: true });
    }

    const errors = await sql("select count(*)::int n from error_logs where source='SERVER'");
    check("ไม่มี error ฝั่งเซิร์ฟเวอร์", errors[0].n === 0, JSON.stringify(await sql("select path, message from error_logs limit 3")));
  },
};
