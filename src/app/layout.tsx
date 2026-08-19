import type { Metadata } from "next";
import { Noto_Sans_Thai } from "next/font/google";
import { LOGO_URL } from "@/lib/brand";
import "./globals.css";

const notoSansThai = Noto_Sans_Thai({
  variable: "--font-thai",
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "FA Thailand Technical",
  description: "ระบบงานเทคนิคของสมาคมกีฬาฟุตบอลแห่งประเทศไทย",
  icons: {
    icon: LOGO_URL,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className={`${notoSansThai.variable} h-full antialiased`}>
      <body className="h-full bg-slate-50 text-slate-900">{children}</body>
    </html>
  );
}
