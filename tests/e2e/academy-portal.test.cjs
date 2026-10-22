// Academy Licensing ระยะ 2: แผนที่ทำเนียบ → อคาเดมีสมัครเอง/ขอสิทธิ์ → พอร์ทัล (บุคลากร ทีม นักเตะ ใบสมัคร เอกสาร)
// → แอดมินตรวจ ส่งกลับแก้ → อคาเดมีส่งใหม่ → อนุมัติออกใบอนุญาต · สิทธิ์เข้าถึงเอกสาร · บัญชีอคาเดมีแยกจากระบบหลัก
const path = require("path");

async function until(fn, timeout = 20_000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (await fn()) return true;
    await new Promise((r) => setTimeout(r, 400));
  }
  return false;
}

module.exports = {
  name: "Academy Licensing: พอร์ทัลอคาเดมี + ตรวจใบสมัคร + แผนที่",
  async run(ctx) {
    const { check, sql, BASE } = ctx;
    const one = async (q, p) => (await sql(q, p))[0];
    const day = (d) => new Date(d.getTime() + 7 * 3600_000).toISOString().slice(0, 10);

    // ข้อความผลลัพธ์ของ ResultForm (ไม่นับผลของการกดครั้งก่อน)
    const submit = async (form, button) => {
      await form.evaluate((f) => f.querySelectorAll('[role="status"], [role="alert"]').forEach((el) => el.setAttribute("data-old", "1")));
      await (typeof button === "string" ? form.getByRole("button", { name: button, exact: true }) : button).click();
      return form
        .locator('[role="status"]:not([data-old]), [role="alert"]:not([data-old])')
        .filter({ hasNotText: "กำลังบันทึก" })
        .first()
        .innerText({ timeout: 30_000 })
        .catch(() => "ไม่มีผลลัพธ์");
    };
    const formWith = (page, button) => page.locator("form", { has: page.getByRole("button", { name: button, exact: true }) });
    const cookieOf = async (page) => (await page.context().cookies()).find((c) => c.name === "session_token")?.value;
    const fetchAs = (url, token) => fetch(`${BASE}${url}`, { redirect: "manual", headers: token ? { cookie: `session_token=${token}` } : {} });

    // ===== ข้อมูลตั้งต้น: อคาเดมีในทะเบียน + ผู้ฝึกสอนในฐานข้อมูลใบอนุญาต =====
    const goldId = (await one(`insert into academies (name_en, name_th, province, contact_name, phone, updated_at) values ('Existing Gold Academy','โกลด์ อคาเดมี','เชียงใหม่','คุณลับ','0899999999', now()) returning id`)).id;
    await sql(`insert into academy_licences (academy_id, level, status, approved_at, updated_at) values ($1,'GOLD','ACTIVE', now() - interval '30 days', now())`, [goldId]);
    const bkkId = (await one(`insert into academies (name_en, province, updated_at) values ('Bangkok Bronze Academy','กรุงเทพมหานคร', now()) returning id`)).id;
    await sql(`insert into academy_licences (academy_id, level, status, approved_at, updated_at) values ($1,'BRONZE','ACTIVE', now() - interval '10 days', now())`, [bkkId]);
    const coachA = (await one(`insert into coaches (afc_id, name_th, surname_th, updated_at) values ('AFC-E2E-1','สมชาย','ใจดี', now()) returning id`)).id;
    await sql(`insert into license_records (coach_id, license_type, record_type, certificate_no, expire_date) values ($1,'A','COURSE','A-0001', now() + interval '1 year')`, [coachA]);
    const coachB = (await one(`insert into coaches (name_th, surname_th, updated_at) values ('สมหญิง','รักบอล', now()) returning id`)).id;
    await sql(`insert into license_records (coach_id, license_type, record_type, certificate_no, expire_date) values ($1,'B','COURSE','CERT-B-77', now() + interval '1 year')`, [coachB]);

    // ===== 1) หน้าแรก: แผนที่ประเทศไทย =====
    const pub = await ctx.page(null);
    await pub.goto(`${BASE}/academies`, { waitUntil: "networkidle", timeout: 240_000 });
    check("แผนที่: ครบ 77 จังหวัด", (await pub.locator("svg path[data-code]").count()) === 77);
    check("แผนที่: จังหวัดที่มีอคาเดมีกดได้", (await pub.locator('svg path[role="button"]').count()) === 2);
    await pub.locator('svg path[aria-label^="เชียงใหม่"]').hover();
    check("ชี้จังหวัด → เห็นจำนวน", await until(async () => (await pub.getByText("1 อคาเดมี").count()) > 0, 5000));
    await pub.locator('svg path[aria-label^="เชียงใหม่"]').click();
    check("คลิกจังหวัด → รายชื่ออคาเดมีในจังหวัด", await until(async () => (await pub.getByRole("link", { name: /Existing Gold Academy/ }).count()) >= 2, 5000));
    check("แผนที่ซูมเข้า", await until(async () => (await pub.locator("svg g").first().getAttribute("style"))?.includes("scale(") && !(await pub.locator("svg g").first().getAttribute("style")).includes("scale(1)"), 3000));
    await pub.screenshot({ path: path.join(ctx.artifactsDir, "academies-map-selected.png") });
    await pub.getByRole("button", { name: "ทั้งประเทศ" }).click();
    await pub.getByRole("button", { name: /^Bronze/ }).click();
    check("กรองระดับบนแผนที่ (Bronze → กดได้ 1 จังหวัด)", await until(async () => (await pub.locator('svg path[role="button"]').count()) === 1, 3000));
    check("หน้าแรกมีปุ่มสมัคร / เข้าสู่ระบบอคาเดมี", (await pub.getByRole("link", { name: "สมัคร / ยื่นขอใบอนุญาต" }).count()) === 1 && (await pub.getByRole("link", { name: "เข้าสู่ระบบอคาเดมี" }).count()) === 1);
    check("ข้อมูลติดต่อไม่หลุดไปกับข้อมูลแผนที่", !(await pub.content()).includes("0899999999") && !(await pub.content()).includes("คุณลับ"));

    // ===== 2) อคาเดมีใหม่สมัครเอง → เริ่มใช้งานพอร์ทัลได้ทันที =====
    const ac = await ctx.page(null);
    ac.on("dialog", (d) => d.accept());
    await ac.goto(`${BASE}/academies/register`, { waitUntil: "networkidle", timeout: 240_000 });
    const reg = formWith(ac, "สมัครบัญชี");
    await reg.locator('[name="nameEn"]').fill("New Star Academy");
    await reg.locator('[name="nameTh"]').fill("นิวสตาร์ อคาเดมี");
    await reg.locator('select[name="province"]').selectOption("ขอนแก่น");
    await reg.locator('[name="address"]').fill("สนามกีฬากลาง");
    await reg.locator('[name="name"]').fill("คุณนิว ผู้ดูแล");
    await reg.locator('[name="phone"]').fill("0870000001");
    await reg.locator('[name="email"]').fill("NewStar@Test.invalid");
    await reg.locator('[name="password"]').fill("newstar-pass");
    await reg.locator('[name="password2"]').fill("newstar-wrong");
    await reg.locator('[name="consent"]').check();
    check("สมัคร: รหัสผ่านยืนยันไม่ตรง → แจ้งเตือน", (await submit(reg, "สมัครบัญชี")).includes("ไม่ตรงกัน"));
    await reg.locator('[name="password2"]').fill("newstar-pass");
    await reg.getByRole("button", { name: "สมัครบัญชี" }).click();
    await ac.waitForURL(/\/academies\/portal$/, { timeout: 60_000 });
    const newStar = await one(`select a.id, m.status, u.role from academies a join academy_members m on m.academy_id=a.id join system_users u on u.user_id=m.user_id where a.name_en='New Star Academy'`);
    check("สมัครอคาเดมีใหม่: บัญชี ACADEMY + อนุมัติทันที + อีเมลตัวเล็ก", newStar?.status === "APPROVED" && newStar?.role === "ACADEMY" && !!(await one(`select 1 from system_users where email='newstar@test.invalid'`)));
    const nsId = newStar.id;
    const acToken = await cookieOf(ac);

    // บัญชีอคาเดมีเข้าระบบหลักไม่ได้
    for (const url of ["/dashboard", "/coaches", `/coaches/${coachA}`, "/academies/manage"]) {
      const res = await fetchAs(url, acToken);
      const loc = res.headers.get("location") ?? "";
      check(`บัญชีอคาเดมีเข้า ${url} ไม่ได้`, res.status >= 300 && res.status < 400 && !loc.includes(url === "/academies/manage" ? "/academies/manage" : url), `${res.status} → ${loc}`);
    }
    const pubBefore = await (await fetchAs("/academies", null)).text();
    check("ยังไม่มีใบอนุญาต → ไม่ขึ้นทำเนียบสาธารณะ", !pubBefore.includes("New Star Academy"));

    // ===== 3) พอร์ทัล: ข้อมูล / บุคลากร / ทีม / นักเตะ =====
    await ac.goto(`${BASE}/academies/portal/profile`, { waitUntil: "networkidle" });
    const profile = formWith(ac, "บันทึกข้อมูล");
    await profile.locator('[name="website"]').fill("https://newstar.example");
    await profile.locator('[name="parentClub"]').fill("Khon Kaen FC");
    check("แก้ไขข้อมูลอคาเดมี", (await submit(profile, "บันทึกข้อมูล")).includes("บันทึกแล้ว") && (await one(`select parent_club from academies where id=$1`, [nsId])).parent_club === "Khon Kaen FC");

    await ac.goto(`${BASE}/academies/portal/staff`, { waitUntil: "networkidle" });
    let staffForm = formWith(ac, "เพิ่มบุคลากร");
    await staffForm.locator('select[name="role"]').selectOption("HEAD");
    await staffForm.locator('[name="coachRef"]').fill("AFC-E2E-1");
    const s1 = await submit(staffForm, "เพิ่มบุคลากร");
    const head = await one(`select name, coach_id from academy_staff where academy_id=$1 and role='HEAD'`, [nsId]);
    check("เพิ่มหัวหน้าอคาเดมีด้วย AFC ID → ผูกผู้ฝึกสอน + ใช้ชื่อจากฐานข้อมูล", head?.coach_id === coachA && head?.name.includes("สมชาย"), `${s1} ${JSON.stringify(head)}`);
    await staffForm.locator('select[name="role"]').selectOption("COACH");
    await staffForm.locator('[name="coachRef"]').fill("cert-b-77");
    await submit(staffForm, "เพิ่มบุคลากร");
    check("เพิ่มผู้ฝึกสอนด้วยเลขที่ใบอนุญาต (ไม่สนตัวพิมพ์)", (await one(`select coach_id from academy_staff where academy_id=$1 and role='COACH'`, [nsId]))?.coach_id === coachB);
    await staffForm.locator('select[name="role"]').selectOption("COACH");
    await staffForm.locator('[name="coachRef"]').fill("NOT-A-COACH");
    check("AFC ID ที่ไม่มีในระบบ → แจ้งว่าไม่พบ", (await submit(staffForm, "เพิ่มบุคลากร")).includes("ไม่พบผู้ฝึกสอน"));
    await ac.reload({ waitUntil: "networkidle" });
    check("หน้าบุคลากรแสดงใบอนุญาตที่ยืนยันแล้ว", (await ac.getByText("AFC A").count()) > 0 && (await ac.getByText("AFC B").count()) > 0);

    await ac.goto(`${BASE}/academies/portal/teams`, { waitUntil: "networkidle" });
    const teamForm = formWith(ac, "เพิ่มทีม");
    await teamForm.locator('select[name="ageGroup"]').selectOption("12");
    await submit(teamForm, "เพิ่มทีม");
    const teamId = (await one(`select id from academy_teams where academy_id=$1`, [nsId]))?.id;
    check("เพิ่มทีม U12 (ชื่อทีมตั้งอัตโนมัติ)", !!teamId && (await one(`select name from academy_teams where id=$1`, [teamId])).name === "U12");
    await ac.goto(`${BASE}/academies/portal/teams/${teamId}`, { waitUntil: "networkidle" });
    check("ก่อนยืนยันความยินยอม: ยังไม่มีฟอร์มกรอกนักเตะ", (await ac.getByRole("button", { name: "เพิ่มนักเตะ" }).count()) === 0);
    const consent = formWith(ac, "ยืนยัน");
    await consent.locator('[name="consent"]').check();
    await submit(consent, "ยืนยัน");
    check("ยืนยันความยินยอม PDPA (บันทึกผู้ยืนยัน)", (await one(`select player_consent_by from academies where id=$1`, [nsId])).player_consent_by === "newstar@test.invalid");
    await ac.reload({ waitUntil: "networkidle" });
    const playerForm = formWith(ac, "เพิ่มนักเตะ");
    await playerForm.locator('[name="firstName"]').fill("เด็กชายเอ");
    await playerForm.locator('[name="lastName"]').fill("ทดสอบ");
    await playerForm.locator('select[name="position"]').selectOption("GK");
    await playerForm.locator('[name="birthDate"]').fill(day(ctx.thaiMidnight(10)));
    check("วันเกิดในอนาคต → แจ้งเตือน", (await submit(playerForm, "เพิ่มนักเตะ")).includes("อนาคต"));
    await playerForm.locator('[name="birthDate"]').fill("2014-05-01");
    await playerForm.locator('[name="shirtNo"]').fill("1");
    check("เพิ่มนักเตะ", (await submit(playerForm, "เพิ่มนักเตะ")).includes("เพิ่มนักเตะแล้ว"));
    // นักเตะที่เหลือให้ครบเกณฑ์ U12 (12 คน · ผู้รักษาประตู 2)
    for (let i = 2; i <= 12; i++) {
      await sql(`insert into academy_players (team_id, first_name, last_name, position, shirt_no, updated_at) values ($1,$2,'ทดสอบ',$3,$4, now())`, [teamId, `นักเตะ${i}`, i === 2 ? "GK" : "MF", i]);
    }
    await ac.goto(`${BASE}/academies/portal`, { waitUntil: "networkidle" });
    const readiness = ac.locator("section", { hasText: "ความพร้อมตามเกณฑ์" });
    check("ภาพรวม: เกณฑ์อัตโนมัติผ่านระดับ Bronze ครบ 4 ข้อ", (await readiness.locator("tbody tr").evaluateAll((rows) => rows.filter((r) => r.querySelectorAll("td")[1]?.querySelector('[aria-label="ผ่าน"]')).length)) === 4);

    // ===== 4) ใบสมัคร + แนบเอกสาร =====
    await ac.goto(`${BASE}/academies/portal/applications`, { waitUntil: "networkidle" });
    await ac.locator('input[name="level"][value="BRONZE"]').check({ force: true });
    await ac.getByRole("button", { name: "เริ่มใบสมัคร" }).click();
    await ac.waitForURL(/\/academies\/portal\/applications\/\d+$/, { timeout: 60_000 });
    const appId = Number(new URL(ac.url()).pathname.split("/").pop());
    const evidence = await sql(`select id, criterion from academy_evidence where application_id=$1 order by id`, [appId]);
    check("เริ่มใบสมัคร Bronze (ขอใหม่) พร้อมรายการเกณฑ์", evidence.length > 10 && (await one(`select kind from academy_applications where id=$1`, [appId])).kind === "NEW", `${evidence.length} ข้อ`);
    check("ข้อที่ระบบตรวจได้แสดงผลตรวจอัตโนมัติ", (await ac.locator('[id="c-1.1.3"]').innerText()).includes("ระบบตรวจจากข้อมูลบุคลากร"));
    const manual = evidence.filter((e) => !["1.1.3", "1.3.1", "1.6.1", "1.6.2"].includes(e.criterion));
    const first = manual[0];
    const sendBar = ac.locator("section", { has: ac.getByRole("button", { name: "ส่งใบสมัคร" }) });
    check("ส่งทั้งที่ยังไม่ครบ → บอกข้อที่ขาด", (await submit(sendBar.locator("form").last(), "ส่งใบสมัคร")).includes("ยังไม่ได้กรอก"));

    const firstForm = ac.locator(`[id="c-${first.criterion}"] form`).last();
    await firstForm.locator('[name="note"]').fill("มีแผนงบประมาณประจำปี");
    await firstForm.locator('input[type="file"]').setInputFiles({ name: "notes.txt", mimeType: "text/plain", buffer: Buffer.from("x") });
    check("ไฟล์ชนิดที่ไม่รองรับ → แจ้งเตือน", (await submit(firstForm, `บันทึกข้อ ${first.criterion}`)).includes("รองรับไฟล์"));
    await firstForm.locator('input[type="file"]').setInputFiles({ name: "งบประมาณ 2569.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4\n% e2e budget\n") });
    check("แนบเอกสาร PDF", (await submit(firstForm, `บันทึกข้อ ${first.criterion}`)).includes("บันทึกแล้ว"));
    const doc = await one(`select id, file_key from academy_documents where evidence_id=$1`, [first.id]);
    check("บันทึกเอกสารพร้อมคำอธิบาย", !!doc && (await one(`select note from academy_evidence where id=$1`, [first.id])).note === "มีแผนงบประมาณประจำปี");
    // ข้ออื่นกรอกคำอธิบายผ่านฐานข้อมูล (ฟอร์มเดียวกันทุกข้อ ทดสอบข้อแรกแล้ว)
    await sql(`update academy_evidence set note='มีตามเกณฑ์' where application_id=$1 and criterion <> all($2::text[]) and note is null`, [appId, ["1.1.3", "1.3.1", "1.6.1", "1.6.2"]]);

    // สิทธิ์เปิดเอกสาร: เจ้าของ + แอดมินเท่านั้น
    const docRes = await fetchAs(`/academies/docs/${doc.id}`, acToken);
    check("อคาเดมีเจ้าของเปิดเอกสารได้", docRes.status === 200 && (await docRes.text()).includes("e2e budget"));
    check("ไม่ล็อกอิน → เปิดเอกสารไม่ได้ (404)", (await fetchAs(`/academies/docs/${doc.id}`, null)).status === 404);
    const coachToken = await ctx.login("COACH", { coachId: coachB });
    check("โค้ช → เปิดเอกสารอคาเดมีไม่ได้ (404)", (await fetchAs(`/academies/docs/${doc.id}`, coachToken)).status === 404);

    await ac.reload({ waitUntil: "networkidle" });
    await ac.getByRole("button", { name: "ส่งใบสมัคร" }).click();
    check("ส่งใบสมัคร → รอตรวจ", await until(async () => (await one(`select status from academy_applications where id=$1`, [appId])).status === "SUBMITTED"));
    await ac.reload({ waitUntil: "networkidle" });
    check("ระหว่างรอตรวจแก้ไขไม่ได้", (await ac.locator("textarea").count()) === 0);

    // ===== 5) ขอสิทธิ์ดูแลอคาเดมีที่มีในทะเบียน → รออนุมัติ =====
    const claim = await ctx.page(null);
    await claim.goto(`${BASE}/academies/register`, { waitUntil: "networkidle" });
    await claim.getByRole("radio", { name: /มีในทะเบียนแล้ว/ }).click();
    const claimForm = formWith(claim, "สมัครบัญชี");
    await claimForm.getByPlaceholder("พิมพ์ชื่ออคาเดมีอย่างน้อย 2 ตัวอักษร").fill("existing gold");
    await claimForm.getByRole("button", { name: /Existing Gold Academy/ }).click();
    await claimForm.locator('[name="note"]').fill("เป็นผู้อำนวยการอคาเดมี");
    await claimForm.locator('[name="name"]').fill("คุณโกลด์");
    await claimForm.locator('[name="email"]').fill("gold-owner@test.invalid");
    await claimForm.locator('[name="password"]').fill("gold-pass-1");
    await claimForm.locator('[name="password2"]').fill("gold-pass-1");
    await claimForm.locator('[name="consent"]').check();
    await claimForm.getByRole("button", { name: "สมัครบัญชี" }).click();
    await claim.waitForURL(/\/academies\/portal$/, { timeout: 60_000 });
    check("ขอสิทธิ์ดูแล → หน้ารออนุมัติ", (await claim.locator("main").innerText()).includes("รอสมาคมฯ อนุมัติ"));
    check("ขอสิทธิ์ดูแล: สถานะรออนุมัติ", (await one(`select status from academy_members where academy_id=$1`, [goldId]))?.status === "PENDING");
    await claim.goto(`${BASE}/academies/portal/staff`, { waitUntil: "networkidle" });
    check("รออนุมัติ → เข้าหน้าบุคลากรไม่ได้", new URL(claim.url()).pathname === "/academies/portal");
    const claimToken = await cookieOf(claim);
    check("อคาเดมีอื่น → เปิดเอกสารไม่ได้ (404)", (await fetchAs(`/academies/docs/${doc.id}`, claimToken)).status === 404);

    // ===== 6) แอดมิน: อนุมัติสิทธิ์ + สร้างบัญชีให้อคาเดมี =====
    const adminToken = await ctx.login("ADMIN");
    const ad = await ctx.page(adminToken);
    ad.on("dialog", (d) => d.accept());
    check("แอดมินเปิดเอกสารได้", (await fetchAs(`/academies/docs/${doc.id}`, adminToken)).status === 200);
    await ad.goto(`${BASE}/academies/manage/accounts`, { waitUntil: "networkidle", timeout: 240_000 });
    check("แท็บจัดการแสดงจำนวนงานรอ", (await ad.getByRole("navigation", { name: "เมนูจัดการ" }).innerText()).includes("ใบสมัคร\n1") || (await ad.getByRole("link", { name: /ใบสมัคร\s*1/ }).count()) > 0);
    const pendingItem = ad.locator("li", { hasText: "gold-owner@test.invalid" });
    check("คำขอสิทธิ์แสดงข้อความถึงสมาคมฯ", (await pendingItem.innerText()).includes("เป็นผู้อำนวยการอคาเดมี"));
    await pendingItem.getByRole("button", { name: "อนุมัติสิทธิ์" }).click();
    check("อนุมัติสิทธิ์ดูแล", await until(async () => (await one(`select status from academy_members where academy_id=$1`, [goldId])).status === "APPROVED"));
    check("แจ้งเตือนอคาเดมีเมื่อได้รับสิทธิ์", !!(await one(`select 1 from academy_notices where academy_id=$1`, [goldId])));
    await claim.goto(`${BASE}/academies/portal/staff`, { waitUntil: "networkidle" });
    check("หลังอนุมัติ → เข้าพอร์ทัลได้", new URL(claim.url()).pathname === "/academies/portal/staff");

    await ad.reload({ waitUntil: "networkidle" });
    await ad.locator("summary", { hasText: "สร้างบัญชีให้อคาเดมีในทะเบียน" }).click();
    const create = formWith(ad, "สร้างบัญชี");
    await create.getByPlaceholder("พิมพ์ชื่ออคาเดมีอย่างน้อย 2 ตัวอักษร").fill("Bangkok");
    await create.getByRole("button", { name: /Bangkok Bronze Academy/ }).click();
    await create.locator('[name="name"]').fill("คุณบางกอก");
    await create.locator('[name="email"]').fill("bkk@test.invalid");
    await create.locator('[name="password"]').fill("bkk-pass-01");
    check("แอดมินสร้างบัญชีให้อคาเดมี", (await submit(create, "สร้างบัญชี")).includes("สร้างบัญชีแล้ว") && (await one(`select status from academy_members where academy_id=$1`, [bkkId]))?.status === "APPROVED");
    const bkkItem = ad.locator("li", { hasText: "bkk@test.invalid" });
    await bkkItem.locator("summary", { hasText: "ตั้งรหัสผ่านใหม่" }).click();
    const reset = bkkItem.locator("form", { has: ad.getByRole("button", { name: /บันทึกรหัสผ่าน/ }) });
    await reset.locator('[name="password"]').fill("bkk-pass-02");
    await submit(reset, ad.getByRole("button", { name: /บันทึกรหัสผ่าน/ }));
    // เข้าสู่ระบบด้วยรหัสใหม่ผ่านหน้าเข้าสู่ระบบอคาเดมี
    const bkk = await ctx.page(null);
    await bkk.goto(`${BASE}/academies/login`, { waitUntil: "networkidle" });
    await bkk.locator('[name="email"]').fill("bkk@test.invalid");
    await bkk.locator('[name="password"]').fill("bkk-pass-01");
    await bkk.getByRole("button", { name: "เข้าสู่ระบบ" }).click();
    await bkk.waitForURL(/error=1/, { timeout: 30_000 }).catch(() => {});
    check("รหัสเดิมใช้ไม่ได้หลังตั้งใหม่", bkk.url().includes("error=1"));
    await bkk.locator('[name="email"]').fill("bkk@test.invalid");
    await bkk.locator('[name="password"]').fill("bkk-pass-02");
    await bkk.getByRole("button", { name: "เข้าสู่ระบบ" }).click();
    await bkk.waitForURL(/\/academies\/portal$/, { timeout: 30_000 }).catch(() => {});
    check("เข้าสู่ระบบอคาเดมีด้วยรหัสใหม่ → พอร์ทัล", new URL(bkk.url()).pathname === "/academies/portal" && (await bkk.locator("main").innerText()).includes("Bangkok Bronze Academy"));

    // ===== 7) แอดมินตรวจใบสมัคร: ส่งกลับให้แก้ =====
    await ad.goto(`${BASE}/academies/manage/applications`, { waitUntil: "networkidle" });
    await ad.getByRole("link", { name: /New Star Academy/ }).click();
    await ad.waitForURL(new RegExp(`/academies/manage/applications/${appId}$`));
    check("หน้าตรวจ: เห็นเอกสาร + บุคลากรที่ยืนยันใบอนุญาต", (await ad.getByRole("link", { name: /งบประมาณ 2569\.pdf/ }).count()) === 1 && (await ad.locator("aside").innerText()).includes("AFC A"));
    const target = manual[1];
    const article = ad.locator(`[id="c-${target.criterion}"]`);
    await article.getByText("ต้องแก้ไข", { exact: true }).click();
    check("ทำเครื่องหมาย “ต้องแก้ไข” โดยไม่ใส่เหตุผล → แจ้งเตือน", (await submit(article.locator("form"), ad.getByRole("button", { name: `บันทึกผลข้อ ${target.criterion}` }))).includes("กรุณาระบุ"));
    await article.locator('[name="reviewNote"]').fill("ขอสำเนาสัญญาจ้างที่ลงนามแล้ว");
    await submit(article.locator("form"), ad.getByRole("button", { name: `บันทึกผลข้อ ${target.criterion}` }));
    check("บันทึกผลตรวจรายข้อ", (await one(`select status, reviewed_by from academy_evidence where id=$1`, [target.id])).status === "FIX");
    await ad.locator("summary", { hasText: "อนุมัติและออกใบอนุญาต" }).click();
    check("ยังมีข้อไม่ผ่าน → อนุมัติไม่ได้", (await submit(formWith(ad, "อนุมัติ"), "อนุมัติ")).includes("ยังมี"));
    await ad.locator("summary", { hasText: "ส่งกลับให้แก้ไข" }).click();
    const fix = formWith(ad, "ส่งกลับให้แก้ไข");
    await fix.locator('[name="note"]').fill("แก้ไข 1 ข้อแล้วส่งใหม่");
    await submit(fix, "ส่งกลับให้แก้ไข");
    check("ส่งกลับให้แก้ไข + แจ้งเตือนอคาเดมี", (await one(`select status from academy_applications where id=$1`, [appId])).status === "NEEDS_FIX" && !!(await one(`select 1 from academy_notices where academy_id=$1 and title like '%ต้องแก้ไข%'`, [nsId])));

    // ===== 8) อคาเดมีแก้แล้วส่งใหม่ =====
    await ac.goto(`${BASE}/academies/portal/applications/${appId}`, { waitUntil: "networkidle" });
    const fixArticle = ac.locator(`[id="c-${target.criterion}"]`);
    check("อคาเดมีเห็นความเห็นจากสมาคมฯ", (await fixArticle.innerText()).includes("ขอสำเนาสัญญาจ้างที่ลงนามแล้ว"));
    await fixArticle.locator('[name="note"]').fill("แนบสัญญาที่ลงนามแล้ว");
    await submit(fixArticle.locator("form").last(), `บันทึกข้อ ${target.criterion}`);
    await ac.getByRole("button", { name: "ส่งฉบับแก้ไข" }).click();
    check("ส่งฉบับแก้ไข → รอตรวจ + ข้อที่แก้กลับไปรอตรวจ", await until(async () => (await one(`select a.status, e.status ev from academy_applications a join academy_evidence e on e.application_id=a.id where e.id=$1`, [target.id]))?.ev === "PENDING"));

    // ===== 9) แอดมินผ่านทุกข้อ → อนุมัติ → ออกใบอนุญาต =====
    await ad.reload({ waitUntil: "networkidle" });
    await ad.getByRole("button", { name: /ผ่านทุกข้อที่ยังรอตรวจ/ }).click();
    check("ผ่านทุกข้อที่รอตรวจ", await until(async () => (await one(`select count(*)::int n from academy_evidence where application_id=$1 and status<>'PASS'`, [appId])).n === 0));
    await ad.reload({ waitUntil: "networkidle" });
    const approve = formWith(ad, "อนุมัติ");
    await approve.locator('[name="licenceNo"]').fill("FAT-B-0001");
    await approve.locator('[name="expiresAt"]').fill(day(ctx.thaiMidnight(365)));
    await approve.getByRole("button", { name: "อนุมัติ", exact: true }).click();
    check("อนุมัติ → ออกใบอนุญาต Bronze", await until(async () => (await one(`select level, status, licence_no from academy_licences where academy_id=$1`, [nsId]))?.licence_no === "FAT-B-0001"));
    check("ใบสมัครอนุมัติแล้ว + ผูกใบอนุญาต", !!(await one(`select 1 from academy_applications where id=$1 and status='APPROVED' and licence_id is not null`, [appId])));
    check("แจ้งเตือนอคาเดมี: ได้รับใบอนุญาต", !!(await one(`select 1 from academy_notices where academy_id=$1 and title like '%ยินดีด้วย%'`, [nsId])));
    await pub.goto(`${BASE}/academies?province=${encodeURIComponent("ขอนแก่น")}#directory`, { waitUntil: "networkidle" });
    check("อนุมัติแล้วขึ้นทำเนียบสาธารณะ", (await pub.locator("#directory").innerText()).includes("New Star Academy"));
    check("แผนที่นับขอนแก่นแล้ว", (await pub.locator('svg path[aria-label^="ขอนแก่น"]').count()) === 1);

    // ===== 10) อคาเดมีเห็นผล + แจ้งเตือน =====
    await ac.goto(`${BASE}/academies/portal`, { waitUntil: "networkidle" });
    const dash = await ac.locator("main").innerText();
    check("พอร์ทัล: แสดงใบอนุญาต Bronze + แจ้งเตือนล่าสุด", dash.includes("Bronze") && dash.includes("ยินดีด้วย"));
    await ac.screenshot({ path: path.join(ctx.artifactsDir, "academy-portal.png"), fullPage: true });
    await ac.goto(`${BASE}/academies/portal/notices`, { waitUntil: "networkidle" });
    check("เปิดหน้าการแจ้งเตือน → อ่านแล้ว", await until(async () => (await one(`select count(*)::int n from academy_notices where academy_id=$1 and read_at is null`, [nsId])).n === 0));

    // ===== 11) หลังบ้าน: ข้อมูลพอร์ทัลในหน้าอคาเดมี + ห้ามลบอคาเดมีที่มีข้อมูลพอร์ทัล =====
    await ad.goto(`${BASE}/academies/manage/${nsId}`, { waitUntil: "networkidle" });
    const detail = await ad.locator("main").innerText();
    check("หน้าอคาเดมี (แอดมิน): บัญชี ใบสมัคร บุคลากร ทีม", detail.includes("newstar@test.invalid") && detail.includes("อนุมัติแล้ว") && detail.includes("สมชาย") && detail.includes("U12"));
    await ad.locator("summary", { hasText: "U12" }).click();
    check("แอดมินเห็นรายชื่อนักเตะ", (await ad.getByText("เด็กชายเอ ทดสอบ").count()) === 1);
    const delRes = await submit(ad.locator("form", { has: ad.getByRole("button", { name: "ลบอคาเดมี" }) }), ad.getByRole("button", { name: "ลบอคาเดมี" }));
    check("ลบอคาเดมีที่มีข้อมูลพอร์ทัลไม่ได้", delRes.includes("ลบไม่ได้") && !!(await one(`select 1 from academies where id=$1`, [nsId])));
    await ad.goto(`${BASE}/academies/manage/applications/${appId}`, { waitUntil: "networkidle" });
    await ad.screenshot({ path: path.join(ctx.artifactsDir, "academy-review.png"), fullPage: true });

    // ===== 12) ออกจากระบบ + มือถือ =====
    await ac.getByRole("button", { name: /ออกจากระบบ/ }).click().catch(async () => {
      await ac.goto(`${BASE}/academies/portal`);
      await ac.getByRole("button", { name: /ออกจากระบบ/ }).click();
    });
    await ac.waitForURL(/\/academies$/, { timeout: 30_000 }).catch(() => {});
    const after = await fetchAs("/academies/portal", acToken);
    check("ออกจากระบบ → session ใช้ไม่ได้", (after.headers.get("location") ?? "").includes("/academies/login"), `${after.status} ${after.headers.get("location")}`);

    const mobile = await ctx.page(null, { width: 390, height: 844 });
    await mobile.goto(`${BASE}/academies`, { waitUntil: "networkidle" });
    const overflow = await mobile.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    check("มือถือ: หน้าแผนที่ไม่ล้นแนวนอน", overflow <= 0, `${overflow}px`);
    await mobile.screenshot({ path: path.join(ctx.artifactsDir, "academies-map-mobile.png"), fullPage: true });
    const mPortal = await ctx.page(claimToken, { width: 390, height: 844 });
    await mPortal.goto(`${BASE}/academies/portal`, { waitUntil: "networkidle" });
    const mOverflow = await mPortal.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    check("มือถือ: พอร์ทัลไม่ล้นแนวนอน", mOverflow <= 0, `${mOverflow}px`);
    await pub.goto(`${BASE}/academies`, { waitUntil: "networkidle" });
    await pub.screenshot({ path: path.join(ctx.artifactsDir, "academies-map.png") });

    const errors = await sql("select count(*)::int n from error_logs where source='SERVER'");
    check("ไม่มี error ฝั่งเซิร์ฟเวอร์", errors[0].n === 0, JSON.stringify(await sql("select path, message from error_logs limit 3")));
  },
};
