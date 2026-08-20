const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

export type AirtableRecord<T = Record<string, unknown>> = {
  id: string;
  fields: T;
  createdTime: string;
};

function authHeaders() {
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    throw new Error("ยังไม่ได้ตั้งค่า AIRTABLE_API_KEY หรือ AIRTABLE_BASE_ID");
  }
  return { Authorization: `Bearer ${AIRTABLE_API_KEY}` };
}

// ดึงข้อมูลทุกแถวจากตาราง Airtable (วนดึงตาม offset จนหมด) — cache 5 นาที
// เพราะ Airtable ยังเป็น source of truth หลัก ข้อมูลเปลี่ยนบ่อยจากทีมสแกาต์
export async function getAirtableRecords<T = Record<string, unknown>>(
  tableName: string,
): Promise<AirtableRecord<T>[]> {
  const records: AirtableRecord<T>[] = [];
  let offset: string | undefined;

  do {
    const url = new URL(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(tableName)}`,
    );
    url.searchParams.set("pageSize", "100");
    if (offset) url.searchParams.set("offset", offset);

    const res = await fetch(url, {
      headers: authHeaders(),
      next: { revalidate: 300 },
    });
    if (!res.ok) {
      throw new Error(`ดึงข้อมูลจาก Airtable ไม่สำเร็จ (${res.status}): ${await res.text()}`);
    }
    const data = (await res.json()) as { records: AirtableRecord<T>[]; offset?: string };
    records.push(...data.records);
    offset = data.offset;
  } while (offset);

  return records;
}

export async function getAirtableRecord<T = Record<string, unknown>>(
  tableName: string,
  id: string,
): Promise<AirtableRecord<T> | null> {
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(tableName)}/${encodeURIComponent(id)}`;
  const res = await fetch(url, {
    headers: authHeaders(),
    next: { revalidate: 300 },
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`ดึงข้อมูลจาก Airtable ไม่สำเร็จ (${res.status}): ${await res.text()}`);
  }
  return res.json();
}
