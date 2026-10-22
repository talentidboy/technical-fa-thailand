import { TextField, fieldClass } from "./AcademyShell";
import { POSITIONS } from "@/lib/academy-checks";
import { bangkokDay } from "@/lib/academy";

export const GENDERS: Record<string, string> = { MIXED: "ทีมรวม", BOYS: "ทีมชาย", GIRLS: "ทีมหญิง" };
const AGE_GROUPS = Array.from({ length: 13 }, (_, i) => i + 8); // U8 – U20

export function TeamFields({ team }: { team?: { name: string; ageGroup: number; gender: string } }) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-slate-700">
          รุ่นอายุ<span className="text-red-500"> *</span>
        </span>
        <select name="ageGroup" required defaultValue={team?.ageGroup ?? ""} className={fieldClass}>
          <option value="" disabled>
            เลือกรุ่น
          </option>
          {AGE_GROUPS.map((a) => (
            <option key={a} value={a}>
              U{a}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-slate-700">ประเภท</span>
        <select name="gender" defaultValue={team?.gender ?? "MIXED"} className={fieldClass}>
          {Object.entries(GENDERS).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      </label>
      <TextField label="ชื่อทีม" name="name" defaultValue={team?.name} placeholder="เว้นว่าง = ใช้ชื่อรุ่น เช่น U14" />
    </div>
  );
}

export function PlayerFields({
  player,
}: {
  player?: { firstName: string; lastName: string; nickname: string | null; birthDate: Date | null; position: string; shirtNo: number | null };
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-6">
      <div className="sm:col-span-2">
        <TextField label="ชื่อ" name="firstName" required defaultValue={player?.firstName} />
      </div>
      <div className="sm:col-span-2">
        <TextField label="นามสกุล" name="lastName" required defaultValue={player?.lastName} />
      </div>
      <div className="sm:col-span-2">
        <TextField label="ชื่อเล่น" name="nickname" defaultValue={player?.nickname} />
      </div>
      <div className="sm:col-span-2">
        <TextField label="วันเกิด" name="birthDate" type="date" defaultValue={player?.birthDate ? bangkokDay(player.birthDate) : undefined} />
      </div>
      <label className="flex flex-col gap-1.5 sm:col-span-2">
        <span className="text-sm font-medium text-slate-700">
          ตำแหน่ง<span className="text-red-500"> *</span>
        </span>
        <select name="position" required defaultValue={player?.position ?? ""} className={fieldClass}>
          <option value="" disabled>
            เลือกตำแหน่ง
          </option>
          {Object.entries(POSITIONS).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      </label>
      <div className="sm:col-span-2">
        <TextField label="เบอร์เสื้อ" name="shirtNo" type="number" defaultValue={player?.shirtNo} />
      </div>
    </div>
  );
}
