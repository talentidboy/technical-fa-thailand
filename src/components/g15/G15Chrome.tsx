import { G15Header } from "./G15Header";
import { G15Nav } from "./G15Nav";

// รวม header + nav ไว้ในกล่อง sticky เดียวกัน เพื่อให้เมนูนำทางยังคงอยู่ตอนเลื่อนหน้าจอ
// (เดิม G15Nav ไม่ sticky จึงเลื่อนหายไปพร้อมเนื้อหา เหลือแต่ header ลอยค้างอยู่)
export function G15Chrome({ user }: { user: { role: string } | null }) {
  return (
    <div className="sticky top-0 z-20">
      <G15Header user={user} />
      <G15Nav />
    </div>
  );
}
