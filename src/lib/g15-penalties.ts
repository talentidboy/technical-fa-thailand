// ดวลจุดโทษ — กติกามาตรฐาน: ยิงสลับกันคนละ 5 ลูก ถ้ายังเสมอยิงต่อทีละคู่ (sudden death)
// จบทันทีเมื่อฝั่งหนึ่งนำจนอีกฝั่งยิงที่เหลือเข้าหมดก็ตามไม่ทัน · ใช้ได้ทั้งฝั่งเซิร์ฟเวอร์และเบราว์เซอร์

export type KickSide = "home" | "away";
export type ShootoutKick = { id: number; side: KickSide; scored: boolean; order: number; playerName: string | null };

export const REGULATION_KICKS = 5;

export function shootoutState(kicks: ShootoutKick[]) {
  const sorted = [...kicks].sort((a, b) => a.order - b.order);
  const home = sorted.filter((k) => k.side === "home");
  const away = sorted.filter((k) => k.side === "away");
  const nH = home.length;
  const nA = away.length;
  const sH = home.filter((k) => k.scored).length;
  const sA = away.filter((k) => k.scored).length;

  let winner: KickSide | null = null;
  if (nH <= REGULATION_KICKS && nA <= REGULATION_KICKS) {
    // ยังอยู่ใน 5 ลูกแรก: นำจนอีกฝั่งตามไม่ทันแล้ว
    if (sH > sA + (REGULATION_KICKS - nA)) winner = "home";
    else if (sA > sH + (REGULATION_KICKS - nH)) winner = "away";
  }
  // ยิงครบจำนวนเท่ากัน (ตั้งแต่ 5 ลูกขึ้นไป) แล้วประตูไม่เท่ากัน
  if (!winner && nH === nA && nH >= REGULATION_KICKS && sH !== sA) winner = sH > sA ? "home" : "away";

  const first = sorted[0]?.side ?? null;
  const nextSide: KickSide | null = winner || !first ? null : nH === nA ? first : nH < nA ? "home" : "away";

  return {
    kicks: sorted,
    home,
    away,
    homeScored: sH,
    awayScored: sA,
    first,
    winner,
    nextSide,
    suddenDeath: Math.min(nH, nA) >= REGULATION_KICKS,
    // จำนวนช่องที่แสดง (อย่างน้อย 5 ช่องต่อทีม)
    slots: Math.max(REGULATION_KICKS, nH, nA),
  };
}

export type ShootoutState = ReturnType<typeof shootoutState>;
