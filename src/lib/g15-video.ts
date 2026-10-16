// ลิงก์ถ่ายทอดสด/วิดีโอของนัด → URL สำหรับฝังในหน้า (iframe)
// รองรับ YouTube (watch / youtu.be / live / shorts / embed) และวิดีโอ/ไลฟ์ Facebook — ลิงก์อื่นแสดงเป็นปุ่มเปิดลิงก์อย่างเดียว

export type VideoEmbed = { provider: "youtube" | "facebook"; src: string } | null;

export function videoEmbed(raw: string | null | undefined): VideoEmbed {
  if (!raw) return null;
  let u: URL;
  try {
    u = new URL(raw.trim());
  } catch {
    return null;
  }
  const host = u.hostname.replace(/^www\.|^m\.|^mobile\./, "");

  if (host === "youtu.be" || host.endsWith("youtube.com")) {
    let id: string | null = null;
    if (host === "youtu.be") id = u.pathname.slice(1).split("/")[0];
    else if (u.pathname === "/watch") id = u.searchParams.get("v");
    else {
      const m = u.pathname.match(/^\/(?:live|shorts|embed)\/([\w-]{6,})/);
      if (m) id = m[1];
    }
    if (id && /^[\w-]{6,}$/.test(id)) return { provider: "youtube", src: `https://www.youtube.com/embed/${id}?rel=0&playsinline=1` };
    return null;
  }

  if (host === "facebook.com" || host === "fb.watch" || host === "fb.com") {
    const href = encodeURIComponent(u.toString());
    return { provider: "facebook", src: `https://www.facebook.com/plugins/video.php?href=${href}&show_text=false&width=1280&allowfullscreen=true` };
  }
  return null;
}

// ตรวจรูปแบบลิงก์ตอนบันทึก (ต้องเป็น http/https)
export function normalizeVideoUrl(raw: string) {
  const v = raw.trim();
  if (!v) return null;
  let u: URL;
  try {
    u = new URL(/^https?:\/\//i.test(v) ? v : `https://${v}`);
  } catch {
    throw new Error("ลิงก์ไม่ถูกต้อง");
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") throw new Error("ลิงก์ต้องขึ้นต้นด้วย http:// หรือ https://");
  return u.toString();
}
