// บันทึกการแก้ไข / รวมประวัติซ้ำ / ความครบถ้วนของข้อมูล / การแจ้งเตือนผู้ฝึกสอน / งานอัตโนมัติรายวัน
const ADMIN_EMAIL = "e2e-admin@test.invalid";

async function seed(ctx) {
  const q = ctx.sql;
  const coach = async (fields, licenses = []) => {
    const cols = Object.keys(fields);
    const id = (
      await q(`insert into coaches (${cols.join(",")}, updated_at) values (${cols.map((_, i) => `$${i + 1}`).join(",")}, now()) returning id`, Object.values(fields))
    )[0].id;
    for (const [type, issueDays, expireDays, cert] of licenses)
      await q(`insert into license_records (coach_id, license_type, record_type, certificate_no, issue_date, expire_date) values ($1,$2,'TRAINING',$3,$4,$5)`, [
        id,
        type,
        cert,
        ctx.thaiMidnight(issueDays),
        expireDays == null ? null : ctx.thaiMidnight(expireDays),
      ]);
    return id;
  };
  return {
    // ประวัติซ้ำ: เก่า (ไม่มีเลขบัตร) + ใหม่ (มีเลขบัตร)
    dupOld: await coach({ name_th: "สมศักดิ์", surname_th: "ซ้ำซ้อน", tel_no: "0811111111" }, [["G", -2000, -900, "Intro.0100"]]),
    dupNew: await coach({ name_th: "สมศักดิ์", surname_th: "ซ้ำซ้อน", id_number: "1100100100100", email: "dup@test.invalid" }, [["C", -300, 800, "C-25/0100"]]),
    // คนละคน (เลขบัตรไม่ตรงกัน) → รวมไม่ได้
    otherA: await coach({ name_th: "สมหมาย", surname_th: "ต่างคน", id_number: "1200000000001" }),
    otherB: await coach({ name_th: "สมหมาย", surname_th: "ต่างคน", id_number: "1300000000002" }),
    // ต่างชาติ (ไม่มีชื่อไทย)
    foreign: await coach({ name_th: "", surname_th: "", name_en: "MARCO", family_name_en: "GOCKEL", afc_id: "AFC/1/GER" }),
    // โค้ชที่มีบัญชี: ใบอนุญาตหมดใน 20 วัน (แจ้ง 30 วัน) + GK หมดใน 60 วัน (แจ้ง 90 วัน)
    member: await coach({ name_th: "สมใจ", surname_th: "แจ้งเตือน", tel_no: "0822222222" }, [
      ["B", -1075, 20, "B-23/0001"],
      ["GK_I", -1035, 60, "GK-23/0001"],
    ]),
  };
}

