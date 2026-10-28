import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

// robots.txt — ให้เครื่องมือค้นหาเก็บเฉพาะหน้าสาธารณะ · หน้าหลังบ้าน / พอร์ทัล / ข้อมูลบุคคล ไม่ต้องเก็บ
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/me",
        "/academies/manage",
        "/academies/portal",
        "/academies/docs",
        "/g15-womens-series/manage",
        "/g15-womens-series/players/",
        "/play-and-learn/manage",
        "/training-centre/manage",
        "/verify/",
        "/dashboard",
        "/coaches",
        "/course-sessions",
        "/instructors",
        "/renewals",
        "/reports",
        "/requests",
        "/audit",
        "/errors",
        "/settings",
        "/users",
        "/talent-id",
        "/calendar",
        "/announcements",
        "/admin",
        "/setup",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
