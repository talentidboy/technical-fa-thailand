# คู่มือพัฒนาและดูแลระบบ FA Thailand Technical

## ก่อนขึ้นเว็บทุกครั้ง (push ไป master = Vercel deploy ทันที)

```bash
npm run check      # lint + typecheck
npm run test:e2e   # ชุดทดสอบเต็ม (~5 นาที) — ต้องผ่านทั้งหมด
npm run build      # build ให้ผ่านก่อน
```

- ห้าม deploy ระหว่างมีแมตช์ G15 กำลังแข่งสด (`clock_phase` เป็น FIRST_HALF / HALF_TIME / SECOND_HALF / PENALTIES)
- GitHub Actions (`.github/workflows/ci.yml`) รัน lint + typecheck + build ทุกครั้งที่ push
  ชุดทดสอบ E2E บน GitHub จะทำงานเมื่อตั้ง secrets `DATABASE_URL` และ `DIRECT_URL` ใน
  GitHub → Settings → Secrets and variables → Actions

## ชุดทดสอบ E2E (`tests/e2e/`)

- `npm run test:e2e` สร้าง schema ทดสอบแยก (`e2e_test`) → เปิดเว็บโหมด dev ที่ชี้ไปที่นั่น → รันทุกไฟล์ `*.test.cjs` → ลบ schema ทิ้ง **ไม่แตะข้อมูลจริง**
- รันเฉพาะบางไฟล์: `npm run test:e2e -- renewal` · เก็บ schema ไว้ดู: `-- --keep`
- เพิ่มฟีเจอร์ใหม่ → เพิ่มไฟล์ `xxx.test.cjs` (ดูตัวอย่าง `renewal.test.cjs`) และเพิ่มหน้าใหม่ลงรายการใน `smoke.test.cjs`

## เปลี่ยนโครงสร้างฐานข้อมูล (ใช้ migration — เลิกใช้ `db push` กับฐานข้อมูลจริง)

1. แก้ `prisma/schema.prisma`
2. สร้างไฟล์ migration จากความต่างระหว่างฐานข้อมูลจริงกับ schema (อ่านอย่างเดียว):
   ```bash
   mkdir prisma/migrations/YYYYMMDDHHMMSS_ชื่อ
   npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script -o prisma/migrations/YYYYMMDDHHMMSS_ชื่อ/migration.sql
   ```
3. อ่าน SQL ให้แน่ใจว่าไม่มีการลบคอลัมน์/ตารางที่มีข้อมูล
4. `npm run db:backup` → `npm run db:migrate` (= `prisma migrate deploy`) → `npx prisma generate`
5. ตรวจว่าไม่เหลือความต่าง: `npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma` ต้องได้ "No difference detected"

## สำรองข้อมูล

- `npm run db:backup` → ไฟล์ `backups/backup-YYYYMMDDHHMM.json.gz` (ทุกตาราง) — **มีข้อมูลส่วนบุคคล ห้าม commit/แชร์**
- ทำทุกครั้งก่อนแก้ข้อมูลจำนวนมาก หรือก่อน migration
- ควรเปิด Backup อัตโนมัติของ Supabase ด้วย (แพ็กเกจ Pro มีสำรองรายวัน)

## เมื่อระบบมีปัญหา

- หน้า **บันทึกข้อผิดพลาด** (`/errors`, แอดมินเท่านั้น) — ทุก error ฝั่งเซิร์ฟเวอร์ (`src/instrumentation.ts`) และทุกครั้งที่ผู้ใช้เห็นหน้าแจ้งข้อผิดพลาด (`src/app/error.tsx`) ถูกบันทึกพร้อมหน้า/เวลา/จำนวนครั้ง
- ผู้ใช้แจ้ง "รหัสอ้างอิง" จากหน้าแจ้งข้อผิดพลาด → ค้นใน `/errors`
- แจ้งเตือนทางอีเมล: ตั้ง `ERROR_ALERT_EMAIL` ใน Vercel (ใช้ Resend ตัวเดียวกับระบบอีเมล)

## กันปัญหาที่เคยเจอ

| ปัญหา | ระบบกันไว้ที่ |
|---|---|
| หน้าที่เปิดค้างตอน deploy กดบันทึกไม่ได้ | `deploymentId` ใน `next.config.ts` + แถบ "ระบบอัปเดตแล้ว" (`src/instrumentation-client.ts`) + โหลดใหม่อัตโนมัติใน `error.tsx` |
| รูปจากมือถือใหญ่เกินขีดจำกัด 4MB | ย่อรูปอัตโนมัติก่อนอัปโหลดทุกฟอร์ม (`src/lib/image-shrink.ts`) |
| ลิงก์ผิด (`/coaches/abc`) ขึ้น error | `parseId()` (`src/lib/route-id.ts`) → ตอบหน้า "ไม่พบ" |
| ผู้ฝึกสอนต่างชาติชื่อว่างเปล่า | ใช้ `coachName()` (`src/lib/coach-name.ts`) ทุกที่ที่แสดงชื่อ |
| build ล้มเพราะต่อฐานข้อมูลไม่ได้ชั่วคราว | หน้าที่อ่านฐานข้อมูลใช้ `await connection()` ไม่ prerender ตอน build |
