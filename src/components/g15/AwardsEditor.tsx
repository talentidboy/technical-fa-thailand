"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, X, Plus, Trophy, Medal, Award, Users, Sparkles, RefreshCw, Check } from "lucide-react";
import { TeamBadge } from "./TeamBadge";
import {
  INDIVIDUAL_AWARDS,
  TEAM_AWARDS,
  BEST_XI_SLOTS,
  POSITION_GROUP_LABEL,
  type PositionGroup,
} from "@/lib/g15-awards";

export type EdTeam = { id: number; name: string; logoUrl: string | null; groupName: string | null };
export type EdPlayer = {
  id: number;
  teamId: number;
  name: string;
  number: number | null;
  photoUrl: string | null;
  group: PositionGroup | null;
  position: string | null;
  active: boolean;
};
export type EdOfficial = { id: number; teamId: number; name: string; role: string | null; rank: number };
export type EdSuggestion = { id: number; note: string | null } | null;

type Person = { id: number; teamId: number; name: string; sub: string | null; number: number | null; photoUrl: string | null; group: PositionGroup | null };

const GROUPS: PositionGroup[] = ["GK", "DF", "MF", "FW"];

function Avatar({ p, size = "md", ring = "ring-slate-200" }: { p: Pick<Person, "photoUrl" | "number" | "name"> | null; size?: "sm" | "md" | "lg"; ring?: string }) {
  const box = { sm: "h-9 w-9 text-sm", md: "h-12 w-12 text-base", lg: "h-14 w-14 text-lg" }[size];
  if (!p) return <span className={`flex ${box} flex-none items-center justify-center rounded-full border-2 border-dashed border-slate-300 text-slate-400`}><Plus className="h-5 w-5" /></span>;
  if (p.photoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={p.photoUrl} alt="" className={`${box} flex-none rounded-full object-cover ring-2 ${ring}`} />;
  }
  return (
    <span className={`flex ${box} flex-none items-center justify-center rounded-full bg-g15-50 font-mono font-black text-g15-700 ring-2 ${ring}`}>
      {p.number ?? p.name.charAt(0)}
    </span>
  );
}

