"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Plus, X, Check, Search } from "lucide-react";

// ไม่ใส่ความกว้าง (w-*) ไว้ในนี้โดยตรง — ปล่อยให้แต่ละช่องกำหนดเอง (flex-1/w-16/ฯลฯ) เพราะ Tailwind ไม่ได้ generate CSS
// ตามลำดับ className ที่เขียนในโค้ด ถ้าใส่ w-full ไว้ในนี้แล้วช่องไหนพยายาม override ด้วย w-16/flex-none ทีหลัง
// อาจจะแพ้ w-full ในลำดับ stylesheet จริง กลายเป็นช่อง select ถูกบีบเหลือแค่ความกว้าง content ขั้นต่ำ (ปัญหาที่เจอไปก่อนหน้านี้)
const compactFieldClass =
  "rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-900 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100";

type RosterPlayer = {
  id: number;
  firstNameTh: string;
  lastNameTh: string;
  jerseyNumber: number | null;
};

type RosterOfficial = {
  id: number;
  firstNameTh: string;
  lastNameTh: string;
  role: string | null;
};

type Team = { id: number; name: string };
type Side = "home" | "away";
type Row = { key: number; side: Side };

type ComboOption = { value: string; label: string; searchText: string };

// จัดการสถานะแถว (เพิ่ม/ลบ) ของทั้งสองฝั่งร่วมกัน — ทีมเหย้า/ทีมเยือน แยกคอลัมน์กันแต่อยู่ในฟอร์มเดียว บันทึกครั้งเดียว
// ใช้ร่วมกันทั้ง 3 แบบฟอร์ม (ผู้ทำประตู/เปลี่ยนตัว/ใบเหลือง-แดง) เพราะ logic เพิ่ม-ลบแถวเหมือนกันทุกอัน ต่างกันแค่ช่องกรอกในแต่ละแถว
function useTeamRows(initial: Row[] = []) {
  const nextKey = useRef(initial.length);
  const [rows, setRows] = useState<Row[]>(initial);

  const addRow = (side: Side) => setRows((r) => [...r, { key: nextKey.current++, side }]);
  const removeRow = (key: number) => setRows((r) => r.filter((x) => x.key !== key));
  const indexOf = (key: number) => rows.findIndex((r) => r.key === key);

  return { rows, addRow, removeRow, indexOf };
}

// ปุ่มบันทึกที่ขึ้น "บันทึกสำเร็จ" หลังส่งฟอร์ม (ฟอร์มพวกนี้เป็น client component อยู่แล้ว ใช้ useActionState ตรงๆ ได้เลย
// ไม่ต้องพึ่ง FormWithToast ที่ใช้กับฟอร์มฝั่ง server component) — showToast มาจาก state ตรงๆ ไม่ผ่าน effect/setState
// แยกต่างหาก เพราะ synchronous setState ใน effect ทำให้ re-render ซ้อนกันโดยไม่จำเป็น
function useSavedToast(action: (formData: FormData) => void | Promise<void>) {
  const [state, formAction] = useActionState(async (_prev: number, formData: FormData) => {
    await action(formData);
    return Date.now();
  }, 0);
  return { formAction, showToast: state !== 0 };
}

function SavedToast() {
  return (
    <div className="mt-3 flex w-fit items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
      <Check className="h-3.5 w-3.5" />
      บันทึกสำเร็จ
    </div>
  );
}

function AddRowButton({ onClick, label = "เพิ่มแถว" }: { onClick: () => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-2 inline-flex items-center gap-1 rounded-lg border border-dashed border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-500 transition-colors hover:border-slate-400 hover:bg-slate-50 hover:text-slate-700"
    >
      <Plus className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}

function RemoveRowButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="ลบแถวนี้"
      className="flex-none rounded-lg p-1.5 text-slate-300 transition-colors hover:bg-red-50 hover:text-red-500"
    >
      <X className="h-3.5 w-3.5" />
    </button>
  );
}

function playerOptions(players: RosterPlayer[]): ComboOption[] {
  return players.map((p) => ({
    value: String(p.id),
    label: `#${p.jerseyNumber ?? "-"} ${p.firstNameTh} ${p.lastNameTh}`,
    searchText: `${p.jerseyNumber ?? ""} ${p.firstNameTh} ${p.lastNameTh}`.toLowerCase(),
  }));
}

