import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { SITE_URL } from "@/lib/seo";
import { currentLicence, licenceState, showPublicly } from "@/lib/academy";

// sitemap.xml — หน้าสาธารณะทั้งหมด + อคาเดมีที่แสดงบนทำเนียบ + ข่าว + บทความ + ทีม / นัดแข่ง G15
// (หน้านักเตะ G15 ซึ่งเป็นเยาวชน และหน้าตรวจสอบใบอนุญาตรายบุคคล ไม่ใส่)
export const revalidate = 3600;

const STATIC: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
  { path: "/", priority: 1, changeFrequency: "weekly" },
  { path: "/coach-center", priority: 0.9, changeFrequency: "weekly" },
  { path: "/courses", priority: 0.8, changeFrequency: "monthly" },
  { path: "/academies", priority: 0.9, changeFrequency: "weekly" },
  { path: "/academies/register", priority: 0.5, changeFrequency: "yearly" },
  { path: "/g15-womens-series", priority: 0.9, changeFrequency: "daily" },
  { path: "/g15-womens-series/matches", priority: 0.8, changeFrequency: "daily" },
  { path: "/g15-womens-series/standings", priority: 0.8, changeFrequency: "daily" },
  { path: "/g15-womens-series/stats", priority: 0.7, changeFrequency: "daily" },
  { path: "/g15-womens-series/teams", priority: 0.7, changeFrequency: "weekly" },
  { path: "/g15-womens-series/awards", priority: 0.6, changeFrequency: "weekly" },
  { path: "/g15-womens-series/stadium", priority: 0.5, changeFrequency: "monthly" },
  { path: "/g15-womens-series/gallery", priority: 0.6, changeFrequency: "weekly" },
  { path: "/play-and-learn", priority: 0.8, changeFrequency: "monthly" },
  { path: "/grassroots-football", priority: 0.7, changeFrequency: "monthly" },
  { path: "/training-centre", priority: 0.8, changeFrequency: "weekly" },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const url = (p: string) => `${SITE_URL}${p}`;
  const now = new Date();
  const [academies, news, articles, teams, matches] = await Promise.all([
    prisma.academy.findMany({ select: { id: true, active: true, updatedAt: true, licences: true } }),
    prisma.announcement.findMany({ select: { id: true, createdAt: true } }),
    prisma.trainingArticle.findMany({ select: { id: true, createdAt: true } }),
    prisma.g15Team.findMany({ select: { id: true } }),
    prisma.g15Match.findMany({ select: { id: true } }),
  ]).catch(() => [[], [], [], [], []] as const);

  return [
    ...STATIC.map((s) => ({ url: url(s.path), changeFrequency: s.changeFrequency, priority: s.priority })),
    ...academies
      .filter((a) => showPublicly(a.active, licenceState(currentLicence(a.licences), now)))
      .map((a) => ({ url: url(`/academies/${a.id}`), lastModified: a.updatedAt, changeFrequency: "monthly" as const, priority: 0.6 })),
    ...news.map((n) => ({ url: url(`/news/${n.id}`), lastModified: n.createdAt, priority: 0.6 })),
    ...articles.map((a) => ({ url: url(`/training-centre/${a.id}`), lastModified: a.createdAt, priority: 0.6 })),
    ...teams.map((t) => ({ url: url(`/g15-womens-series/teams/${t.id}`), changeFrequency: "weekly" as const, priority: 0.5 })),
    ...matches.map((m) => ({ url: url(`/g15-womens-series/matches/${m.id}`), changeFrequency: "daily" as const, priority: 0.5 })),
  ];
}
