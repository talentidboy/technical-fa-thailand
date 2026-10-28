import type { Metadata } from "next";

// ชื่อหน้า / คำอธิบาย / ตัวอย่างลิงก์ (Open Graph) ของหน้าสาธารณะ — ใช้ร่วมกันทุกหมวด
// ภาพตัวอย่างลิงก์ของแต่ละหมวดอยู่ที่ public/og/<หมวด>.jpg (1200×630) — หน้าที่ไม่มีภาพของตัวเองใช้ภาพของหมวดตามที่อยู่หน้า

export const SITE_NAME = "FA Thailand Technical";

const SECTION_IMAGES = ["academies", "coach-center", "courses", "g15-womens-series", "grassroots-football", "play-and-learn", "training-centre"];
const sectionImage = (path: string) => {
  const section = path.split("/")[1] ?? "";
  return `/og/${SECTION_IMAGES.includes(section) ? section : "site"}.jpg`;
};

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000");

export function pageMeta({
  title,
  description,
  path,
  image,
  noindex = false,
}: {
  title?: string; // ว่าง = ใช้ชื่อเว็บอย่างเดียว
  description: string;
  path: string;
  image?: string | null; // ภาพเฉพาะหน้า (เช่น ภาพปกข่าว) — ไม่ใส่ = ใช้ภาพของหมวด (public/og)
  noindex?: boolean; // หน้าที่มีข้อมูลบุคคล (ไม่ให้ค้นหาเจอ)
}): Metadata {
  const full = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
  const desc = description.replace(/\s+/g, " ").trim().slice(0, 200);
  const images = [image ? { url: image, alt: full } : { url: sectionImage(path), width: 1200, height: 630, alt: full }];
  return {
    metadataBase: new URL(SITE_URL),
    title: full,
    description: desc,
    alternates: { canonical: path },
    openGraph: {
      title: full,
      description: desc,
      url: path,
      siteName: SITE_NAME,
      locale: "th_TH",
      type: "website",
      images,
    },
    twitter: { card: "summary_large_image", title: full, description: desc, images },
    ...(noindex ? { robots: { index: false, follow: true } } : {}),
  };
}
