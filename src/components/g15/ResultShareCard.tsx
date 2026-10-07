"use client";

import { useRef, useState } from "react";
import { toPng } from "html-to-image";
import { Download, Loader2 } from "lucide-react";
import { G15_IMAGE_URL } from "@/lib/brand";

type CardTeam = { name: string; logoUrl: string | null };

export type ShareCardData = {
  kind: "result" | "matchday";
  round: string;
  roundEn: string;
  matchNo: number | null;
  dateLabel: string;
  venue: string | null;
  homeTeam: CardTeam;
  awayTeam: CardTeam;
  homeScore: number | null;
  awayScore: number | null;
  homePenalty: number | null;
  awayPenalty: number | null;
  homeScorers: string[];
  awayScorers: string[];
};

const SIZE = 1080;

function Crest({ team }: { team: CardTeam }) {
  return team.logoUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={team.logoUrl}
      alt=""
      crossOrigin="anonymous"
      style={{ width: 220, height: 220, borderRadius: 9999, objectFit: "cover", background: "#fff", boxShadow: "0 0 0 8px rgba(255,255,255,0.15)" }}
    />
  ) : (
    <div
      style={{ width: 220, height: 220, borderRadius: 9999, background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 96, fontWeight: 800, color: "#fff" }}
    >
      {team.name.charAt(0)}
    </div>
  );
}

