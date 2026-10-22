// ต่ออายุใบอนุญาต: แอดมินต่อหลายใบ, โค้ชยื่นคำขอ → ไม่อนุมัติ/อนุมัติ, ยกเลิกย้อนกลับ, ใบที่อัปเกรดแล้วไม่ต้องต่อ
const ADMIN_EMAIL = "e2e-admin@test.invalid";

async function seed(ctx) {
  const t = ctx.thaiMidnight;
  const coach = async (name, recs) => {
    const id = (await ctx.sql(`insert into coaches (name_th, surname_th, afc_id, tel_no, updated_at) values ($1,'ทดสอบ',$2,'0812345678', now()) returning id`, [name, `AFC-${name}`]))[0].id;
    const ids = {};
    for (const [type, issueDays, expireDays, cert] of recs) {
      ids[type] = (
        await ctx.sql(
          `insert into license_records (coach_id, license_type, record_type, certificate_no, issue_date, expire_date) values ($1,$2,'TRAINING',$3,$4,$5) returning record_id`,
          [id, type, cert, t(issueDays), expireDays == null ? null : t(expireDays)],
        )
      )[0].record_id;
    }
    return { id, ids };
  };
  return {
    ka: await coach("โค้ชก", [["B", -4000, -2900, "B-15/0001"], ["A", -1055, 40, "A-23/0007"]]), // A ใกล้หมด, B มีระดับสูงกว่าแล้ว
    kb: await coach("โค้ชข", [["C", -1245, -150, "C-22/0100"]]), // หมดอายุไม่เกิน 1 ปี
    kc: await coach("โค้ชค", [["G", -2200, -1100, "Intro.0001"]]), // หมดอายุเกิน 1 ปี
    kd: await coach("โค้ชง", [["C", -365, 730, "C-25/0001"]]), // ยังใช้ได้ → ไม่อยู่ในรายการ
    ke: await coach("โค้ชจ", [["GK_I", -995, 100, "GK-23/0003"], ["C", -100, 995, "C-26/0002"]]),
  };
}

