"use client";

import { useState, useTransition } from "react";
import {
  KeyRound,
  UserRound,
  Copy,
  Check,
  Shuffle,
  ShieldCheck,
  ShieldOff,
  Loader2,
  Pencil,
  RotateCcw,
  Clock,
} from "lucide-react";
import {
  createCoachLogin,
  resetCoachLogin,
  renameCoachLogin,
  toggleCoachLogin,
  type AccountResult,
} from "@/app/(admin)/coaches/[id]/account-actions";

const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";
function randomPassword() {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
}

const input =
  "w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 font-mono text-sm text-slate-900 placeholder:font-sans placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100";

function CopyButton({ text, label = "คัดลอก" }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
        } catch {
          window.prompt("คัดลอกข้อความนี้", text);
        }
        setDone(true);
        setTimeout(() => setDone(false), 1800);
      }}
      className="inline-flex flex-none items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
    >
      {done ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
      {done ? "คัดลอกแล้ว" : label}
    </button>
  );
}

// บัญชีเข้าสู่ระบบของโค้ช (Username / Password) ในหน้าประวัติโค้ชเลย — สร้าง, ตั้งรหัสใหม่, เปลี่ยนชื่อผู้ใช้, ระงับ
// รหัสผ่านเก็บแบบเข้ารหัส ดูย้อนหลังไม่ได้ จึงแสดงให้คัดลอกครั้งเดียวตอนตั้ง
export function CoachAccountPanel({
  coachId,
  coachName,
  account,
  suggestedUsername,
}: {
  coachId: number;
  coachName: string;
  account: { username: string; isActive: boolean; lastLogin: string | null } | null;
  suggestedUsername: string;
}) {
  const [username, setUsername] = useState(suggestedUsername);
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"view" | "reset" | "rename">("view");
  const [result, setResult] = useState<AccountResult | null>(null);
  const [pending, startTransition] = useTransition();

  const run = (fn: () => Promise<AccountResult>) =>
    startTransition(async () => {
      const res = await fn();
      setResult(res);
      if (res.ok) {
        setMode("view");
        setPassword("");
      }
    });

  const credentials = result?.ok && result.password ? { username: result.username!, password: result.password } : null;
  const loginUrl = typeof window === "undefined" ? "/coach-center/login" : `${window.location.origin}/coach-center/login`;

  const passwordField = (
    <div className="flex gap-2">
      <input
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="เว้นว่าง = ระบบสุ่มให้"
        autoComplete="off"
        className={input}
      />
      <button
        type="button"
        onClick={() => setPassword(randomPassword())}
        className="inline-flex flex-none items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
      >
        <Shuffle className="h-4 w-4" />
        สุ่ม
      </button>
    </div>
  );

  return (
    <div className="rounded-2xl border border-indigo-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-6 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
          <KeyRound className="h-4 w-4" />
        </div>
        <h2 className="mr-auto font-semibold text-slate-900">บัญชีเข้าสู่ระบบของโค้ช</h2>
        {account ? (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${
              account.isActive ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : "bg-red-50 text-red-700 ring-red-200"
            }`}
          >
            {account.isActive ? <ShieldCheck className="h-3.5 w-3.5" /> : <ShieldOff className="h-3.5 w-3.5" />}
            {account.isActive ? "ใช้งานได้" : "ถูกระงับ"}
          </span>
        ) : (
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500 ring-1 ring-slate-200">
            ยังไม่มีบัญชี
          </span>
        )}
      </div>

      <div className="space-y-4 p-6">
        {result && !result.ok && (
          <p role="alert" className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700 ring-1 ring-red-200">
            {result.error}
          </p>
        )}
        {result?.ok && !credentials && (
          <p className="rounded-lg bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700 ring-1 ring-emerald-200">{result.message}</p>
        )}

        {/* แสดงรหัสผ่านครั้งเดียวหลังสร้าง/ตั้งใหม่ */}
        {credentials && (
          <div className="rounded-xl border-2 border-emerald-300 bg-emerald-50 p-4">
            <p className="text-sm font-semibold text-emerald-900">{result?.ok && result.message} — คัดลอกส่งให้โค้ชได้เลย</p>
            <dl className="mt-3 grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-2 text-sm">
              <dt className="text-emerald-800">Username</dt>
              <dd className="font-mono text-base font-bold text-slate-900">{credentials.username}</dd>
              <dt className="text-emerald-800">Password</dt>
              <dd className="font-mono text-base font-bold text-slate-900">{credentials.password}</dd>
            </dl>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <CopyButton
                label="คัดลอกทั้งหมด"
                text={`บัญชีผู้ฝึกสอน FA Thailand — ${coachName}\nเข้าสู่ระบบ: ${loginUrl}\nUsername: ${credentials.username}\nPassword: ${credentials.password}`}
              />
              <span className="text-xs text-emerald-800">รหัสผ่านแสดงครั้งเดียว — ปิดหน้านี้แล้วต้องตั้งใหม่</span>
            </div>
          </div>
        )}

        {!account ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-slate-700">Username (ชื่อผู้ใช้)</span>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="อีเมล, เลขบัตรประชาชน หรือเบอร์โทร"
                autoComplete="off"
                className={input}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-slate-700">Password (รหัสผ่าน)</span>
              {passwordField}
            </label>
            <div className="sm:col-span-2">
              <button
                type="button"
                disabled={pending}
                onClick={() => run(() => createCoachLogin(coachId, username, password))}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-indigo-200 hover:bg-indigo-700 disabled:opacity-60"
              >
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserRound className="h-4 w-4" />}
                สร้างบัญชี
              </button>
            </div>
          </div>
        ) : (
          <>
            <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-slate-50 px-4 py-3">
                <dt className="text-xs font-medium text-slate-500">Username</dt>
                <dd className="mt-1 flex items-center justify-between gap-2">
                  <span className="truncate font-mono text-sm font-semibold text-slate-900">{account.username}</span>
                  <CopyButton text={account.username} />
                </dd>
              </div>
              <div className="rounded-xl bg-slate-50 px-4 py-3">
                <dt className="text-xs font-medium text-slate-500">Password</dt>
                <dd className="mt-1 flex items-center justify-between gap-2">
                  <span className="font-mono text-sm tracking-widest text-slate-400">••••••••</span>
                  <span className="text-[11px] text-slate-400">เข้ารหัสไว้ ดูย้อนหลังไม่ได้</span>
                </dd>
              </div>
            </dl>
            <p className="inline-flex items-center gap-1.5 text-xs text-slate-500">
              <Clock className="h-3.5 w-3.5" />
              {account.lastLogin ? `เข้าสู่ระบบล่าสุด ${account.lastLogin}` : "ยังไม่เคยเข้าสู่ระบบ"}
            </p>

            {mode === "reset" && (
              <div className="space-y-3 rounded-xl bg-amber-50 p-4 ring-1 ring-amber-200">
                <p className="text-sm font-medium text-amber-900">ตั้งรหัสผ่านใหม่ (อุปกรณ์ที่ล็อกอินค้างไว้จะถูกออกจากระบบ)</p>
                {passwordField}
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => run(() => resetCoachLogin(coachId, password))}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-60"
                  >
                    {pending && <Loader2 className="h-4 w-4 animate-spin" />}
                    บันทึกรหัสผ่านใหม่
                  </button>
                  <button type="button" onClick={() => setMode("view")} className="px-3 text-sm text-slate-500 hover:text-slate-800">
                    ยกเลิก
                  </button>
                </div>
              </div>
            )}
            {mode === "rename" && (
              <div className="space-y-3 rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
                <p className="text-sm font-medium text-slate-800">เปลี่ยนชื่อผู้ใช้</p>
                <input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="off" className={input} />
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => run(() => renameCoachLogin(coachId, username))}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                  >
                    {pending && <Loader2 className="h-4 w-4 animate-spin" />}
                    บันทึก
                  </button>
                  <button type="button" onClick={() => setMode("view")} className="px-3 text-sm text-slate-500 hover:text-slate-800">
                    ยกเลิก
                  </button>
                </div>
              </div>
            )}

            {mode === "view" && (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPassword(randomPassword());
                    setMode("reset");
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3.5 py-2 text-sm font-semibold text-white hover:bg-amber-600"
                >
                  <RotateCcw className="h-4 w-4" />
                  ตั้งรหัสผ่านใหม่
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setUsername(account.username);
                    setMode("rename");
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3.5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  <Pencil className="h-4 w-4" />
                  เปลี่ยนชื่อผู้ใช้
                </button>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => {
                    if (!account.isActive || confirm("ระงับบัญชีนี้? โค้ชจะเข้าสู่ระบบไม่ได้จนกว่าจะเปิดใช้งานอีกครั้ง")) {
                      run(() => toggleCoachLogin(coachId));
                    }
                  }}
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-3.5 py-2 text-sm font-medium disabled:opacity-60 ${
                    account.isActive ? "border-red-200 text-red-600 hover:bg-red-50" : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                  }`}
                >
                  {account.isActive ? <ShieldOff className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
                  {account.isActive ? "ระงับบัญชี" : "เปิดใช้งานอีกครั้ง"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
