import { createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";

// "ลายนิ้วมือ" ของข้อมูลเกมสด — หน้าเว็บคนดูเรียกทุก ~3 วินาที แล้วโหลดหน้าใหม่เฉพาะตอนค่านี้เปลี่ยน
// (ยิงประตู/ใบเหลือง/เปลี่ยนตัว/เริ่ม-จบครึ่ง/ทดเวลา ฯลฯ) แทนการโหลดทั้งหน้าใหม่ทุกครั้ง
// ?match=<id> = นัดเดียว (หน้ารายละเอียดเกม) · ?stage=NATIONAL|REGIONAL = ทุกนัดในรอบ (หน้าแรก/หน้ารายการแข่ง/ตารางคะแนน)
// แคชที่ CDN 2 วินาที: ไม่ว่าคนดูกี่คน ฐานข้อมูลถูกถามประมาณครั้งเดียวต่อ 2 วินาทีต่อ URL
export async function GET(request: Request) {
  const url = new URL(request.url);
  const matchId = Number(url.searchParams.get("match"));
  const stage = url.searchParams.get("stage") === "REGIONAL" ? "REGIONAL" : "NATIONAL";
  const where = Number.isInteger(matchId) && matchId > 0 ? { id: matchId } : { stage };
  const eventWhere = Number.isInteger(matchId) && matchId > 0 ? { matchId } : { match: { stage } };

  const [matches, goals, cards, subs, lineups] = await Promise.all([
    prisma.g15Match.findMany({
      where,
      orderBy: { id: "asc" },
      select: {
        id: true,
        status: true,
        homeScore: true,
        awayScore: true,
        homePenalty: true,
        awayPenalty: true,
        clockPhase: true,
        firstHalfStartedAt: true,
        secondHalfStartedAt: true,
        firstHalfAddedTime: true,
        secondHalfAddedTime: true,
        matchDate: true,
        homeTeamId: true,
        awayTeamId: true,
      },
    }),
    prisma.g15Goal.aggregate({ where: eventWhere, _count: { id: true }, _max: { id: true } }),
    prisma.g15Card.aggregate({ where: eventWhere, _count: { id: true }, _max: { id: true } }),
    prisma.g15Substitution.aggregate({ where: eventWhere, _count: { id: true }, _max: { id: true } }),
    prisma.g15Lineup.aggregate({ where: eventWhere, _count: { id: true }, _max: { id: true } }),
  ]);

  const v = createHash("sha1")
    .update(JSON.stringify([matches, goals, cards, subs, lineups]))
    .digest("hex")
    .slice(0, 16);

  return Response.json(
    { v },
    { headers: { "Cache-Control": "public, max-age=0, s-maxage=2, stale-while-revalidate=2" } },
  );
}
