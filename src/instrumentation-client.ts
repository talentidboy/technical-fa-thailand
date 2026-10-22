import { needsShrink, shrinkImage, UPLOAD_LIMIT_BYTES } from "@/lib/image-shrink";

// ทำงานทุกหน้าในเบราว์เซอร์ก่อนหน้าเว็บพร้อมใช้งาน:
// 1) ย่อรูปที่เลือกในทุกช่องอัปโหลด (input type=file) ให้ไม่เกินขีดจำกัด — ไม่ต้องแก้ทีละฟอร์ม
// 2) ถ้ากดบันทึกระหว่างกำลังย่อรูป จะรอให้ย่อเสร็จแล้วส่งฟอร์มให้เอง
// 3) เช็กทุก 1 นาทีว่ามีการอัปเดตเว็บหรือยัง → ขึ้นแถบให้กดโหลดหน้าใหม่ (กันปุ่มบันทึกใช้ไม่ได้ในหน้าที่เปิดค้างไว้)

const waitingForms = new Map<HTMLFormElement, HTMLElement | null>();

function resumeWaitingForms() {
  for (const [form, submitter] of [...waitingForms]) {
    if (form.querySelector("input[type=file][data-shrinking]")) continue;
    waitingForms.delete(form);
    if (form.isConnected) form.requestSubmit(submitter && form.contains(submitter) ? submitter : undefined);
  }
}

try {
  window.addEventListener(
    "change",
    (event) => {
      const input = event.target;
      if (!(input instanceof HTMLInputElement) || input.type !== "file" || !input.files?.length) return;
      const files = Array.from(input.files);
      if (!files.some(needsShrink)) {
        if (files.some((f) => f.size > UPLOAD_LIMIT_BYTES)) {
          alert("ไฟล์ใหญ่เกิน 4MB — กรุณาเลือกไฟล์ที่เล็กกว่านี้");
          input.value = "";
        }
        return;
      }
      input.dataset.shrinking = "1";
      void Promise.all(files.map(shrinkImage))
        .then((out) => {
          if (out.some((f) => f.size > UPLOAD_LIMIT_BYTES)) {
            alert("ไฟล์ใหญ่เกิน 4MB แม้ย่อแล้ว — กรุณาเลือกไฟล์ที่เล็กกว่านี้");
            input.value = "";
            return;
          }
          const dt = new DataTransfer();
          for (const f of out) dt.items.add(f);
          input.files = dt.files;
        })
        .finally(() => {
          delete input.dataset.shrinking;
          resumeWaitingForms();
        });
    },
    true,
  );

  window.addEventListener(
    "submit",
    (event) => {
      const form = event.target;
      if (!(form instanceof HTMLFormElement) || !form.querySelector("input[type=file][data-shrinking]")) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      waitingForms.set(form, (event as SubmitEvent).submitter);
    },
    true,
  );
} catch {
  // เบราว์เซอร์เก่ามาก — ข้ามการย่อรูป
}

// ===== แจ้งเตือนเมื่อเว็บอัปเดตเวอร์ชันใหม่ =====
const currentDeployment = document.documentElement.dataset.dplId;
let bannerShown = false;

function showUpdateBanner() {
  if (bannerShown) return;
  bannerShown = true;
  const bar = document.createElement("div");
  bar.setAttribute("role", "status");
  bar.className =
    "fixed inset-x-3 bottom-3 z-[9999] mx-auto flex max-w-md items-center gap-3 rounded-2xl bg-slate-900 px-4 py-3 text-sm text-white shadow-2xl sm:bottom-5";
  const text = document.createElement("span");
  text.className = "flex-1";
  text.textContent = "ระบบอัปเดตเวอร์ชันใหม่แล้ว — โหลดหน้าใหม่ก่อนบันทึกข้อมูล";
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "flex-none rounded-lg bg-amber-400 px-3 py-1.5 font-bold text-amber-950 hover:bg-amber-300";
  btn.textContent = "โหลดใหม่";
  btn.onclick = () => window.location.reload();
  bar.append(text, btn);
  document.body.append(bar);
}

async function checkDeployment() {
  if (!currentDeployment || bannerShown || document.visibilityState !== "visible") return;
  try {
    const res = await fetch("/api/deploy-id", { cache: "no-store" });
    if (!res.ok) return;
    const { id } = (await res.json()) as { id?: string };
    if (id && id !== "dev" && id !== currentDeployment) showUpdateBanner();
  } catch {
    // ออฟไลน์ชั่วคราว — เช็กรอบหน้า
  }
}

if (currentDeployment) {
  setInterval(checkDeployment, 60_000);
  document.addEventListener("visibilitychange", () => void checkDeployment());
}
