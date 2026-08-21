import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { LOGO_URL } from "@/lib/brand";

export function TalentIdMobileHeader() {
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-white/10 bg-indigo-950/90 px-4 py-3 backdrop-blur lg:hidden">
      <div className="flex items-center gap-2">
        <Image
          src={LOGO_URL}
          alt="FA Thailand"
          width={32}
          height={32}
          className="h-8 w-8 rounded-lg object-cover"
        />
        <div>
          <p className="text-sm font-bold text-white">Talent ID</p>
          <p className="text-[10px] text-indigo-300">FA Thailand Technical</p>
        </div>
      </div>
      <Link
        href="/"
        aria-label="กลับหน้าแรก"
        className="inline-flex items-center justify-center rounded-lg border border-white/15 p-2 text-indigo-200"
      >
        <ArrowLeft className="h-4 w-4" />
      </Link>
    </header>
  );
}
