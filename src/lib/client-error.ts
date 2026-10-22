// ใช้ฝั่งเบราว์เซอร์: ส่ง error ที่ผู้ใช้เห็นไปบันทึก + ตรวจว่าเป็น error จากหน้าเวอร์ชันเก่าหลังอัปเดตระบบหรือไม่

// หน้าที่เปิดค้างไว้ตอนเว็บอัปเดต จะเรียก Server Action / ไฟล์ JS ของเวอร์ชันเก่าที่ไม่มีแล้ว
export function isStaleDeploymentError(error: { message?: string; name?: string }) {
  const m = `${error.name ?? ""} ${error.message ?? ""}`;
  return /Failed to find Server Action|older or newer deployment|ChunkLoadError|Loading chunk [\w-]+ failed|Failed to fetch dynamically imported module|Importing a module script failed/i.test(m);
}

// โหลดหน้าใหม่อัตโนมัติ 1 ครั้ง (กันวนลูป: ถ้าเพิ่งโหลดใหม่ไปไม่ถึง 30 วินาที จะไม่โหลดซ้ำ)
export function reloadOnceForNewVersion() {
  try {
    const key = "fa-reloaded-for-new-version";
    const last = Number(sessionStorage.getItem(key) ?? 0);
    if (Date.now() - last < 30_000) return false;
    sessionStorage.setItem(key, String(Date.now()));
  } catch {
    // sessionStorage ใช้ไม่ได้ (โหมดส่วนตัวบางแบบ) — โหลดใหม่ได้เลย
  }
  window.location.reload();
  return true;
}

export function reportClientError(error: Error & { digest?: string }) {
  try {
    const body = JSON.stringify({
      message: error.message,
      digest: error.digest,
      path: window.location.pathname,
      stack: error.stack?.slice(0, 4000),
    });
    if (navigator.sendBeacon) navigator.sendBeacon("/api/client-error", new Blob([body], { type: "application/json" }));
    else void fetch("/api/client-error", { method: "POST", body, headers: { "Content-Type": "application/json" }, keepalive: true });
  } catch {
    // ส่งไม่สำเร็จก็ไม่เป็นไร
  }
}