// ภาพสรุปผล/โปสเตอร์วันแข่ง ขนาด 1080x1080 (โพสต์ IG/Facebook ได้ทันที) — วาดเป็น HTML ซ่อนนอกจอแล้วแปลงเป็น PNG ฝั่งเบราว์เซอร์
// ใช้ inline style ทั้งหมดเพื่อให้ขนาดตายตัว ไม่ขึ้นกับขนาดจอผู้ใช้ และสีตรงกับธีม G15 (#3b1890)
export function ResultShareCard({ data, fileName }: { data: ShareCardData; fileName: string }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isResult = data.kind === "result";

  async function handleDownload() {
    if (!cardRef.current) return;
    setBusy(true);
    setError(null);
    try {
      const dataUrl = await toPng(cardRef.current, { width: SIZE, height: SIZE, pixelRatio: 1, cacheBust: true });
      const link = document.createElement("a");
      link.download = fileName;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error(err);
      setError("สร้างภาพไม่สำเร็จ ลองใหม่อีกครั้ง");
    } finally {
      setBusy(false);
    }
  }

  const scorerList = (names: string[], align: "left" | "right") => (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: align === "left" ? "flex-start" : "flex-end", minHeight: 40 }}>
      {names.slice(0, 5).map((n) => (
        <span key={n} style={{ fontSize: 26, color: "rgba(255,255,255,0.85)", textAlign: align }}>
          ⚽ {n}
        </span>
      ))}
    </div>
  );

  return (
    <div>
      <button
        type="button"
        onClick={handleDownload}
        disabled={busy}
        className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-[11px] font-semibold text-white ring-1 ring-white/30 transition-colors hover:bg-white/25 disabled:opacity-60"
      >
        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
        {isResult ? "ภาพสรุปผล" : "โปสเตอร์วันแข่ง"}
      </button>
      {error && <p className="mt-1 text-[11px] text-red-200">{error}</p>}

      {/* ตัวการ์ดจริง — วางนอกจอ (ไม่ใช้ display:none เพราะ html-to-image ต้องวัดขนาดจาก layout จริง) */}
      <div aria-hidden style={{ position: "fixed", left: -10000, top: 0, pointerEvents: "none" }}>
        <div
          ref={cardRef}
          style={{
            width: SIZE,
            height: SIZE,
            position: "relative",
            overflow: "hidden",
            fontFamily: "var(--font-thai)",
            color: "#fff",
            background: "linear-gradient(135deg, #150833 0%, #291063 45%, #3b1890 100%)",
            display: "flex",
            flexDirection: "column",
            padding: 64,
            boxSizing: "border-box",
          }}
        >
          {/* ลายเส้นทแยงสีชมพู/ฟ้า แบบอาร์ตเวิร์กทางการ */}
          {[
            { left: -120, top: 120, w: 520, c: "#ec4899" },
            { left: 760, top: -60, w: 460, c: "#22d3ee" },
            { left: 640, top: 900, w: 560, c: "#d946ef" },
            { left: -200, top: 860, w: 420, c: "#22d3ee" },
          ].map((s, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                left: s.left,
                top: s.top,
                width: s.w,
                height: 26,
                background: `linear-gradient(90deg, transparent, ${s.c}, transparent)`,
                transform: "rotate(-35deg)",
                opacity: 0.55,
                borderRadius: 999,
              }}
            />
          ))}
          <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 14, background: "linear-gradient(90deg,#ad8a1f,#f3da93,#ad8a1f)" }} />

          <div style={{ display: "flex", alignItems: "center", gap: 24, position: "relative" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={G15_IMAGE_URL} alt="" crossOrigin="anonymous" style={{ width: 130, height: 130, objectFit: "contain" }} />
            <div>
              <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: 1 }}>FA THAILAND G15 WOMEN&apos;S FOOTBALL SERIES 2026</div>
              <div style={{ fontSize: 28, color: "#d2c4f3", marginTop: 6 }}>
                {data.matchNo != null && `Match ${data.matchNo} · `}
                {data.round} / {data.roundEn}
              </div>
            </div>
          </div>

          <div style={{ marginTop: 56, textAlign: "center", position: "relative" }}>
            <span
              style={{
                display: "inline-block",
                padding: "10px 32px",
                borderRadius: 999,
                fontSize: 30,
                fontWeight: 800,
                letterSpacing: 6,
                background: isResult ? "#f3da93" : "#ec4899",
                color: isResult ? "#4f3f0f" : "#fff",
              }}
            >
              {isResult ? "FULL TIME" : "MATCH DAY"}
            </span>
          </div>

          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, position: "relative" }}>
            <div style={{ width: 330, display: "flex", flexDirection: "column", alignItems: "center", gap: 22, textAlign: "center" }}>
              <Crest team={data.homeTeam} />
              <div style={{ fontSize: 34, fontWeight: 700, lineHeight: 1.25 }}>{data.homeTeam.name}</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
              {isResult ? (
                <>
                  <div style={{ fontSize: 150, fontWeight: 800, lineHeight: 1, letterSpacing: -2 }}>
                    {data.homeScore}
                    <span style={{ color: "#b49de9", margin: "0 18px" }}>-</span>
                    {data.awayScore}
                  </div>
                  {data.homePenalty != null && data.awayPenalty != null && (
                    <div style={{ fontSize: 30, color: "#f3da93", fontWeight: 700 }}>
                      จุดโทษ {data.homePenalty} - {data.awayPenalty}
                    </div>
                  )}
                </>
              ) : (
                <div style={{ fontSize: 110, fontWeight: 800, color: "#d2c4f3" }}>VS</div>
              )}
            </div>
            <div style={{ width: 330, display: "flex", flexDirection: "column", alignItems: "center", gap: 22, textAlign: "center" }}>
              <Crest team={data.awayTeam} />
              <div style={{ fontSize: 34, fontWeight: 700, lineHeight: 1.25 }}>{data.awayTeam.name}</div>
            </div>
          </div>

          {isResult && (data.homeScorers.length > 0 || data.awayScorers.length > 0) && (
            <div style={{ display: "flex", justifyContent: "space-between", gap: 40, marginBottom: 28, position: "relative" }}>
              {scorerList(data.homeScorers, "left")}
              {scorerList(data.awayScorers, "right")}
            </div>
          )}

          <div
            style={{
              position: "relative",
              borderTop: "2px solid rgba(255,255,255,0.18)",
              paddingTop: 24,
              display: "flex",
              justifyContent: "space-between",
              fontSize: 26,
              color: "#d2c4f3",
            }}
          >
            <span>{data.dateLabel}</span>
            <span style={{ maxWidth: 560, textAlign: "right", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{data.venue ?? ""}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
