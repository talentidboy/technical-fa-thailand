"use client";

import { useActionState, useState } from "react";
import { Eye, EyeOff, KeyRound, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import type { PasswordState } from "@/lib/password-change";

function PasswordInput({ name, label, autoComplete, show }: { name: string; label: string; autoComplete: string; show: boolean }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input
        name={name}
        type={show ? "text" : "password"}
        required
        autoComplete={autoComplete}
        className="h-11 rounded-xl border border-slate-200 px-3.5 text-sm text-slate-900 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
      />
    </label>
  );
}

// ฟอร์มเปลี่ยนรหัสผ่าน — แสดงผลสำเร็จ/ผิดพลาดในฟอร์มทันที, ล้างช่องเมื่อสำเร็จ
export function ChangePasswordForm({ action }: { action: (prev: PasswordState, fd: FormData) => Promise<PasswordState> }) {
  const [state, formAction, pending] = useActionState(action, null);
  const [show, setShow] = useState(false);

  return (
    <form action={formAction} key={state?.ok ? "done" : "form"} className="space-y-4">
      <PasswordInput name="currentPassword" label="รหัสผ่านปัจจุบัน" autoComplete="current-password" show={show} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <PasswordInput name="newPassword" label="รหัสผ่านใหม่ (อย่างน้อย 8 ตัวอักษร)" autoComplete="new-password" show={show} />
        <PasswordInput name="confirmPassword" label="ยืนยันรหัสผ่านใหม่" autoComplete="new-password" show={show} />
      </div>
      <div>
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="inline-flex items-center gap-1.5 py-1 text-xs font-medium text-slate-500 hover:text-slate-800"
        >
          {show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          {show ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
        </button>
      </div>

      {state && (
        <p
          role={state.ok ? "status" : "alert"}
          className={`flex items-start gap-2 rounded-xl px-4 py-3 text-sm ${
            state.ok ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" : "bg-red-50 text-red-700 ring-1 ring-red-200"
          }`}
        >
          {state.ok ? <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none" /> : <AlertCircle className="mt-0.5 h-4 w-4 flex-none" />}
          {state.message}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-11 items-center gap-2 rounded-xl bg-indigo-700 px-5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-indigo-800 disabled:opacity-60"
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
        เปลี่ยนรหัสผ่าน
      </button>
    </form>
  );
}
