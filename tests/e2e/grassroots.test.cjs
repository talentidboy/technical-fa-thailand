// ฟุตบอลรากหญ้า: หน้าสาธารณะแสดงปีล่าสุด (2026) · เลือกดูปี 2025 ได้ · แผนที่ทุกจังหวัดที่มีข้อมูล · หน้าแรกใช้ปีล่าสุด
const path = require("path");

module.exports = {
  name: "ฟุตบอลรากหญ้า: สถิติรายปี",
  async run(ctx) {
    const { check, BASE } = ctx;
    const pub = await ctx.page(null);

    await pub.goto(`${BASE}/grassroots-football`, { waitUntil: "networkidle", timeout: 240_000 });
    const stats = await pub.locator("#stats").innerText();
    check("ค่าเริ่มต้น = ปีล่าสุด 2026 (นักฟุตบอล 1,118 · ผู้ฝึกสอน 325)", stats.includes("2026") && stats.includes("1,118") && stats.includes("325"));
    check("ปุ่มเลือกปี 2026 / 2025", (await pub.getByRole("navigation", { name: "เลือกปี" }).getByRole("link").allInnerTexts()).join(",") === "ปี 2026,ปี 2025");
    const map = await pub.locator("#map").innerText();
    check("ปี 2026: แผนที่ทุกจังหวัดที่มีข้อมูล + 5 อันดับ (นครพนม)", map.includes("32 จังหวัด") && map.includes("นครพนม") && map.includes("ไม่มีข้อมูล"));
    check("ปี 2026: ส่วนนักฟุตบอล (อายุรายปี + ช่วงอายุแยกเพศ)", (await pub.locator("#players").innerText()).includes("อายุรายปี"));
    const coachTxt = await pub.locator("#coaches").innerText();
    check("ปี 2026: ส่วนผู้ฝึกสอน (อายุเฉลี่ย + ร่วมครั้งแรก 255)", coachTxt.includes("อายุเฉลี่ย") && coachTxt.includes("255"));
    check("ปี 2026: ไทม์ไลน์กิจกรรม", (await pub.locator("#events").count()) === 1);
    for (const id of ["stats", "players", "coaches", "map", "events"]) {
      await pub.locator(`#${id}`).scrollIntoViewIfNeeded();
      await pub.waitForTimeout(1200);
      await pub.locator(`#${id}`).screenshot({ path: path.join(ctx.artifactsDir, `grassroots-2026-${id}.png`) });
    }

    await pub.getByRole("link", { name: "ปี 2025" }).click();
    await pub.waitForURL(/year=2025/);
    await pub.getByText("2,888").first().waitFor({ timeout: 30_000 });
    check("กดปี 2025 → แสดงตัวเลขปี 2025", (await pub.locator("#stats").innerText()).includes("2,888"));
    check("ปี 2025: แผนที่แบบ 5 อันดับ", (await pub.locator("#map").innerText()).includes("ไม่อยู่ใน 5 อันดับ"));
    check("ปี 2025: ไม่มีข้อมูลละเอียด → ซ่อนอายุรายปี/ไทม์ไลน์", !(await pub.locator("#players").innerText()).includes("อายุรายปี") && (await pub.locator("#events").count()) === 0);

    // ===== ภาษาอังกฤษ (?lang=en) =====
    await pub.goto(`${BASE}/grassroots-football`, { waitUntil: "networkidle" });
    await pub.getByRole("navigation", { name: "Language / ภาษา" }).getByRole("link", { name: "EN" }).click();
    await pub.waitForURL(/lang=en/);
    await pub.getByText("Grassroots Football in 2026").waitFor({ timeout: 30_000 });
    const enStats = await pub.locator("#stats").innerText();
    check("EN: สถิติภาษาอังกฤษ", enStats.includes("Grassroots Football in 2026") && enStats.includes("Male 556 · Female 562"));
    check("EN: ชื่อจังหวัด/ช่วงอายุเป็นอังกฤษ", (await pub.locator("#map").innerText()).includes("Nakhon Phanom") && (await pub.locator("#players").innerText()).includes("11–12 yrs"));
    check("EN: ไทม์ไลน์เดือนภาษาอังกฤษ", (await pub.locator("#events").innerText()).includes("January"));
    for (const id of ["stats", "coaches", "map"]) {
      await pub.locator(`#${id}`).scrollIntoViewIfNeeded();
      await pub.waitForTimeout(800);
      await pub.locator(`#${id}`).screenshot({ path: path.join(ctx.artifactsDir, `grassroots-en-${id}.png`) });
    }
    await pub.getByRole("navigation", { name: "Choose year" }).getByRole("link", { name: "2025" }).click();
    await pub.waitForURL(/year=2025/);
    await pub.getByText("2,888").first().waitFor({ timeout: 30_000 });
    check("EN: เลือกปี 2025 แล้วยังเป็นภาษาอังกฤษ", new URL(pub.url()).searchParams.get("lang") === "en" && (await pub.locator("#map").innerText()).includes("Not in top 5"));
    await pub.getByRole("navigation", { name: "Language / ภาษา" }).getByRole("link", { name: "TH" }).click();
    await pub.waitForURL((u) => !u.searchParams.has("lang"));
    check("สลับกลับเป็นไทย (คงปี 2025)", new URL(pub.url()).searchParams.get("year") === "2025" && (await pub.locator("#stats").innerText()).includes("สถิติโครงการ"));

    const mobile = await ctx.page(null, { width: 390, height: 844 });
    await mobile.goto(`${BASE}/grassroots-football`, { waitUntil: "networkidle" });
    await mobile.screenshot({ path: path.join(ctx.artifactsDir, "grassroots-mobile.png"), fullPage: true });
    check("มือถือ: ไม่ล้นแนวนอน", (await mobile.evaluate(() => document.documentElement.scrollWidth)) <= 390);

    await pub.goto(`${BASE}/`, { waitUntil: "networkidle" });
    check("หน้าแรก: การ์ดฟุตบอลรากหญ้าใช้ปีล่าสุด", (await pub.locator("body").innerText()).includes("1,118 นักฟุตบอล ปี 2026"));
  },
};
