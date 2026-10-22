// หน้า Play and Learn: แอดมินแก้ข้อความ/เพิ่มเนื้อหาทุกประเภท → หน้าสาธารณะแสดงผล (ซ่อน/เรียงลำดับ/ลบ/พาสปอร์ต/ศูนย์ฝึก)
const STAR = "https://rgqahrqwxwhaechiodzf.supabase.co/storage/v1/object/public/uploads/play-and-learn-c51c1549-7449-4fde-8537-5f935c25cefc.png";
const FLOWER = "https://rgqahrqwxwhaechiodzf.supabase.co/storage/v1/object/public/uploads/play-and-learn-9a7b2d6b-5482-4bcb-aea7-952293222fd2.png";

const day = (d) => new Date(d.getTime() + 7 * 3600_000).toISOString().slice(0, 10);

async function until(fn, timeout = 20_000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (await fn()) return true;
    await new Promise((r) => setTimeout(r, 400));
  }
  return false;
}

module.exports = {
  name: "Play and Learn: จัดการเนื้อหา + หน้าสาธารณะ",
  async run(ctx) {
    const { check, sql, BASE } = ctx;
    const items = (kind) => sql("select * from play_and_learn_items where kind=$1 order by sort_order, id", [kind]);

    // ===== หน้าว่าง: หมวดที่ไม่มีข้อมูลต้องซ่อน · พาสปอร์ตใช้ 8 บทเดิม =====
    const pub = await ctx.page(null);
    await pub.goto(`${BASE}/play-and-learn`, { waitUntil: "networkidle", timeout: 240_000 });
    const ids = await pub.evaluate(() => ["events", "gallery", "videos", "voices", "faq"].filter((id) => document.getElementById(id)));
    check("หน้าว่าง: ซ่อนหมวดที่ไม่มีข้อมูล", ids.length === 0, ids.join(","));
    check("หน้าว่าง: พาสปอร์ต 8 บทเดิม", (await pub.locator('a[aria-label^="ดาวน์โหลดพาสปอร์ตบทที่"]:visible').count()) === 8);
    check("พาสปอร์ต: ทุกบทมีฉากพื้นหลัง", (await pub.locator('#passport a[aria-label^="ดาวน์โหลดพาสปอร์ตบทที่"]:visible svg[viewBox="0 0 160 96"]').count()) === 8);
    await pub.locator("#passport").scrollIntoViewIfNeeded();
    await pub.waitForTimeout(1200);
    await pub.locator("#passport").screenshot({ path: require("path").join(ctx.artifactsDir, "play-and-learn-passport.png") });
    check("บุคคลทั่วไป: ไม่เห็นปุ่มจัดการข้อมูล", (await pub.getByRole("link", { name: "จัดการข้อมูล" }).count()) === 0);

    const coachId = (await sql(`insert into coaches (name_th, surname_th, updated_at) values ('โค้ช','ทดสอบ', now()) returning id`))[0].id;
    const coach = await ctx.page(await ctx.login("COACH", { coachId }));
    await coach.goto(`${BASE}/play-and-learn/manage`, { waitUntil: "networkidle", timeout: 240_000 });
    check("โค้ชเข้าหน้าจัดการไม่ได้ (กลับไปหน้า Play and Learn)", new URL(coach.url()).pathname === "/play-and-learn");

    const ad = await ctx.page(await ctx.login("ADMIN"));
    ad.on("dialog", (d) => d.accept());
    const tab = (t) => ad.goto(`${BASE}/play-and-learn/manage?tab=${t}`, { waitUntil: "networkidle", timeout: 240_000 });
    const addForm = () => ad.locator("form", { has: ad.getByRole("button", { name: "เพิ่ม", exact: true }) });
    // กดส่งฟอร์มแล้วคืนข้อความผลลัพธ์ใหม่ (ทำเครื่องหมายข้อความเก่าไว้ก่อน กันอ่านผลของรอบก่อน)
    const submit = async (form, button) => {
      await form.evaluate((f) => f.querySelectorAll('[role="status"], [role="alert"]').forEach((el) => el.setAttribute("data-old", "1")));
      await form.getByRole("button", { name: button, exact: true }).click();
      return form
        .locator('[role="status"]:not([data-old]), [role="alert"]:not([data-old])')
        .filter({ hasNotText: "กำลังบันทึก" })
        .first()
        .innerText({ timeout: 30_000 })
        .catch(async () => {
          await ad.screenshot({ path: require("path").join(ctx.artifactsDir, `pl-${button}.png`), fullPage: true });
          const invalid = await form.evaluate((f) => [...f.querySelectorAll(":invalid")].map((el) => el.getAttribute("name")).join(","));
          return `ไม่มีผลลัพธ์ (ช่องไม่ผ่าน: ${invalid || "-"})`;
        });
    };
    const add = async (fields) => {
      const form = addForm();
      for (const [name, value] of Object.entries(fields)) await form.locator(`[name="${name}"]`).fill(value);
      return submit(form, "เพิ่ม");
    };
    // วันที่ของกิจกรรมตามเวลาไทย (คอลัมน์เก็บเวลา UTC)
    const eventDays = async () => (await sql(`select to_char(date + interval '7 hours', 'YYYY-MM-DD') d from play_and_learn_items where kind='EVENT' order by sort_order`)).map((r) => r.d);

    // ===== ข้อความทั่วไป =====
    await tab("general");
    await ad.locator('input[name="tagline"]').fill("Girls play, learn and shine");
    await ad.locator('input[name="contactPhone"]').fill("02-123-4567");
    const saved = await submit(ad.locator("form", { has: ad.locator('input[name="tagline"]') }), "บันทึกข้อความทั้งหมด");
    const settings = Object.fromEntries((await sql("select key, value from play_and_learn_settings")).map((r) => [r.key, r.value]));
    check("บันทึกข้อความ: คำขวัญ + เบอร์ติดต่อ", saved.includes("บันทึกแล้ว") && settings.tagline === "Girls play, learn and shine" && settings.contactPhone === "02-123-4567", saved);
    check("ช่องที่ไม่ได้แก้ไม่ถูกเก็บ (ยังใช้ข้อความเริ่มต้น)", Object.keys(settings).sort().join(",") === "contactPhone,tagline", Object.keys(settings).join(","));

    // ===== คำถามที่พบบ่อย: เพิ่ม 2 ข้อ → ซ่อนข้อแรก → เลื่อนข้อสองขึ้น =====
    await tab("FAQ");
    const r1 = await add({ title: "ต้องเตรียมอะไรไปบ้าง", body: "รองเท้าผ้าใบและขวดน้ำ" });
    check("เพิ่ม FAQ ข้อ 1", r1.includes("เพิ่มแล้ว"), r1);
    check("ฟอร์มถูกล้างหลังเพิ่มสำเร็จ", (await addForm().locator('[name="title"]').inputValue()) === "");
    await add({ title: "ค่าใช้จ่ายเท่าไร", body: "ไม่มีค่าใช้จ่าย" });
    check("เพิ่ม FAQ ข้อ 2 (ต่อท้าย)", (await items("FAQ")).map((f) => f.title).join("|") === "ต้องเตรียมอะไรไปบ้าง|ค่าใช้จ่ายเท่าไร");
    await ad.getByRole("button", { name: "ซ่อน ต้องเตรียมอะไรไปบ้าง" }).click();
    check("ซ่อน FAQ", await until(async () => (await items("FAQ"))[0].published === false));
    await ad.getByRole("button", { name: "เลื่อน ค่าใช้จ่ายเท่าไร ขึ้น" }).click();
    check("เลื่อน FAQ ขึ้น", await until(async () => (await items("FAQ"))[0].title === "ค่าใช้จ่ายเท่าไร"));

    // ===== กิจกรรม: ที่จะมาถึง + ที่ผ่านมา + ลบ =====
    await tab("EVENT");
    await add({ title: "เปิดสนามวันเด็ก", date: day(ctx.thaiMidnight(7)), extra: "ศูนย์ชลบุรี", body: "ชวนน้อง ๆ มาเล่นฟุตบอล", url: "https://example.com/apply" });
    await add({ title: "ปิดหลักสูตรรุ่นแรก", date: day(ctx.thaiMidnight(-30)) });
    await add({ title: "กิจกรรมที่จะลบ" });
    const evDays = await eventDays();
    check("เพิ่มกิจกรรม 3 รายการ (วันที่ตามเวลาไทย)", evDays.length === 3 && evDays[0] === day(ctx.thaiMidnight(7)) && evDays[1] === day(ctx.thaiMidnight(-30)), evDays.join(","));
    await ad.getByRole("button", { name: "ลบ กิจกรรมที่จะลบ" }).click();
    check("ลบกิจกรรม (กดยืนยัน)", await until(async () => (await items("EVENT")).length === 2));

    // ===== วิดีโอ: ลิงก์ผิด → แจ้ง · YouTube → ผ่าน =====
    await tab("VIDEO");
    const bad = await add({ title: "คลิปกิจกรรม", url: "https://example.com/video" });
    check("วิดีโอลิงก์ไม่ใช่ YouTube/Facebook → แจ้งเตือน", bad.includes("YouTube"), bad);
    const good = await add({ title: "คลิปกิจกรรม", url: "https://youtu.be/dQw4w9WgXcQ" });
    check("เพิ่มวิดีโอ YouTube", good.includes("เพิ่มแล้ว") && (await items("VIDEO")).length === 1, good);

    // ===== เสียงจากผู้ปกครอง =====
    await tab("TESTIMONIAL");
    await add({ body: "ลูกสาวสนุกมาก อยากมาทุกสัปดาห์", title: "คุณแม่น้องฟ้า", extra: "ผู้ปกครอง ศูนย์กรุงเทพฯ" });
    check("เพิ่มเสียงผู้ปกครอง", (await items("TESTIMONIAL")).length === 1);

    // แกลเลอรี/พาร์ทเนอร์ต้องอัปโหลดรูป — ใส่ตรงในฐานข้อมูล (ไม่อัปโหลดไฟล์จริงขึ้นพื้นที่เก็บไฟล์)
    await sql(
      `insert into play_and_learn_items (kind, title, image_url, extra, sort_order, updated_at) values
       ('PHOTO','วอร์มอัพ',$1,'อัลบั้ม A',1,now()), ('PHOTO','ยิงประตู',$2,'อัลบั้ม B',2,now()), ('PARTNER','UEFA',$1,null,1,now())`,
      [STAR, FLOWER],
    );
    await tab("PHOTO");
    check("แท็บแกลเลอรีแสดงรูป 2 รูป", (await ad.locator('img[alt="วอร์มอัพ"], img[alt="ยิงประตู"]').count()) === 2);

    // ===== พาสปอร์ต: นำเข้า 8 บทเดิม → แก้ชื่อบท 1 → ซ่อนบท 8 =====
    await tab("PASSPORT");
    await ad.getByRole("button", { name: /นำเข้า 8 บทเดิม/ }).click();
    check("นำเข้าพาสปอร์ต 8 บท", await until(async () => (await items("PASSPORT")).length === 8));
    await tab("PASSPORT");
    await ad.locator("summary", { hasText: "แก้ไข" }).first().click({ position: { x: 40, y: 12 } });
    const edit = ad.locator("details[open] form").first();
    await edit.locator('[name="title"]').fill("กุ๋งกิ๋งไปทะเล (ฉบับใหม่)");
    await edit.locator('select[name="extra"]').selectOption("ball");
    await submit(edit, "บันทึกการแก้ไข");
    const pp = await items("PASSPORT");
    check("แก้ชื่อ/ไอคอนบทพาสปอร์ต (ลิงก์ PDF เดิมยังอยู่)", pp[0].title === "กุ๋งกิ๋งไปทะเล (ฉบับใหม่)" && pp[0].extra === "ball" && /\.pdf$/.test(pp[0].url || ""));
    await ad.getByRole("button", { name: "ซ่อน กุ๋งกิ๋ง สุขสันต์วันลอยกระทง" }).click();
    await until(async () => (await items("PASSPORT"))[7].published === false);

    // ===== ศูนย์ฝึก =====
    await tab("centers");
    await ad.locator("summary", { hasText: "เพิ่มศูนย์ฝึกใหม่" }).click();
    const cf = ad.locator("form", { has: ad.getByRole("button", { name: "เพิ่มศูนย์ฝึก" }) });
    const center = { name: "ศูนย์ทดสอบชลบุรี", tel: "081-000-0000", province: "ชลบุรี", provinceEn: "Chonburi", address: "สนามกีฬากลาง อ.เมือง", coordinator: "คุณบอล" };
    for (const [k, v] of Object.entries(center)) await cf.locator(`[name="${k}"]`).fill(v);
    const centerRes = await submit(cf, "เพิ่มศูนย์ฝึก");
    check("เพิ่มศูนย์ฝึก", (await sql("select count(*)::int n from play_and_learn_centers"))[0].n === 1, centerRes);

    // ===== หน้าสาธารณะแสดงทุกอย่าง =====
    await pub.goto(`${BASE}/play-and-learn`, { waitUntil: "networkidle" });
    const body = await pub.locator("body").innerText();
    check("แสดงคำขวัญใหม่", body.includes("Girls play, learn and shine"));
    check("แสดงช่องทางติดต่อ", (await pub.locator('a[href="tel:021234567"]').count()) === 1);
    check("แสดงหมวดที่มีข้อมูลครบ", (await pub.evaluate(() => ["events", "gallery", "videos", "voices", "faq"].every((id) => document.getElementById(id)))) === true);
    check("FAQ ที่ซ่อนไม่แสดง", body.includes("ค่าใช้จ่ายเท่าไร") && !body.includes("ต้องเตรียมอะไรไปบ้าง"));
    check("กิจกรรมที่จะมาถึงมีป้าย + ที่ผ่านมาแยกหัวข้อ", (await pub.getByText("กำลังจะมาถึง").count()) === 1 && body.includes("กิจกรรมที่ผ่านมา") && !body.includes("กิจกรรมที่จะลบ"));
    check("พาสปอร์ตจากฐานข้อมูล (ซ่อน 1 บท → 7 บท)", (await pub.locator('a[aria-label^="ดาวน์โหลดพาสปอร์ตบทที่"]:visible').count()) === 7 && body.includes("กุ๋งกิ๋งไปทะเล (ฉบับใหม่)"));
    check("ตัวเลขเด่นนับศูนย์ฝึกอัตโนมัติ", body.includes("ศูนย์ฝึกกิจกรรม") && body.includes("จังหวัดทั่วประเทศ"));
    const mapHref = await pub.locator("#centers a", { hasText: "แผนที่" }).first().getAttribute("href");
    check("ศูนย์ฝึกไม่มีลิงก์แผนที่ → ค้นหาจากที่อยู่ใน Google Maps", (mapHref || "").startsWith("https://www.google.com/maps/search/"), mapHref);
    check("แสดงเสียงผู้ปกครอง + พาร์ทเนอร์", body.includes("คุณแม่น้องฟ้า") && (await pub.locator('img[alt="UEFA"]').count()) === 1);

    // แกลเลอรี: กรองอัลบั้ม + เปิดรูปใหญ่ + Esc ปิด
    await pub.getByRole("button", { name: "อัลบั้ม A", exact: true }).click();
    check("กรองอัลบั้มในแกลเลอรี", (await pub.locator('#gallery button[aria-label^="ดูรูป"]').count()) === 1);
    await pub.locator('#gallery button[aria-label^="ดูรูป"]').first().click();
    const dialog = pub.getByRole("dialog", { name: "ดูรูปขนาดใหญ่" });
    await dialog.waitFor({ timeout: 10_000 });
    await pub.keyboard.press("Escape");
    check("เปิดรูปใหญ่แล้วกด Esc ปิด", await until(async () => (await dialog.count()) === 0, 5000));

    // วิดีโอ: กดเล่นแล้วค่อยโหลดตัวเล่น
    check("ยังไม่โหลดตัวเล่นวิดีโอก่อนกด", (await pub.locator("iframe").count()) === 0);
    await pub.getByRole("button", { name: "เล่นวิดีโอ คลิปกิจกรรม" }).click();
    check("กดเล่นวิดีโอ → ฝัง YouTube", await until(async () => (await pub.locator('iframe[src*="youtube.com/embed/dQw4w9WgXcQ"]').count()) === 1, 5000));

    // FAQ เปิด/ปิด
    await pub.locator("#faq summary", { hasText: "ค่าใช้จ่ายเท่าไร" }).click();
    check("กดคำถามแล้วเห็นคำตอบ", await pub.getByText("ไม่มีค่าใช้จ่าย").isVisible());

    // มือถือ: ไม่มีแถบเลื่อนแนวนอน
    const mobile = await ctx.page(null, { width: 390, height: 844 });
    await mobile.goto(`${BASE}/play-and-learn`, { waitUntil: "networkidle" });
    const overflow = await mobile.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    check("มือถือ: หน้าไม่ล้นแนวนอน", overflow <= 0, `${overflow}px`);
    check("มือถือ: พาสปอร์ตแบบเส้นทางแนวตั้ง 7 บท", (await mobile.locator('a[aria-label^="ดาวน์โหลดพาสปอร์ตบทที่"]:visible').count()) === 7);

    // ภาพหน้าจอไว้ตรวจหน้าตา (tests/e2e/.artifacts) — เลื่อนผ่านทั้งหน้าก่อนให้ส่วนที่ค่อยๆ ปรากฏแสดงครบ
    const path = require("path");
    for (const [p, name] of [
      [pub, "desktop"],
      [mobile, "mobile"],
    ]) {
      await p.evaluate(async () => {
        for (let y = 0; y < document.body.scrollHeight; y += 300) {
          window.scrollTo(0, y);
          await new Promise((r) => setTimeout(r, 100));
        }
        window.scrollTo(0, 0);
      });
      await p.waitForTimeout(1500);
      await p.screenshot({ path: path.join(ctx.artifactsDir, `play-and-learn-${name}.png`), fullPage: true });
    }
    await tab("EVENT");
    await ad.screenshot({ path: path.join(ctx.artifactsDir, "play-and-learn-manage.png"), fullPage: true });

    const errors = await sql("select count(*)::int n from error_logs where source='SERVER'");
    check("ไม่มี error ฝั่งเซิร์ฟเวอร์", errors[0].n === 0, JSON.stringify(await sql("select path, message from error_logs limit 3")));
  },
};
