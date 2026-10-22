// ระบบกันพัง: บันทึก error (รวมรายการซ้ำ) + หน้าแอดมิน, ย่อรูปใหญ่อัตโนมัติก่อนอัปโหลด, เช็กเวอร์ชันเว็บ
const sharp = require("sharp");

module.exports = {
  name: "ระบบกันพัง (บันทึก error / ย่อรูป / เวอร์ชันเว็บ)",
  async run(ctx) {
    const { check, sql, BASE } = ctx;

    // 1. บันทึก error จากหน้าเว็บ — error เดิมรวมเป็นรายการเดียว
    const post = (message) =>
      fetch(`${BASE}/api/client-error`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message, path: "/ทดสอบ", digest: "abc123" }) });
    await post("ทดสอบ error A");
    await post("ทดสอบ error A");
    await post("ทดสอบ error B");
    const logs = await sql("select message, count, source from error_logs order by id");
    check("บันทึก error จากหน้าเว็บ + รวมรายการซ้ำ", logs.length === 2 && logs[0].count === 2 && logs[0].source === "CLIENT", JSON.stringify(logs));
    const big = await fetch(`${BASE}/api/client-error`, { method: "POST", body: "x".repeat(20_000) });
    check("ปฏิเสธข้อมูลใหญ่ผิดปกติ", big.status === 413);

    const ad = await ctx.page(await ctx.login("ADMIN"));
    await ad.goto(`${BASE}/errors`, { waitUntil: "networkidle", timeout: 240_000 });
    let txt = await ad.locator("main").innerText();
    check("หน้าบันทึกข้อผิดพลาดแสดงรายการ + จำนวนครั้ง", txt.includes("ทดสอบ error A") && /เกิด\s*2\s*ครั้ง/.test(txt));
    check("เมนูแสดงจำนวน error ที่ยังไม่แก้", /บันทึกข้อผิดพลาด\s*2/.test(await ad.locator("nav, aside").first().innerText()));
    await ad.getByRole("button", { name: /แก้แล้วทั้งหมด/ }).click();
    await ad.waitForTimeout(2000);
    check("กดแก้แล้วทั้งหมด", (await sql("select count(*)::int n from error_logs where not resolved"))[0].n === 0);

    // 2. เวอร์ชันเว็บ
    const dep = await (await fetch(`${BASE}/api/deploy-id`)).json();
    check("API เวอร์ชันเว็บตอบได้", typeof dep.id === "string" && dep.id.length > 0);

    // 3. ย่อรูปใหญ่อัตโนมัติ (รูปมือถือ ~5MB → ต่ำกว่า 1.5MB) ในหน้าสมัครบัญชี
    const raw = Buffer.alloc(2400 * 2400 * 3);
    for (let i = 0; i < raw.length; i++) raw[i] = (Math.random() * 255) | 0;
    const jpeg = await sharp(raw, { raw: { width: 2400, height: 2400, channels: 3 } }).jpeg({ quality: 95 }).toBuffer();
    const p = await ctx.page(null);
    await p.goto(`${BASE}/register`, { waitUntil: "networkidle" });
    const input = p.locator('input[type="file"]').first();
    await input.setInputFiles({ name: "photo.jpg", mimeType: "image/jpeg", buffer: jpeg });
    await p
      .waitForFunction(
        (original) => {
          const el = document.querySelector('input[type="file"]');
          return el && !el.dataset.shrinking && el.files && el.files[0] && el.files[0].size < original;
        },
        jpeg.length,
        { timeout: 15_000 },
      )
      .catch(() => null);
    const after = await input.evaluate((el) => ({ size: el.files[0]?.size ?? 0, type: el.files[0]?.type ?? "" }));
    // รูปทดสอบเป็นจุดสุ่ม (บีบอัดยากกว่ารูปถ่ายจริงมาก) — เกณฑ์คือเล็กลงและไม่เกินขีดจำกัด 4MB ของเซิร์ฟเวอร์
    check(
      `ย่อรูป ${(jpeg.length / 1048576).toFixed(1)}MB → ${(after.size / 1048576).toFixed(2)}MB อัตโนมัติ`,
      after.size > 0 && after.size < jpeg.length && after.size < 4 * 1024 * 1024 && after.type === "image/jpeg",
    );
  },
};
