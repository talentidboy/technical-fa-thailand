"use client";

import { useEffect } from "react";
import { isStaleDeploymentError, reloadOnceForNewVersion, reportClientError } from "@/lib/client-error";

// ใช้เมื่อ layout หลักพังทั้งหน้า — ต้องมี <html>/<body> เอง และไม่มี CSS ของเว็บ จึงใช้ style ในบรรทัด
export default function GlobalError({ error, unstable_retry }: { error: Error & { digest?: string }; unstable_retry: () => void }) {
  useEffect(() => {
    if (isStaleDeploymentError(error) && reloadOnceForNewVersion()) return;
    reportClientError(error);
  }, [error]);

  return (
    <html lang="th">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#f8fafc", color: "#0f172a" }}>
        <title>เกิดข้อผิดพลาด — FA Thailand Technical</title>
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ maxWidth: 420, width: "100%", background: "#fff", borderRadius: 24, padding: 32, textAlign: "center", boxShadow: "0 10px 30px rgba(15,23,42,.1)" }}>
            <div style={{ fontSize: 40 }}>⚠️</div>
            <h1 style={{ fontSize: 20, margin: "16px 0 8px" }}>ขออภัย เกิดข้อผิดพลาดบางอย่าง</h1>
            <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.6 }}>ระบบบันทึกปัญหานี้ไว้ให้เจ้าหน้าที่แล้ว กรุณาลองใหม่อีกครั้ง</p>
            <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 24 }}>
              <button
                type="button"
                onClick={() => unstable_retry()}
                style={{ background: "#4f46e5", color: "#fff", border: 0, borderRadius: 12, padding: "10px 20px", fontWeight: 600, cursor: "pointer" }}
              >
                ลองใหม่
              </button>
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- layout หลักพัง ใช้ลิงก์ธรรมดาเพื่อโหลดหน้าใหม่ทั้งหน้า */}
              <a href="/" style={{ color: "#475569", borderRadius: 12, padding: "10px 20px", fontWeight: 600, textDecoration: "none", border: "1px solid #e2e8f0" }}>
                กลับหน้าแรก
              </a>
            </div>
            {error.digest && <p style={{ marginTop: 24, fontSize: 11, color: "#94a3b8", fontFamily: "monospace" }}>รหัสอ้างอิง: {error.digest}</p>}
          </div>
        </div>
      </body>
    </html>
  );
}
