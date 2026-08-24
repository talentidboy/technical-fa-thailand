"use client";

import { useRef, useState, type ChangeEvent, type ClipboardEvent, type DragEvent } from "react";
import { ImagePlus, X } from "lucide-react";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_SIZE_BYTES = 5 * 1024 * 1024;

export function LogoPasteField({
  label = "โลโก้ทีม",
  name = "logo",
  currentUrl,
}: {
  label?: string;
  name?: string;
  currentUrl?: string | null;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function tryAcceptFile(file: File) {
    if (!ALLOWED_TYPES.has(file.type)) {
      setError("รองรับเฉพาะไฟล์รูปภาพ JPEG, PNG หรือ WEBP เท่านั้น");
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setError("ขนาดไฟล์ต้องไม่เกิน 5MB");
      return;
    }
    setError(null);
    const dt = new DataTransfer();
    dt.items.add(file);
    if (inputRef.current) inputRef.current.files = dt.files;
    setPreview(URL.createObjectURL(file));
  }

  function handlePaste(e: ClipboardEvent<HTMLDivElement>) {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) {
          e.preventDefault();
          tryAcceptFile(file);
        }
        break;
      }
    }
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) tryAcceptFile(file);
  }

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) tryAcceptFile(file);
  }

  function clear() {
    setPreview(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  const showUrl = preview ?? currentUrl ?? null;

  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <div
        tabIndex={0}
        onPaste={handlePaste}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        role="button"
        className={`flex cursor-pointer items-center gap-3 rounded-lg border border-dashed px-3.5 py-2.5 text-sm outline-none transition-colors ${
          error
            ? "border-red-300 bg-red-50/40 text-red-600"
            : "border-slate-300 text-slate-500 hover:border-rose-300 hover:bg-rose-50/40 focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
        }`}
      >
        {showUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={showUrl} alt="" className="h-10 w-10 flex-none rounded-lg object-cover ring-1 ring-slate-200" />
        ) : (
          <ImagePlus className="h-5 w-5 flex-none text-slate-400" />
        )}
        <span className="min-w-0 flex-1">
          {error ?? (preview ? "เลือกรูปแล้ว — คลิกเพื่อเปลี่ยน" : "คลิกเลือกไฟล์ วางรูป (Ctrl+V) หรือลากมาวาง")}
        </span>
        {preview && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              clear();
            }}
            aria-label="ล้างรูปที่เลือก"
            className="flex-none rounded-md p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        name={name}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleChange}
        className="hidden"
      />
    </label>
  );
}
