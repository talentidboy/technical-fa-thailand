"use client";

import { useRef, useState } from "react";
import { Plus, X } from "lucide-react";

const compactFieldClass =
  "w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-900 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100";

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

function PlayerOptions({ players }: { players: RosterPlayer[] }) {
  return (
    <>
      <option value="">— เลือกผู้เล่น —</option>
      {players.map((p) => (
        <option key={p.id} value={p.id}>
          #{p.jerseyNumber ?? "-"} {p.firstNameTh} {p.lastNameTh}
        </option>
      ))}
    </>
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

  const column = (side: Side, team: Team, players: RosterPlayer[]) => (
    <div>
      <p className="mb-2 text-xs font-semibold text-slate-500">{team.name}</p>
      <div className="space-y-2">
        {rows
          .filter((r) => r.side === side)
          .map((r) => (
            <div key={r.key} className="flex items-center gap-1.5">
              <select name={`playerId_${indexOf(r.key)}`} defaultValue="" className={compactFieldClass}>
                <PlayerOptions players={players} />
              </select>
              <input type="number" name={`minute_${indexOf(r.key)}`} placeholder="นาที" className={`${compactFieldClass} w-16 flex-none`} />
              <RemoveRowButton onClick={() => removeRow(r.key)} />
            </div>
          ))}
      </div>
      <AddRowButton onClick={() => addRow(side)} />
    </div>
  );

  return (
    <form action={action} className="p-6">
      <input type="hidden" name="matchId" value={matchId} />
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {column("home", homeTeam, homePlayers)}
        {column("away", awayTeam, awayPlayers)}
      </div>
      <button
        type="submit"
        className="mt-5 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-700"
      >
        บันทึกผู้ทำประตู
      </button>
    </form>
  );
}

// ===== การเปลี่ยนตัวผู้เล่น =====

export function SubstitutionsBulkForm({
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

  const column = (side: Side, team: Team, players: RosterPlayer[]) => (
    <div>
      <p className="mb-2 text-xs font-semibold text-slate-500">{team.name}</p>
      <div className="space-y-2">
        {rows
          .filter((r) => r.side === side)
          .map((r) => {
            const i = indexOf(r.key);
            return (
              <div key={r.key} className="flex items-center gap-1.5">
                <select name={`inPlayerId_${i}`} defaultValue="" className={compactFieldClass} title="เข้า">
                  <PlayerOptions players={players} />
                </select>
                <select name={`outPlayerId_${i}`} defaultValue="" className={compactFieldClass} title="ออก">
                  <PlayerOptions players={players} />
                </select>
                <input type="number" name={`minute_${i}`} placeholder="นาที" className={`${compactFieldClass} w-16 flex-none`} />
                <RemoveRowButton onClick={() => removeRow(r.key)} />
              </div>
            );
          })}
      </div>
      <AddRowButton onClick={() => addRow(side)} />
    </div>
  );

  return (
    <form action={action} className="p-6">
      <input type="hidden" name="matchId" value={matchId} />
      <p className="mb-3 -mt-1 text-[11px] text-slate-400">แต่ละแถว: เข้า / ออก / นาที</p>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {column("home", homeTeam, homePlayers)}
        {column("away", awayTeam, awayPlayers)}
      </div>
      <button
        type="submit"
        className="mt-5 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700"
      >
        บันทึกการเปลี่ยนตัว
      </button>
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
                <select name={`holder_${i}`} defaultValue="" className={`${compactFieldClass} min-w-40 flex-1`}>
                  <option value="">— เลือกผู้รับใบ —</option>
                  <optgroup label="นักกีฬา">
                    {players.map((p) => (
                      <option key={`p${p.id}`} value={`player:${p.id}`}>
                        #{p.jerseyNumber ?? "-"} {p.firstNameTh} {p.lastNameTh}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="เจ้าหน้าที่ทีม">
                    {officials.map((o) => (
                      <option key={`o${o.id}`} value={`official:${o.id}`}>
                        {o.firstNameTh} {o.lastNameTh} ({o.role ?? "เจ้าหน้าที่"})
                      </option>
                    ))}
                  </optgroup>
                </select>
                <select name={`cardType_${i}`} defaultValue="YELLOW" className={`${compactFieldClass} w-20 flex-none`}>
                  <option value="YELLOW">เหลือง</option>
                  <option value="RED">แดง</option>
                </select>
                <input type="number" name={`minute_${i}`} placeholder="นาที" className={`${compactFieldClass} w-16 flex-none`} />
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
    <form action={action} className="p-6">
      <input type="hidden" name="matchId" value={matchId} />
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {column("home", homeTeam, homePlayers, homeOfficials)}
        {column("away", awayTeam, awayPlayers, awayOfficials)}
      </div>
      <button
        type="submit"
        className="mt-5 inline-flex items-center gap-2 rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-amber-600"
      >
        บันทึกใบเหลือง/ใบแดง
      </button>
    </form>
  );
}
