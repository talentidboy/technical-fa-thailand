-- AlterTable
ALTER TABLE "play_and_learn_centers" ADD COLUMN     "image_url" TEXT,
ADD COLUMN     "map_url" TEXT;

-- CreateTable
CREATE TABLE "play_and_learn_items" (
    "id" SERIAL NOT NULL,
    "kind" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "image_url" TEXT,
    "url" TEXT,
    "date" TIMESTAMP(3),
    "extra" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "play_and_learn_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "play_and_learn_settings" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "play_and_learn_settings_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE INDEX "play_and_learn_items_kind_published_sort_order_idx" ON "play_and_learn_items"("kind", "published", "sort_order");

-- พาสปอร์ต 8 บทเดิม (เดิมเขียนไว้ในโค้ด) — นำเข้าเป็นข้อมูลให้แอดมินแก้ไขได้
INSERT INTO "play_and_learn_items" ("kind", "title", "extra", "url", "sort_order", "updated_at") VALUES
  ('PASSPORT', 'กุ๋งกิ๋งไปทะเล', 'waves', 'https://rgqahrqwxwhaechiodzf.supabase.co/storage/v1/object/public/uploads/play-and-learn-030a6ef3-b6e8-48da-b5ef-5581a4da354d.pdf', 1, CURRENT_TIMESTAMP),
  ('PASSPORT', 'กุ๋งกิ๋งเที่ยวพิพิธภัณฑ์สัตว์น้ำ', 'fish', 'https://rgqahrqwxwhaechiodzf.supabase.co/storage/v1/object/public/uploads/play-and-learn-2a6fb2b5-651c-4207-b4c2-f57252a7fb50.pdf', 2, CURRENT_TIMESTAMP),
  ('PASSPORT', 'กุ๋งกิ๋งเที่ยวภาคใต้', 'palm', 'https://rgqahrqwxwhaechiodzf.supabase.co/storage/v1/object/public/uploads/play-and-learn-633e0715-8735-4b70-bfc1-4d06b69ab83a.pdf', 3, CURRENT_TIMESTAMP),
  ('PASSPORT', 'กุ๋งกิ๋งเที่ยวภาคเหนือ', 'mountain', 'https://rgqahrqwxwhaechiodzf.supabase.co/storage/v1/object/public/uploads/play-and-learn-191b277a-0cda-4e29-a324-16d7e9ad9241.pdf', 4, CURRENT_TIMESTAMP),
  ('PASSPORT', 'กุ๋งกิ๋งเที่ยวภาคอีสาน', 'temple', 'https://rgqahrqwxwhaechiodzf.supabase.co/storage/v1/object/public/uploads/play-and-learn-9d50b06c-9753-4833-be3e-ef9a68dc58f1.pdf', 5, CURRENT_TIMESTAMP),
  ('PASSPORT', 'กุ๋งกิ๋งเที่ยวภาคกลาง', 'compass', 'https://rgqahrqwxwhaechiodzf.supabase.co/storage/v1/object/public/uploads/play-and-learn-aea844a1-076a-4588-a6d2-8502b3907540.pdf', 6, CURRENT_TIMESTAMP),
  ('PASSPORT', 'กุ๋งกิ๋ง สุขสันต์วันสงกรานต์', 'droplets', 'https://rgqahrqwxwhaechiodzf.supabase.co/storage/v1/object/public/uploads/play-and-learn-f2a1e341-dbec-422e-97c1-bce7bebb9cc4.pdf', 7, CURRENT_TIMESTAMP),
  ('PASSPORT', 'กุ๋งกิ๋ง สุขสันต์วันลอยกระทง', 'moon', 'https://rgqahrqwxwhaechiodzf.supabase.co/storage/v1/object/public/uploads/play-and-learn-58bf6c72-c6ae-45a9-87f4-3524f91412c5.pdf', 8, CURRENT_TIMESTAMP);