// ช่องเลือกผู้เล่นแบบพิมพ์ค้นหา — กันปัญหา dropdown ธรรมดายาวเกินไปเวลาทีมมีรายชื่อ 20-30 คน
// พิมพ์กรองรายชื่อที่โชว์ ค่าที่ส่งจริงไปฟอร์มคือ id (ผ่าน hidden input) ไม่ใช่ข้อความที่พิมพ์
function SearchableSelect({ name, options, placeholder = "— พิมพ์ค้นหาผู้เล่น —" }: { name: string; options: ComboOption[]; placeholder?: string }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const filtered = query.trim() ? options.filter((o) => o.searchText.includes(query.trim().toLowerCase())) : options;

  return (
    <div ref={wrapRef} className="relative min-w-0 flex-1">
      <input type="hidden" name={name} value={value} />
      <div className="relative">
        <Search className="pointer-events-none absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-300" />
        <input
          type="text"
          value={query}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setValue("");
            setOpen(true);
          }}
          placeholder={placeholder}
          className={`${compactFieldClass} w-full pl-6`}
        />
      </div>
      {open && filtered.length > 0 && (
        <ul className="absolute z-10 mt-1 max-h-48 w-full min-w-48 overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 text-xs shadow-lg">
          {filtered.map((o) => (
            <li key={o.value}>
              <button
                type="button"
                onClick={() => {
                  setValue(o.value);
                  setQuery(o.label);
                  setOpen(false);
                }}
                className="block w-full px-3 py-1.5 text-left text-slate-700 hover:bg-indigo-50"
              >
                {o.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ===== ผู้ทำประตู =====

export function GoalsBulkForm({
  matchId,
  action,
  homeTeam,
  awayTeam,
  homePlayers,
  awayPlayers,
}: {
  matchId: number;
  action: (formData: FormData) => void;
  homeTeam: Team;
  awayTeam: Team;
  homePlayers: RosterPlayer[];
  awayPlayers: RosterPlayer[];
}) {
  const { rows, addRow, removeRow, indexOf } = useTeamRows();
  const { formAction, showToast } = useSavedToast(action);

  const column = (side: Side, team: Team, players: RosterPlayer[]) => (
    <div>
      <p className="mb-2 text-xs font-semibold text-slate-500">{team.name}</p>
      <div className="space-y-2">
        {rows
          .filter((r) => r.side === side)
          .map((r) => (
            <div key={r.key} className="flex items-center gap-1.5">
              <SearchableSelect name={`playerId_${indexOf(r.key)}`} options={playerOptions(players)} />
              <input type="number" name={`minute_${indexOf(r.key)}`} placeholder="นาที" className={`${compactFieldClass} w-20 flex-none`} />
              <RemoveRowButton onClick={() => removeRow(r.key)} />
            </div>
          ))}
      </div>
      <AddRowButton onClick={() => addRow(side)} />
    </div>
  );

  return (
    <form action={formAction} className="p-6">
      <input type="hidden" name="matchId" value={matchId} />
      <div className="space-y-6">
        {column("home", homeTeam, homePlayers)}
        {column("away", awayTeam, awayPlayers)}
      </div>
      <button
        type="submit"
        className="mt-5 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-700"
      >
        บันทึกผู้ทำประตู
      </button>
      {showToast && <SavedToast />}
    </form>
  );
}

// ===== การเปลี่ยนตัวผู้เล่น =====

export function SubstitutionsBulkForm({
  matchId,
  action,
  homeTeam,
  awayTeam,
  homeInPlayers,
  homeOutPlayers,
  awayInPlayers,
  awayOutPlayers,
}: {
  matchId: number;
  action: (formData: FormData) => void;
  homeTeam: Team;
  awayTeam: Team;
  homeInPlayers: RosterPlayer[];
  homeOutPlayers: RosterPlayer[];
  awayInPlayers: RosterPlayer[];
  awayOutPlayers: RosterPlayer[];
}) {
  const { rows, addRow, removeRow, indexOf } = useTeamRows();
  const { formAction, showToast } = useSavedToast(action);

  const column = (side: Side, team: Team, inPlayers: RosterPlayer[], outPlayers: RosterPlayer[]) => (
    <div>
      <p className="mb-2 text-xs font-semibold text-slate-500">{team.name}</p>
      <div className="space-y-2">
        {rows
          .filter((r) => r.side === side)
          .map((r) => {
            const i = indexOf(r.key);
            return (
              <div
                key={r.key}
                className="flex flex-col gap-1.5 rounded-lg border border-slate-100 bg-slate-50/60 p-2 sm:flex-row sm:items-center sm:border-0 sm:bg-transparent sm:p-0"
              >
                <div className="flex flex-1 items-center gap-1.5">
                  <span className="w-9 flex-none text-[10px] font-bold uppercase tracking-wide text-emerald-600">เข้า</span>
                  <SearchableSelect name={`inPlayerId_${i}`} options={playerOptions(inPlayers)} placeholder="— ตัวสำรอง —" />
                </div>
                <div className="flex flex-1 items-center gap-1.5">
                  <span className="w-9 flex-none text-[10px] font-bold uppercase tracking-wide text-red-600">ออก</span>
                  <SearchableSelect name={`outPlayerId_${i}`} options={playerOptions(outPlayers)} placeholder="— ตัวจริง —" />
                </div>
                <div className="flex items-center gap-1.5">
                  <input type="number" name={`minute_${i}`} placeholder="นาที" className={`${compactFieldClass} w-20 flex-none`} />
                  <RemoveRowButton onClick={() => removeRow(r.key)} />
                </div>
              </div>
            );
          })}
      </div>
      <AddRowButton onClick={() => addRow(side)} />
    </div>
  );

  return (
    <form action={formAction} className="p-6">
      <input type="hidden" name="matchId" value={matchId} />
      <p className="mb-3 -mt-1 text-[11px] text-slate-400">
        แต่ละแถว: เข้า (ตัวสำรอง) / ออก (ตัวจริง) / นาที — ถ้ายังไม่ได้บันทึกไลน์อัพของทีมนั้น จะเลือกได้จากทั้งทีมไปก่อน
      </p>
      <div className="space-y-6">
        {column("home", homeTeam, homeInPlayers, homeOutPlayers)}
        {column("away", awayTeam, awayInPlayers, awayOutPlayers)}
      </div>
      <button
        type="submit"
        className="mt-5 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700"
      >
        บันทึกการเปลี่ยนตัว
      </button>
      {showToast && <SavedToast />}
    </form>
  );
}

// ===== ใบเหลือง / ใบแดง =====

export function CardsBulkForm({
  matchId,
  action,
  homeTeam,
  awayTeam,
  homePlayers,
  awayPlayers,
  homeOfficials,
  awayOfficials,
}: {
  matchId: number;
  action: (formData: FormData) => void;
  homeTeam: Team;
  awayTeam: Team;
  homePlayers: RosterPlayer[];
  awayPlayers: RosterPlayer[];
  homeOfficials: RosterOfficial[];
  awayOfficials: RosterOfficial[];
}) {
  const { rows, addRow, removeRow, indexOf } = useTeamRows();
  const { formAction, showToast } = useSavedToast(action);

  const holderOptions = (players: RosterPlayer[], officials: RosterOfficial[]): ComboOption[] => [
    ...players.map((p) => ({
      value: `player:${p.id}`,
      label: `#${p.jerseyNumber ?? "-"} ${p.firstNameTh} ${p.lastNameTh}`,
      searchText: `${p.jerseyNumber ?? ""} ${p.firstNameTh} ${p.lastNameTh}`.toLowerCase(),
    })),
    ...officials.map((o) => ({
      value: `official:${o.id}`,
      label: `${o.firstNameTh} ${o.lastNameTh} (${o.role ?? "เจ้าหน้าที่"})`,
      searchText: `${o.firstNameTh} ${o.lastNameTh}`.toLowerCase(),
    })),
  ];

  const column = (side: Side, team: Team, players: RosterPlayer[], officials: RosterOfficial[]) => (
    <div>
      <p className="mb-2 text-xs font-semibold text-slate-500">{team.name}</p>
      <div className="space-y-2">
        {rows
          .filter((r) => r.side === side)
          .map((r) => {
            const i = indexOf(r.key);
            return (
              <div key={r.key} className="flex flex-wrap items-center gap-1.5">
                <SearchableSelect name={`holder_${i}`} options={holderOptions(players, officials)} placeholder="— ผู้รับใบ —" />
                <select name={`cardType_${i}`} defaultValue="YELLOW" className={`${compactFieldClass} w-20 flex-none`}>
                  <option value="YELLOW">เหลือง</option>
                  <option value="RED">แดง</option>
                </select>
                <input type="number" name={`minute_${i}`} placeholder="นาที" className={`${compactFieldClass} w-20 flex-none`} />
                <input type="text" name={`reason_${i}`} placeholder="เหตุผล" className={`${compactFieldClass} min-w-24 flex-1`} />
                <RemoveRowButton onClick={() => removeRow(r.key)} />
              </div>
            );
          })}
      </div>
      <AddRowButton onClick={() => addRow(side)} />
    </div>
  );

  return (
    <form action={formAction} className="p-6">
      <input type="hidden" name="matchId" value={matchId} />
      <div className="space-y-6">
        {column("home", homeTeam, homePlayers, homeOfficials)}
        {column("away", awayTeam, awayPlayers, awayOfficials)}
      </div>
      <button
        type="submit"
        className="mt-5 inline-flex items-center gap-2 rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-amber-600"
      >
        บันทึกใบเหลือง/ใบแดง
      </button>
      {showToast && <SavedToast />}
    </form>
  );
}
