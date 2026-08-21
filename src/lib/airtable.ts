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

// วนดึงทุกหน้าจาก Airtable แบบสดเสมอ ไม่ cache รายหน้า — offset/iterator ของ Airtable
// หมดอายุเร็ว (ไม่กี่นาที) ถ้า cache แต่ละหน้าแยกกันด้วย revalidate ยาวๆ จะเกิดเคสที่
// หน้าแรกเสิร์ฟจาก cache เก่า แต่หน้าถัดไปต้องยิงสดด้วย offset ที่ Airtable มองว่าหมดอายุ
// ไปแล้ว → 422 LIST_RECORDS_ITERATOR_NOT_AVAILABLE. ผู้เรียก (เช่น getTalentPlayers)
// ควร cache ผลลัพธ์ที่ map/ตัดทอนแล้วแทน ไม่ใช่ cache raw records ตรงนี้ (raw records ทั้ง
// เบสใหญ่เกิน 2MB ที่ Next.js Data Cache รับได้ต่อ 1 entry อยู่แล้ว)
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
      cache: "no-store",
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

export type AirtableSort = { field: string; direction: "asc" | "desc" };

// ดึงข้อมูลแค่ "หนึ่งหน้า" ตรงจาก Airtable โดยผลัก filter/sort ไปให้ Airtable ทำเอง
// (filterByFormula + sort[]) แทนที่จะดึงทุกแถวมากรอง/เรียงในเมมโมรีฝั่งเรา — จำเป็นมาก
// สำหรับตารางขนาดหลักพันแถว ไม่ cache เพราะต้องการข้อมูลสดตรงจาก Airtable เสมอตามที่ตกลง
export async function queryAirtablePage<T = Record<string, unknown>>(
  tableName: string,
  options: {
    filterByFormula?: string;
    sort?: AirtableSort[];
    pageSize?: number;
    offset?: string;
  } = {},
): Promise<{ records: AirtableRecord<T>[]; offset?: string }> {
  const url = new URL(
    `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(tableName)}`,
  );
  url.searchParams.set("pageSize", String(options.pageSize ?? 50));
  if (options.filterByFormula) {
    url.searchParams.set("filterByFormula", options.filterByFormula);
  }
  if (options.offset) url.searchParams.set("offset", options.offset);
  options.sort?.forEach((s, i) => {
    url.searchParams.set(`sort[${i}][field]`, s.field);
    url.searchParams.set(`sort[${i}][direction]`, s.direction);
  });

  const res = await fetch(url, { headers: authHeaders(), cache: "no-store" });
  if (!res.ok) {
    throw new Error(`ดึงข้อมูลจาก Airtable ไม่สำเร็จ (${res.status}): ${await res.text()}`);
  }
  return res.json();
}

// escape ค่าที่จะฝังในสตริงของ Airtable formula (กัน " ในคำค้นหาทำให้ formula พัง)
export function escapeAirtableFormulaString(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
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