module.exports = {
  name: "บันทึกการแก้ไข / รวมประวัติ / ความครบถ้วน / แจ้งเตือน",
  async run(ctx) {
    const { check, sql, BASE } = ctx;
    const s = await seed(ctx);
    const admin = await ctx.login("ADMIN", { email: ADMIN_EMAIL });
    const member = await ctx.login("COACH", { coachId: s.member });
    const audits = (action, coachId) => sql("select * from audit_logs where action=$1 and ($2::int is null or coach_id=$2) order by id", [action, coachId ?? null]);

    const ad = await ctx.page(admin);
    let dialogAnswer = true;
    ad.on("dialog", (d) => (dialogAnswer ? d.accept() : d.dismiss()));

    // ===== บันทึกการแก้ไข: เพิ่ม / แก้ไข / ลบ =====
    await ad.goto(`${BASE}/coaches/${s.otherA}`, { waitUntil: "networkidle", timeout: 240_000 });
    const addForm = ad.locator("form", { has: ad.getByRole("button", { name: "เพิ่มใบอนุญาต" }) });
    await addForm.locator('select[name="licenseType"]').selectOption("C");
    await addForm.locator('select[name="recordType"]').selectOption("TRAINING");
    await addForm.locator('input[name="certificateNo"]').fill("C-26/0999");
    await addForm.getByRole("button", { name: "เพิ่มใบอนุญาต" }).click();
    await ad.getByText("C-26/0999").first().waitFor({ timeout: 30_000 });
    check("บันทึก: เพิ่มใบอนุญาต", (await audits("LICENSE_CREATE", s.otherA)).length === 1);

    dialogAnswer = false; // กดยกเลิก → ต้องยังไม่ถูกลบ
    await ad.getByRole("button", { name: "ลบใบอนุญาต" }).first().click();
    await ad.waitForTimeout(1500);
    check("กดลบแล้วยกเลิก → ใบอนุญาตยังอยู่", (await sql("select count(*)::int n from license_records where coach_id=$1", [s.otherA]))[0].n === 1);
    dialogAnswer = true;
    await ad.getByRole("button", { name: "ลบใบอนุญาต" }).first().click();
    await ad.waitForTimeout(2500);
    const del = await audits("LICENSE_DELETE", s.otherA);
    check("บันทึก: ลบใบอนุญาต พร้อมสำเนาข้อมูล", del.length === 1 && del[0].details && del[0].details.certificateNo === "C-26/0999");

    // ต่างชาติแก้ข้อมูลได้ (ไม่มีชื่อไทย) + บันทึกค่าก่อน/หลัง
    await ad.goto(`${BASE}/coaches/${s.foreign}/edit`, { waitUntil: "networkidle" });
    await ad.locator('input[name="telNo"]').fill("0899999999");
    await ad.getByRole("button", { name: "บันทึกการแก้ไข" }).click();
    await ad.waitForURL(new RegExp(`/coaches/${s.foreign}$`), { timeout: 30_000 });
    const upd = await audits("COACH_UPDATE", s.foreign);
    check("แก้ข้อมูลผู้ฝึกสอนต่างชาติได้ + บันทึกค่าเดิม/ใหม่", upd.length === 1 && JSON.stringify(upd[0].details.telNo) === JSON.stringify([null, "0899999999"]), JSON.stringify(upd[0]?.details));

    await ad.goto(`${BASE}/audit`, { waitUntil: "networkidle" });
    let txt = await ad.locator("main").innerText();
    check("หน้าบันทึกการแก้ไข แสดงรายการ + ผู้ทำ", txt.includes("เพิ่มใบอนุญาต") && txt.includes("ลบใบอนุญาต") && txt.includes(ADMIN_EMAIL));

    // ===== รวมประวัติซ้ำ =====
    await ad.goto(`${BASE}/coaches/${s.otherA}?mergeWith=${s.otherB}`, { waitUntil: "networkidle" });
    await ad.getByText("เลขบัตรประชาชนไม่ตรงกัน").waitFor({ timeout: 30_000 });
    check("คนละคน (เลขบัตรไม่ตรง) → ปุ่มรวมใช้ไม่ได้", await ad.getByRole("button", { name: "ยืนยันรวมประวัติ" }).isDisabled());

    await ad.goto(`${BASE}/reports`, { waitUntil: "networkidle" });
    check("รายงาน: มีคู่ที่อาจซ้ำ + ปุ่มรวมประวัติ", (await ad.locator("main").innerText()).includes("สมศักดิ์ ซ้ำซ้อน"));
    await ad.goto(`${BASE}/coaches/${s.dupOld}?mergeWith=${s.dupNew}`, { waitUntil: "networkidle" });
    await ad.getByText("รวมประวัติผู้ฝึกสอนที่ซ้ำกัน").waitFor();
    await ad.locator("label", { hasText: `#${s.dupNew}` }).click(); // เก็บประวัติใหม่ (มีเลขบัตร)
    await ad.getByText("เก็บประวัตินี้ไว้").first().waitFor();
    await ad.waitForTimeout(1500);
    await ad.getByRole("button", { name: "ยืนยันรวมประวัติ" }).click();
    await ad.waitForURL(new RegExp(`/coaches/${s.dupNew}$`), { timeout: 30_000 });
    const kept = (await sql("select tel_no, id_number from coaches where id=$1", [s.dupNew]))[0];
    check(
      "รวมแล้ว: ประวัติเก่าถูกลบ, ใบอนุญาตย้ายมาครบ, เติมเบอร์โทรจากประวัติเก่า",
      (await sql("select count(*)::int n from coaches where id=$1", [s.dupOld]))[0].n === 0 &&
        (await sql("select count(*)::int n from license_records where coach_id=$1", [s.dupNew]))[0].n === 2 &&
        kept.tel_no === "0811111111" &&
        kept.id_number === "1100100100100",
    );
    check("บันทึก: รวมประวัติ (เก็บสำเนาประวัติที่ถูกลบ)", (await audits("COACH_MERGE", s.dupNew)).length === 1);

    // ===== แจ้งเตือน: งานอัตโนมัติรายวัน =====
    const noAuth = await fetch(`${BASE}/api/cron/daily`);
    check("งานอัตโนมัติ: ไม่มีรหัส → 401", noAuth.status === 401);
    const cron = async () => (await fetch(`${BASE}/api/cron/daily`, { headers: { authorization: `Bearer ${ctx.CRON_SECRET}` } })).json();
    const first = await cron();
    const notes = await sql("select type from notifications where coach_id=$1 order by type", [s.member]);
    check("แจ้งใบหมดใน 20 วัน (30 วัน) + GK หมดใน 60 วัน (90 วัน)", JSON.stringify(notes.map((n) => n.type)) === JSON.stringify(["LICENSE_EXPIRING_30", "LICENSE_EXPIRING_90"]), JSON.stringify(first));
    const second = await cron();
    check("รันซ้ำ → ไม่แจ้งซ้ำ", second.notificationsCreated === 0);

    // ===== หน้าโค้ช: กระดิ่ง + แจ้งเตือนใหม่ + ความครบถ้วน =====
    const co = await ctx.page(member, { width: 390, height: 844 });
    await co.goto(`${BASE}/me`, { waitUntil: "networkidle" });
    txt = await co.locator("body").innerText();
    check("หน้าโค้ช: แสดงแจ้งเตือนใหม่", txt.includes("การแจ้งเตือนใหม่") && txt.includes("จะหมดอายุใน 20 วัน"));
    check("กระดิ่งแสดงจำนวนที่ยังไม่อ่าน (2)", (await co.getByRole("link", { name: /การแจ้งเตือน \(2 ใหม่\)/ }).count()) === 1);
    const pct = Number((txt.match(/ข้อมูลของคุณครบ (\d+)%/) ?? [])[1]);
    check("หน้าโค้ช: แสดงความครบถ้วนของข้อมูล", pct > 0 && pct < 100, String(pct));
    await co.goto(`${BASE}/me/notifications`, { waitUntil: "networkidle" });
    await co.waitForTimeout(2000);
    check("เปิดหน้าการแจ้งเตือน → อ่านแล้วทั้งหมด", (await sql("select count(*)::int n from notifications where coach_id=$1 and read_at is null", [s.member]))[0].n === 0);

    // กรอกอีเมล + ชื่ออังกฤษ → ครบมากขึ้น
    await co.goto(`${BASE}/me/settings`, { waitUntil: "networkidle" });
    await co.locator('input[name="email"]').fill("somjai@test.invalid");
    await co.locator('input[name="nameEn"]').fill("Somjai");
    await co.locator('input[name="familyNameEn"]').fill("Jaengtuen");
    await co.getByRole("button", { name: "บันทึกข้อมูลส่วนตัว" }).click();
    await co.waitForURL(/saved=profile/, { timeout: 30_000 });
    await co.goto(`${BASE}/me`, { waitUntil: "networkidle" });
    const pct2 = Number(((await co.locator("body").innerText()).match(/ข้อมูลของคุณครบ (\d+)%/) ?? [])[1]);
    check("กรอกอีเมล/ชื่ออังกฤษแล้ว % เพิ่มขึ้น", pct2 > pct, `${pct} → ${pct2}`);
    check("บันทึกอีเมลลงประวัติโค้ช", (await sql("select email from coaches where id=$1", [s.member]))[0].email === "somjai@test.invalid");

    // แจ้งเตือนจากการต่ออายุ (แอดมินต่อให้)
    await ad.goto(`${BASE}/renewals?tab=expiring`, { waitUntil: "networkidle" });
    await ad.getByLabel("เลือก สมใจ แจ้งเตือน").first().check();
    await ad.getByRole("button", { name: "ยืนยันต่ออายุ" }).click();
    await ad.getByText(/ต่ออายุแล้ว \d+ ใบ/).waitFor({ timeout: 30_000 });
    check("ต่ออายุ → โค้ชได้รับแจ้งเตือน", (await sql("select count(*)::int n from notifications where coach_id=$1 and type='RENEWAL_APPROVED'", [s.member]))[0].n >= 1);

    // รายงาน: ความครบถ้วน
    await ad.goto(`${BASE}/reports`, { waitUntil: "networkidle" });
    check("รายงาน: ส่วนความครบถ้วนของข้อมูล", (await ad.locator("main").innerText()).includes("ความครบถ้วนของข้อมูลผู้ฝึกสอน"));

    // ลบผู้ฝึกสอน: ยกเลิกแล้วต้องยังอยู่
    dialogAnswer = false;
    await ad.goto(`${BASE}/coaches/${s.otherB}`, { waitUntil: "networkidle" });
    await ad.getByRole("button", { name: "ลบผู้ฝึกสอน" }).click();
    await ad.waitForTimeout(1500);
    check("กดลบผู้ฝึกสอนแล้วยกเลิก → ยังอยู่", (await sql("select count(*)::int n from coaches where id=$1", [s.otherB]))[0].n === 1);
  },
};
