// สร้างแผนที่ประเทศไทยรายจังหวัด (SVG path) สำหรับหน้า Academy Licensing → src/lib/thailand-map.json
// ข้อมูลขอบเขต: Natural Earth admin-1 (public domain) — https://www.naturalearthdata.com
//   ดาวน์โหลด ne_10m_admin_1_states_provinces.geojson แล้วรัน:
//   node scripts/build-thailand-map.cjs <ไฟล์.geojson>
// จับคู่ชื่อไทยด้วยรหัส ISO 3166-2 (TH-10 = กรุงเทพมหานคร) กับรหัสจังหวัดของ geothai · ลดจุดด้วย Douglas–Peucker
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const { getAllProvinces } = require(path.join(ROOT, "node_modules/geothai"));

const WIDTH = 400; // ความกว้าง viewBox
const TOLERANCE = 0.45; // ระยะลดจุด (หน่วย viewBox)
const MIN_RING_AREA = 1.5; // ตัดเกาะเล็กมาก (หน่วย viewBox²)

const src = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const features = src.features.filter((f) => f.properties.adm0_a3 === "THA");
const thai = new Map(getAllProvinces().map((p) => [Number(p.code), p]));

// ฉายแผนที่แบบ equirectangular ปรับ cos(ละติจูดกลาง) ให้สัดส่วนถูก
let minLon = Infinity, maxLon = -Infinity, minLat = Infinity, maxLat = -Infinity;
const rings = (g) => (g.type === "Polygon" ? [g.coordinates] : g.coordinates);
for (const f of features)
  for (const poly of rings(f.geometry))
    for (const [lon, lat] of poly[0]) {
      minLon = Math.min(minLon, lon);
      maxLon = Math.max(maxLon, lon);
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
    }
const k = Math.cos((((minLat + maxLat) / 2) * Math.PI) / 180);
const scale = WIDTH / ((maxLon - minLon) * k);
const HEIGHT = Math.ceil((maxLat - minLat) * scale);
const project = ([lon, lat]) => [(lon - minLon) * k * scale, (maxLat - lat) * scale];

// วงปิด (จุดแรก = จุดสุดท้าย) แบ่งที่จุดที่ไกลจุดแรกที่สุดก่อน ไม่งั้นเส้นอ้างอิงยาว 0 แล้วยุบทั้งวง
function simplifyRing(ring, tol) {
  const [x0, y0] = ring[0];
  let far = 1;
  ring.forEach(([x, y], i) => {
    if (Math.hypot(x - x0, y - y0) > Math.hypot(ring[far][0] - x0, ring[far][1] - y0)) far = i;
  });
  return [...simplify(ring.slice(0, far + 1), tol).slice(0, -1), ...simplify(ring.slice(far), tol)];
}

function simplify(points, tol) {
  if (points.length < 4) return points;
  const keep = new Uint8Array(points.length);
  keep[0] = keep[points.length - 1] = 1;
  const stack = [[0, points.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    const [ax, ay] = points[a];
    const [bx, by] = points[b];
    const len = Math.hypot(bx - ax, by - ay) || 1e-9;
    let max = 0, idx = -1;
    for (let i = a + 1; i < b; i++) {
      const d = Math.abs((bx - ax) * (ay - points[i][1]) - (ax - points[i][0]) * (by - ay)) / len;
      if (d > max) (max = d), (idx = i);
    }
    if (max > tol && idx > 0) {
      keep[idx] = 1;
      stack.push([a, idx], [idx, b]);
    }
  }
  return points.filter((_, i) => keep[i]);
}

const area = (pts) => pts.reduce((s, [x, y], i) => { const [x2, y2] = pts[(i + 1) % pts.length]; return s + (x * y2 - x2 * y); }, 0) / 2;
function centroid(pts) {
  const a = area(pts);
  let cx = 0, cy = 0;
  pts.forEach(([x, y], i) => {
    const [x2, y2] = pts[(i + 1) % pts.length];
    const f = x * y2 - x2 * y;
    cx += (x + x2) * f;
    cy += (y + y2) * f;
  });
  return [cx / (6 * a), cy / (6 * a)];
}
const fmt = (n) => Math.round(n * 10) / 10;

const provinces = features
  .map((f) => {
    const code = Number(f.properties.iso_3166_2.replace("TH-", ""));
    const p = thai.get(code);
    if (!p) throw new Error(`ไม่พบจังหวัดรหัส ${code} (${f.properties.name})`);
    const outer = rings(f.geometry)
      .map((poly) => simplifyRing(poly[0].map(project), TOLERANCE))
      .filter((r) => r.length >= 4 && Math.abs(area(r)) >= MIN_RING_AREA)
      .sort((a, b) => Math.abs(area(b)) - Math.abs(area(a)));
    const d = outer.map((r) => `M${r.map(([x, y]) => `${fmt(x)} ${fmt(y)}`).join("L")}Z`).join("");
    const [cx, cy] = centroid(outer[0]);
    return { code, th: p.name_th, en: p.name_en, d, cx: fmt(cx), cy: fmt(cy) };
  })
  .sort((a, b) => a.code - b.code);

const out = path.join(ROOT, "src/lib/thailand-map.json");
fs.writeFileSync(out, JSON.stringify({ width: WIDTH, height: HEIGHT, provinces }));
console.log(`✓ ${provinces.length} จังหวัด → ${path.relative(ROOT, out)} (${(fs.statSync(out).size / 1024).toFixed(0)} KB, viewBox ${WIDTH}×${HEIGHT})`);