// ป็อปอัพเลือกคน: ค้นหาชื่อ/เบอร์ + กรองทีม + กรองตำแหน่ง (เฉพาะนักกีฬา) — กดการ์ดเพื่อเลือก
function PersonPicker({
  title,
  people,
  teams,
  selectedId,
  defaultGroup,
  usedBy,
  onPick,
  onClose,
}: {
  title: string;
  people: Person[];
  teams: EdTeam[];
  selectedId: number | null;
  defaultGroup?: PositionGroup | null;
  usedBy?: Map<number, string>;
  onPick: (id: number | null) => void;
  onClose: () => void;
}) {
  const [q, setQ] = useState("");
  const [team, setTeam] = useState<number | null>(null);
  const [group, setGroup] = useState<PositionGroup | null>(defaultGroup ?? null);
  const hasGroups = people.some((p) => p.group);
  const teamById = new Map(teams.map((t) => [t.id, t]));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const text = q.trim().toLowerCase();
  const list = people.filter(
    (p) =>
      (team == null || p.teamId === team) &&
      (group == null || p.group === group) &&
      (!text || p.name.toLowerCase().includes(text) || (p.number != null && String(p.number) === text.replace("#", ""))),
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 sm:items-center sm:p-4"
    >
      <div className="flex max-h-[92vh] w-full max-w-3xl flex-col rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl">
        <div className="space-y-3 border-b border-slate-100 p-4 sm:p-5">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-bold text-slate-900">{title}</h3>
            <button type="button" onClick={onClose} aria-label="ปิด" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="ค้นหาชื่อ หรือพิมพ์เบอร์เสื้อ"
              className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm focus:border-g15-400 focus:outline-none focus:ring-2 focus:ring-g15-100"
            />
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setTeam(null)}
              className={`flex-none rounded-full px-3 py-1.5 text-xs font-semibold ${team == null ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
            >
              ทุกทีม
            </button>
            {teams.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTeam(team === t.id ? null : t.id)}
                title={t.name}
                className={`inline-flex flex-none items-center gap-1.5 rounded-full py-1 pl-1 pr-3 text-xs font-semibold ${
                  team === t.id ? "bg-g15-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <TeamBadge team={t} size="sm" />
                <span className="max-w-28 truncate">{t.name}</span>
              </button>
            ))}
          </div>
          {hasGroups && (
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setGroup(null)}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${group == null ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600"}`}
              >
                ทุกตำแหน่ง
              </button>
              {GROUPS.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGroup(g)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${group === g ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600"}`}
                >
                  {POSITION_GROUP_LABEL[g]}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="overflow-y-auto p-3 sm:p-4">
          {list.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-400">ไม่พบรายชื่อ — ลองเปลี่ยนทีม/ตำแหน่ง หรือคำค้นหา</p>
          ) : (
            <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((p) => {
                const used = usedBy?.get(p.id);
                const selected = p.id === selectedId;
                const t = teamById.get(p.teamId);
                return (
                  <li key={p.id}>
                    <button
                      type="button"
                      disabled={!!used && !selected}
                      onClick={() => onPick(p.id)}
                      className={`flex w-full items-center gap-3 rounded-xl p-2.5 text-left ring-1 transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                        selected ? "bg-g15-50 ring-2 ring-g15-500" : "bg-white ring-slate-200 hover:bg-slate-50 hover:ring-g15-300"
                      }`}
                    >
                      <Avatar p={p} size="sm" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-slate-900">
                          {p.number != null && <span className="mr-1 font-mono text-g15-600">#{p.number}</span>}
                          {p.name}
                        </span>
                        <span className="flex items-center gap-1 truncate text-[11px] text-slate-500">
                          {t && <TeamBadge team={t} size="sm" />}
                          <span className="truncate">{used && !selected ? `อยู่ในตำแหน่ง ${used} แล้ว` : [p.sub, t?.name].filter(Boolean).join(" · ")}</span>
                        </span>
                      </span>
                      {selected && <Check className="h-4 w-4 flex-none text-g15-600" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        <div className="flex justify-between gap-2 border-t border-slate-100 p-3">
          <button type="button" onClick={() => onPick(null)} className="rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50">
            ล้างที่เลือก
          </button>
          <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100">
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
}

type Picker =
  | { kind: "award"; key: string }
  | { kind: "team"; key: string }
  | { kind: "xi"; slot: string }
  | null;

// ฟอร์มรางวัลทั้งหมดแบบกดเลือกจากการ์ด (ส่งค่าผ่าน hidden input ชื่อเดิม: winner_<KEY>, note_<KEY>, xi_<SLOT>)
export function AwardsEditor({
  teams,
  players,
  officials,
  initialWinners,
  initialNotes,
  initialXi,
  suggestions,
}: {
  teams: EdTeam[];
  players: EdPlayer[];
  officials: EdOfficial[];
  initialWinners: Record<string, number | null>;
  initialNotes: Record<string, string>;
  initialXi: Record<string, number | null>;
  suggestions: Record<string, EdSuggestion>;
}) {
  const [winners, setWinners] = useState(initialWinners);
  const [notes, setNotes] = useState(initialNotes);
  const [xi, setXi] = useState(initialXi);
  const [picker, setPicker] = useState<Picker>(null);

  const teamById = useMemo(() => new Map(teams.map((t) => [t.id, t])), [teams]);
  const playerPeople: Person[] = useMemo(
    () =>
      players.map((p) => ({
        id: p.id,
        teamId: p.teamId,
        name: p.name,
        sub: p.position ? `${p.position}${p.active ? "" : " (ไม่อยู่ในรายชื่อปัจจุบัน)"}` : null,
        number: p.number,
        photoUrl: p.photoUrl,
        group: p.group,
      })),
    [players],
  );
  const officialPeople: Person[] = useMemo(
    () =>
      [...officials]
        .sort((a, b) => a.rank - b.rank)
        .map((o) => ({ id: o.id, teamId: o.teamId, name: o.name, sub: o.role, number: null, photoUrl: null, group: null })),
    [officials],
  );
  const playerById = useMemo(() => new Map(playerPeople.map((p) => [p.id, p])), [playerPeople]);
  const officialById = useMemo(() => new Map(officialPeople.map((p) => [p.id, p])), [officialPeople]);
  const xiUsed = useMemo(() => {
    const m = new Map<number, string>();
    for (const s of BEST_XI_SLOTS) if (xi[s.slot] != null) m.set(xi[s.slot]!, s.en);
    return m;
  }, [xi]);

  const medal: Record<string, string> = {
    CHAMPION: "from-amber-300 to-amber-500 text-amber-950",
    RUNNER_UP: "from-slate-200 to-slate-400 text-slate-900",
    THIRD_PLACE: "from-orange-300 to-orange-500 text-orange-950",
  };

  const personCard = (p: Person | null, teamId: number | null) => {
    const t = teamId != null ? teamById.get(teamId) : null;
    return (
      <span className="flex min-w-0 flex-1 items-center gap-3">
        <Avatar p={p} size="lg" ring={p ? "ring-amber-300" : "ring-slate-200"} />
        <span className="min-w-0">
          {p ? (
            <>
              <span className="block truncate text-sm font-bold text-slate-900">
                {p.number != null && <span className="mr-1 font-mono text-g15-600">#{p.number}</span>}
                {p.name}
              </span>
              {p.sub && <span className="block truncate text-[11px] text-slate-500">{p.sub}</span>}
              {t && (
                <span className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-500">
                  <TeamBadge team={t} size="sm" />
                  <span className="truncate">{t.name}</span>
                </span>
              )}
            </>
          ) : (
            <span className="text-sm font-medium text-slate-400">กดเพื่อเลือก</span>
          )}
        </span>
      </span>
    );
  };

  // ป็อปอัพที่เปิดอยู่
  let dialog: React.ReactNode = null;
  if (picker?.kind === "award") {
    const def = INDIVIDUAL_AWARDS.find((a) => a.key === picker.key)!;
    dialog = (
      <PersonPicker
        title={`เลือก: ${def.th}`}
        people={def.kind === "official" ? officialPeople : playerPeople}
        teams={teams}
        selectedId={winners[def.key] ?? null}
        defaultGroup={def.key === "GOLDEN_GLOVE" ? "GK" : null}
        onPick={(id) => {
          setWinners((w) => ({ ...w, [def.key]: id }));
          setPicker(null);
        }}
        onClose={() => setPicker(null)}
      />
    );
  } else if (picker?.kind === "xi") {
    const s = BEST_XI_SLOTS.find((x) => x.slot === picker.slot)!;
    dialog = (
      <PersonPicker
        title={`Best XI — ${s.en} · ${s.th}`}
        people={playerPeople}
        teams={teams}
        selectedId={xi[s.slot] ?? null}
        defaultGroup={s.group}
        usedBy={xiUsed}
        onPick={(id) => {
          setXi((v) => ({ ...v, [s.slot]: id }));
          setPicker(null);
        }}
        onClose={() => setPicker(null)}
      />
    );
  } else if (picker?.kind === "team") {
    const def = TEAM_AWARDS.find((a) => a.key === picker.key)!;
    const taken = new Map(TEAM_AWARDS.filter((a) => a.key !== def.key && winners[a.key] != null).map((a) => [winners[a.key]!, a.th]));
    dialog = (
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.target === e.currentTarget && setPicker(null)}
        className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 sm:items-center sm:p-4"
      >
        <div className="w-full max-w-2xl rounded-t-2xl bg-white p-4 shadow-2xl sm:rounded-2xl sm:p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-bold text-slate-900">เลือกทีม: {def.th}</h3>
            <button type="button" onClick={() => setPicker(null)} aria-label="ปิด" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {teams.map((t) => {
              const sel = winners[def.key] === t.id;
              const other = taken.get(t.id);
              return (
                <button
                  key={t.id}
                  type="button"
                  disabled={!!other}
                  onClick={() => {
                    setWinners((w) => ({ ...w, [def.key]: t.id }));
                    setPicker(null);
                  }}
                  className={`flex flex-col items-center gap-2 rounded-xl p-3 text-center ring-1 transition-colors disabled:opacity-40 ${
                    sel ? "bg-amber-50 ring-2 ring-amber-400" : "ring-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <TeamBadge team={t} size="md" />
                  <span className="line-clamp-2 text-xs font-semibold text-slate-800">{t.name}</span>
                  {other && <span className="text-[10px] text-slate-400">{other}แล้ว</span>}
                </button>
              );
            })}
          </div>
          <div className="mt-4 flex justify-between">
            <button
              type="button"
              onClick={() => {
                setWinners((w) => ({ ...w, [def.key]: null }));
                setPicker(null);
              }}
              className="rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
            >
              ล้างที่เลือก
            </button>
            <button type="button" onClick={() => setPicker(null)} className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100">
              ปิด
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ค่าที่ส่งไปบันทึก */}
      {[...TEAM_AWARDS, ...INDIVIDUAL_AWARDS].map((a) => (
        <input key={a.key} type="hidden" name={`winner_${a.key}`} value={winners[a.key] ?? ""} />
      ))}
      {BEST_XI_SLOTS.map((s) => (
        <input key={s.slot} type="hidden" name={`xi_${s.slot}`} value={xi[s.slot] ?? ""} />
      ))}

      {/* รางวัลทีม */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="mb-4 flex items-center gap-2 font-semibold text-slate-900">
          <Trophy className="h-5 w-5 text-amber-500" />
          รางวัลทีม <span className="font-normal text-slate-400">/ Team Awards</span>
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {TEAM_AWARDS.map((a) => {
            const t = winners[a.key] != null ? teamById.get(winners[a.key]!) : null;
            const sg = suggestions[a.key];
            return (
              <div key={a.key} className="flex flex-col gap-2">
                <span className={`inline-flex w-fit items-center gap-1.5 rounded-full bg-linear-to-r px-3 py-1 text-xs font-black ${medal[a.key]}`}>
                  <Medal className="h-3.5 w-3.5" />
                  {a.th} <span className="font-semibold opacity-70">/ {a.en}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setPicker({ kind: "team", key: a.key })}
                  className={`flex items-center gap-3 rounded-xl p-3 text-left ring-1 transition-colors hover:bg-slate-50 ${t ? "ring-amber-300" : "ring-slate-300"}`}
                >
                  {t ? <TeamBadge team={t} size="md" /> : <Avatar p={null} size="md" />}
                  <span className={`min-w-0 flex-1 truncate text-sm font-bold ${t ? "text-slate-900" : "text-slate-400"}`}>{t?.name ?? "กดเพื่อเลือกทีม"}</span>
                </button>
                {sg && winners[a.key] !== sg.id && (
                  <button
                    type="button"
                    onClick={() => setWinners((w) => ({ ...w, [a.key]: sg.id }))}
                    className="inline-flex w-fit items-center gap-1 text-[11px] font-semibold text-g15-600 hover:underline"
                  >
                    <Sparkles className="h-3 w-3" />
                    ใช้ผลการแข่งขัน: {teamById.get(sg.id)?.name}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* รางวัลส่วนบุคคล */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="mb-4 flex items-center gap-2 font-semibold text-slate-900">
          <Award className="h-5 w-5 text-amber-500" />
          รางวัลส่วนบุคคล <span className="font-normal text-slate-400">/ Individual Awards</span>
        </h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {INDIVIDUAL_AWARDS.map((a, i) => {
            const id = winners[a.key] ?? null;
            const p = id != null ? (a.kind === "official" ? officialById.get(id) : playerById.get(id)) ?? null : null;
            const sg = suggestions[a.key];
            const sgPerson = sg ? playerById.get(sg.id) : null;
            return (
              <div key={a.key} className="space-y-2.5 rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
                <p className="text-sm font-bold text-slate-900">
                  {i + 1}. {a.th}
                  <span className="block text-xs font-medium text-slate-400">{a.en}</span>
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPicker({ kind: "award", key: a.key })}
                    className={`flex min-w-0 flex-1 items-center rounded-xl bg-white p-2.5 text-left ring-1 transition-colors hover:ring-g15-300 ${p ? "ring-amber-200" : "ring-slate-200"}`}
                  >
                    {personCard(p, p?.teamId ?? null)}
                    <span className="ml-2 flex-none rounded-lg bg-g15-50 px-2.5 py-1 text-xs font-semibold text-g15-700">{p ? "เปลี่ยน" : "เลือก"}</span>
                  </button>
                  {p && (
                    <button
                      type="button"
                      onClick={() => setWinners((w) => ({ ...w, [a.key]: null }))}
                      aria-label={`ล้าง ${a.th}`}
                      className="flex h-9 w-9 flex-none items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <input
                  name={`note_${a.key}`}
                  value={notes[a.key] ?? ""}
                  onChange={(e) => setNotes((n) => ({ ...n, [a.key]: e.target.value }))}
                  placeholder="ข้อความประกอบ (ไม่บังคับ) เช่น 7 ประตู"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-g15-400 focus:outline-none focus:ring-2 focus:ring-g15-100"
                />
                {sg && sgPerson && (winners[a.key] !== sg.id || (sg.note && notes[a.key] !== sg.note)) && (
                  <button
                    type="button"
                    onClick={() => {
                      setWinners((w) => ({ ...w, [a.key]: sg.id }));
                      if (sg.note) setNotes((n) => ({ ...n, [a.key]: sg.note! }));
                    }}
                    className="inline-flex items-center gap-1 text-left text-[11px] font-semibold text-g15-600 hover:underline"
                  >
                    <RefreshCw className="h-3 w-3 flex-none" />
                    ใช้ค่าแนะนำจากสถิติ: {sgPerson.name}
                    {sg.note ? ` (${sg.note})` : ""}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Best XI บนสนาม — กดที่ตำแหน่งเพื่อเลือก */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 font-semibold text-slate-900">
            <Users className="h-5 w-5 text-emerald-600" />
            ทีมยอดเยี่ยม <span className="font-normal text-slate-400">/ Best XI · 4-3-3 (Holding)</span>
          </h2>
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200">
            เลือกแล้ว {xiUsed.size}/11
          </span>
        </div>
        <p className="mb-4 text-xs text-slate-500">กดที่วงกลมตำแหน่งเพื่อเลือกนักกีฬา (กรองตำแหน่งให้อัตโนมัติ เปลี่ยนเป็นทุกตำแหน่งได้)</p>
        <div className="relative overflow-hidden rounded-2xl bg-[repeating-linear-gradient(180deg,#059669_0px,#059669_48px,#047857_48px,#047857_96px)] px-2 py-6 sm:px-6">
          <div aria-hidden className="pointer-events-none absolute inset-3 rounded-xl border-2 border-white/30" />
          <div aria-hidden className="pointer-events-none absolute inset-x-3 top-1/2 border-t-2 border-white/30" />
          <div aria-hidden className="pointer-events-none absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/30" />
          <div className="relative space-y-4 sm:space-y-6">
            {[4, 3, 2, 1, 0].map((row) => {
              const slots = BEST_XI_SLOTS.filter((s) => s.row === row);
              return (
                <div key={row} className={`mx-auto flex justify-evenly gap-1 ${slots.length === 2 ? "max-w-md" : slots.length === 1 ? "max-w-xs" : "max-w-3xl"}`}>
                  {slots.map((s) => {
                    const p = xi[s.slot] != null ? playerById.get(xi[s.slot]!) : null;
                    const t = p ? teamById.get(p.teamId) : null;
                    return (
                      <button
                        key={s.slot}
                        type="button"
                        onClick={() => setPicker({ kind: "xi", slot: s.slot })}
                        className="group flex w-20 flex-col items-center text-center sm:w-28"
                      >
                        <span className="relative transition-transform group-hover:scale-105">
                          {p ? (
                            <Avatar p={p} size="lg" ring="ring-amber-300" />
                          ) : (
                            <span className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-dashed border-white/70 bg-white/10 text-white">
                              <Plus className="h-6 w-6" />
                            </span>
                          )}
                          {t && (
                            <span className="absolute -bottom-1 -right-1 rounded-full bg-white p-0.5 shadow">
                              <TeamBadge team={t} size="sm" />
                            </span>
                          )}
                        </span>
                        <span className="mt-1.5 line-clamp-2 rounded-md bg-emerald-950/55 px-1.5 py-0.5 text-[11px] font-bold leading-tight text-white">
                          {p ? p.name : "เลือก"}
                        </span>
                        <span className="mt-0.5 text-[10px] font-black uppercase tracking-wider text-amber-200">
                          {s.en} · {s.th}
                        </span>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {dialog}
    </div>
  );
}
