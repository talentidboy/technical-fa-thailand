import type { Metadata } from "next";
import "@fontsource/noto-sans-thai/400.css";
import "@fontsource/noto-sans-thai/500.css";
import "@fontsource/noto-sans-thai/600.css";
import "@fontsource/noto-sans-thai/700.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "FA Thailand Technical",
  description: "ระบบงานเทคนิคของสมาคมกีฬาฟุตบอลแห่งประเทศไทย",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className="h-full antialiased">
      <body className="h-full bg-slate-50 text-slate-900">{children}</body>
    </html>
  );
}
