"use client";

import { useRef, useState } from "react";
import { toPng } from "html-to-image";
import { Download, Shield } from "lucide-react";

export function CoachCard({
  name,
  afcId,
  photoUrl,
  licenseLabel,
  residence,
  qrDataUrl,
}: {
  name: string;
  afcId: string;
  photoUrl: string | null;
  licenseLabel: string;
  residence: string;
  qrDataUrl: string;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  async function handleDownload() {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      const dataUrl = await toPng(cardRef.current, { pixelRatio: 3 });
      const link = document.createElement("a");
      link.download = `coach-card-${afcId || name}.png`;
      link.href = dataUrl;
      link.click();
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <div
        ref={cardRef}
        className="w-[380px] overflow-hidden rounded-2xl bg-white shadow-lg"
        style={{ fontFamily: "var(--font-thai)" }}
      >
        <div className="flex items-center gap-2 bg-indigo-600 px-5 py-3 text-white">
          <Shield className="h-5 w-5" />
          <div>
            <p className="text-sm font-bold leading-tight">
              บัตรประจำตัวผู้ฝึกสอน
            </p>
            <p className="text-[10px] leading-tight text-indigo-200">
              Football Coach Identification Card
            </p>
          </div>
        </div>

        <div className="flex gap-4 p-5">
          {photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photoUrl}
              alt=""
              className="h-24 w-20 rounded-lg object-cover ring-1 ring-slate-200"
            />
          ) : (
            <div className="flex h-24 w-20 items-center justify-center rounded-lg bg-indigo-100 text-2xl font-bold text-indigo-700">
              {name.charAt(0)}
            </div>
          )}
          <div className="flex-1">
            <p className="text-base font-bold text-slate-900">{name}</p>
            <p className="mt-1 text-xs text-slate-500">AFC ID</p>
            <p className="text-sm font-medium text-slate-700">
              {afcId || "-"}
            </p>
            <p className="mt-1 text-xs text-slate-500">จังหวัดที่พำนัก</p>
            <p className="text-sm font-medium text-slate-700">{residence}</p>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4">
          <div>
            <p className="text-xs text-slate-500">ระดับใบอนุญาตสูงสุด</p>
            <p className="text-lg font-bold text-indigo-600">
              {licenseLabel}
            </p>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrDataUrl} alt="QR verify" className="h-20 w-20" />
        </div>
      </div>

      <button
        onClick={handleDownload}
        disabled={downloading}
        className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm shadow-indigo-200 transition-colors hover:bg-indigo-700 disabled:opacity-60"
      >
        <Download className="h-4 w-4" />
        {downloading ? "กำลังบันทึก..." : "บันทึกรูปภาพ"}
      </button>
    </div>
  );
}