module.exports = {
  name: "ต่ออายุใบอนุญาต",
  async run(ctx) {
    const { check, sql, BASE } = ctx;
    const st = await seed(ctx);
    const adminToken = await ctx.login("ADMIN", { email: ADMIN_EMAIL });
    const coachToken = await ctx.login("COACH", { coachId: st.ka.id });
    const expOf = async (id) => (await sql("select to_char((expire_date + interval '7 hours'), 'YYYY-MM-DD') d from license_records where record_id=$1", [id]))[0].d;
    const plusYears = (ymd, y) => `${Number(ymd.slice(0, 4)) + y}${ymd.slice(4)}`;
    const A = st.ka.ids.A;
    const C_kb = st.kb.ids.C;
    const a40 = await expOf(A);

    // 1. แอดมิน: ใกล้หมดอายุ
    const ad = await ctx.page(adminToken);
    await ad.goto(`${BASE}/renewals`, { waitUntil: "networkidle", timeout: 240_000 });
    let txt = await ad.locator("main").innerText();
    check("แท็บใกล้หมดอายุ: มี A ของโค้ชก และ GK_I ของโค้ชจ", txt.includes("โค้ชก ทดสอบ") && txt.includes("โค้ชจ ทดสอบ"));
    check("ไม่แสดงใบที่ยังใช้ได้ และใบที่อัปเกรดไปแล้ว", !txt.includes("โค้ชง ทดสอบ") && !txt.includes("B-15/0001"));

    // 2. โค้ช: ขอต่ออายุ
    const co = await ctx.page(coachToken, { width: 390, height: 844 });
    await co.goto(`${BASE}/me`, { waitUntil: "networkidle", timeout: 240_000 });
    txt = await co.locator("body").innerText();
    check("หน้าโค้ช: แจ้งเตือนใบ A จะหมดอายุ", /ใบอนุญาต A จะหมดอายุในอีก \d+ วัน/.test(txt));
    check("หน้าโค้ช: ใบ B = มีระดับสูงกว่าแล้ว", txt.includes("มีระดับสูงกว่าแล้ว"));
    await co.getByRole("button", { name: "ขอต่ออายุใบอนุญาต" }).click();
    await co.locator('textarea[name="note"]').fill("สัมมนาผู้ฝึกสอนประจำปี 2569 (8 ชม.)");
    await co.getByRole("button", { name: "ส่งคำขอ" }).click();
    await co.getByText("รอเจ้าหน้าที่ตรวจสอบ").waitFor({ timeout: 30_000 });
    check("สร้างคำขอ (PENDING)", (await sql("select count(*)::int n from license_renewals where license_record_id=$1 and status='PENDING' and requested_by_coach", [A]))[0].n === 1);

    // 3. แอดมิน: ไม่อนุมัติ (ต้องมีเหตุผล)
    await ad.goto(`${BASE}/renewals`, { waitUntil: "networkidle" });
    check("แท็บเริ่มต้น = คำขอจากโค้ช พร้อมข้อความของโค้ช", (await ad.locator("main").innerText()).includes("สัมมนาผู้ฝึกสอนประจำปี 2569"));
    await ad.getByRole("button", { name: "ไม่อนุมัติ", exact: true }).click();
    await ad.getByPlaceholder("เหตุผล เช่น").fill("กรุณาแนบหลักฐาน CPD");
    await ad.getByRole("button", { name: "ยืนยันไม่อนุมัติ" }).click();
    await ad.getByText("บันทึกว่าไม่อนุมัติแล้ว").waitFor({ timeout: 30_000 });
    check("บันทึกไม่อนุมัติ", (await sql("select status from license_renewals where license_record_id=$1", [A]))[0].status === "REJECTED");
    await co.reload({ waitUntil: "networkidle" });
    txt = await co.locator("body").innerText();
    check("โค้ชเห็นเหตุผล และยื่นใหม่ได้", txt.includes("คำขอครั้งก่อนไม่อนุมัติ: กรุณาแนบหลักฐาน CPD") && txt.includes("ขอต่ออายุใบอนุญาต"));

    // 4. ยื่นใหม่ → อนุมัติ
    await co.getByRole("button", { name: "ขอต่ออายุใบอนุญาต" }).click();
    await co.locator('textarea[name="note"]').fill("แนบหลักฐานแล้ว สัมมนา 2569");
    await co.getByRole("button", { name: "ส่งคำขอ" }).click();
    await co.getByText("รอเจ้าหน้าที่ตรวจสอบ").waitFor({ timeout: 30_000 });
    await ad.goto(`${BASE}/renewals?tab=requests`, { waitUntil: "networkidle" });
    await ad.getByLabel("เลือก โค้ชก ทดสอบ").check();
    check("พรีวิววันหมดอายุใหม่", (await ad.locator("li", { hasText: "เลขที่ A-23/0007" }).innerText()).includes("ใหม่"));
    await ad.getByRole("button", { name: "ยืนยันต่ออายุ" }).click();
    await ad.getByText("ต่ออายุแล้ว 1 ใบ").waitFor({ timeout: 30_000 });
    check("ใบยังไม่หมดอายุ → ต่อจากวันหมดอายุเดิม +3 ปี", (await expOf(A)) === plusYears(a40, 3), `${a40} → ${await expOf(A)}`);
    const rr = await sql("select status, requested_by_coach from license_renewals where license_record_id=$1 order by id", [A]);
    check("อนุมัติคำขอเดิม (ไม่สร้างรายการซ้ำ)", rr.length === 2 && rr[1].status === "APPROVED" && rr[1].requested_by_coach);
    await co.reload({ waitUntil: "networkidle" });
    txt = await co.locator("body").innerText();
    check("หน้าโค้ช: ต่ออายุแล้ว ไม่มีแจ้งเตือน", txt.includes("ต่ออายุล่าสุดเมื่อ") && !/ใบอนุญาต A จะหมดอายุ/.test(txt));

    // 5. หมดอายุแล้ว → นับจากวันนี้
    await ad.goto(`${BASE}/renewals?tab=recent`, { waitUntil: "networkidle" });
    check("แท็บหมดอายุไม่เกิน 1 ปี: มีเฉพาะโค้ชข", (await ad.locator("main").innerText()).includes("โค้ชข ทดสอบ") && !(await ad.locator("main").innerText()).includes("โค้ชค ทดสอบ"));
    await ad.getByLabel("เลือก โค้ชข ทดสอบ").check();
    await ad.getByRole("button", { name: "ยืนยันต่ออายุ" }).click();
    await ad.getByText("ต่ออายุแล้ว 1 ใบ").waitFor({ timeout: 30_000 });
    const newC = await expOf(C_kb);
    check("ใบหมดอายุแล้ว → วันนี้ +3 ปี", newC === plusYears(ctx.todayThai(), 3), newC);

    // 6. กรองระดับ + ค้นหา
    await ad.goto(`${BASE}/renewals?tab=expiring&level=GK`, { waitUntil: "networkidle" });
    txt = await ad.locator("main").innerText();
    check("กรองระดับ GK", txt.includes("โค้ชจ ทดสอบ") && !txt.includes("โค้ชก ทดสอบ"));
    await ad.goto(`${BASE}/renewals?tab=old&q=${encodeURIComponent("โค้ชค")}`, { waitUntil: "networkidle" });
    check("ค้นหาชื่อในแท็บหมดอายุเกิน 1 ปี", (await ad.locator("main").innerText()).includes("โค้ชค ทดสอบ"));

    // 7. ประวัติ + ยกเลิก
    ad.on("dialog", (d) => d.accept());
    await ad.goto(`${BASE}/renewals?tab=history`, { waitUntil: "networkidle" });
    await ad.locator("li", { hasText: "โค้ชข ทดสอบ" }).filter({ hasText: `โดย ${ADMIN_EMAIL}` }).getByRole("button", { name: "ยกเลิก" }).click();
    await ad.waitForTimeout(2500);
    check("ยกเลิกการต่ออายุของแอดมิน → คืนวันเดิม + ลบรายการ", (await expOf(C_kb)) !== newC && (await sql("select count(*)::int n from license_renewals where license_record_id=$1", [C_kb]))[0].n === 0);
    await ad.reload({ waitUntil: "networkidle" });
    await ad.locator("li", { hasText: "โค้ชก ทดสอบ" }).filter({ hasText: `โดย ${ADMIN_EMAIL}` }).filter({ hasText: "ต่ออายุแล้ว" }).getByRole("button", { name: "ยกเลิก" }).click();
    await ad.waitForTimeout(2500);
    check(
      "ยกเลิกคำขอที่อนุมัติแล้ว → คืนวันเดิม + กลับเป็นรอตรวจสอบ",
      (await expOf(A)) === a40 && (await sql("select count(*)::int n from license_renewals where license_record_id=$1 and status='PENDING'", [A]))[0].n === 1,
    );

    // 8. หน้าประวัติโค้ช: ต่ออายุใบเดียว
    await ad.goto(`${BASE}/coaches/${st.kc.id}`, { waitUntil: "networkidle" });
    await ad.getByRole("button", { name: "ต่ออายุ", exact: true }).click();
    await ad.getByRole("button", { name: "ยืนยัน", exact: true }).click();
    await ad.waitForTimeout(3000);
    check("ต่ออายุจากหน้าประวัติโค้ช", (await expOf(st.kc.ids.G)) === plusYears(ctx.todayThai(), 3));
    await ad.goto(`${BASE}/coaches/${st.ka.id}`, { waitUntil: "networkidle" });
    check("หน้าประวัติโค้ช: B = มีระดับสูงกว่าแล้ว", (await ad.locator("main").innerText()).includes("มีระดับสูงกว่าแล้ว"));
    check("เมนูแสดงคำขอค้าง 1", /ต่ออายุใบอนุญาต\s*1/.test(await ad.locator("nav, aside").first().innerText()));

    // 9. มือถือ
    const ph = await ctx.page(adminToken, { width: 390, height: 844 });
    await ph.goto(`${BASE}/renewals?tab=expiring`, { waitUntil: "networkidle" });
    await ph.getByLabel("เลือก โค้ชจ ทดสอบ").check();
    check("มือถือ: ไม่มีเลื่อนซ้ายขวา", (await ph.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)) <= 0);
  },
};
