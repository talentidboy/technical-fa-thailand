// เปิดทุกหน้าหลักของเว็บ (บุคคลทั่วไป / แอดมิน / โค้ช) — ต้องไม่ขึ้นหน้าข้อผิดพลาด ไม่เด้งไปหน้าเข้าสู่ระบบโดยไม่ควร
// และลิงก์ผิด (id ไม่ถูกต้อง) ต้องตอบ "ไม่พบ" ไม่ใช่ error
const ERROR_TEXT = "ขออภัย เกิดข้อผิดพลาดบางอย่าง";
const NOT_FOUND_TEXT = "ไม่พบหน้าที่คุณต้องการ";

async function seed(ctx) {
  const q = ctx.sql;
  const coach = (await q(`insert into coaches (name_th, surname_th, afc_id, gender, province_code, updated_at) values ('สมชาย','ทดสอบ','AFC-1','MALE','10', now()) returning id`))[0].id;
  await q(`insert into license_records (coach_id, license_type, record_type, certificate_no, issue_date, expire_date) values ($1,'C','TRAINING','C-25/0001', now() - interval '200 days', now() + interval '900 days')`, [coach]);
  const course = (await q(`insert into courses (course_type, license_type, title) values ('LICENSE','B','AFC B Diploma') returning id`))[0].id;
  const session = (
    await q(
      `insert into course_sessions (course_id, name, venue, capacity, status, start_date, end_date, application_deadline) values ($1,'รุ่นที่ 1','กรุงเทพฯ',30,'OPEN', now() + interval '30 days', now() + interval '40 days', now() + interval '10 days') returning id`,
      [course],
    )
  )[0].id;
  const home = (await q(`insert into g15_teams (name, national_group, national_seed) values ('ทีมเอ','A',1) returning id`))[0].id;
  const away = (await q(`insert into g15_teams (name, national_group, national_seed) values ('ทีมบี','A',2) returning id`))[0].id;
  const player = (await q(`insert into g15_players (team_id, first_name_th, last_name_th, jersey_number, position) values ($1,'นักเตะ','ทดสอบ',10,'กองหน้า') returning id`, [home]))[0].id;
  const match = (
    await q(
      `insert into g15_matches (stage, match_no, round, match_date, home_team_id, away_team_id, status, clock_phase) values ('NATIONAL',1,'รอบแบ่งกลุ่ม', now() + interval '1 day', $1,$2,'SCHEDULED','PRE') returning id`,
      [home, away],
    )
  )[0].id;
  // ผู้ฝึกสอนต่างชาติ: มีแต่ชื่ออังกฤษ
  const foreign = (await q(`insert into coaches (name_th, surname_th, name_en, family_name_en, afc_id, updated_at) values ('','','MARCO','GOCKEL','AFC/1/GER', now()) returning id`))[0].id;
  await q(`insert into license_records (coach_id, license_type, record_type, issue_date, expire_date) values ($1,'A','TRAINING', now() - interval '100 days', now() + interval '60 days')`, [foreign]);
  return { coach, session, team: home, player, match, foreign };
}

module.exports = {
  name: "เปิดทุกหน้าหลัก + ลิงก์ผิด",
  async run(ctx) {
    const { check, BASE } = ctx;
    const s = await seed(ctx);
    const admin = await ctx.login("ADMIN");
    const coach = await ctx.login("COACH", { coachId: s.coach });
    const academy = await ctx.login("ACADEMY", { email: "smoke-academy@test.invalid" });
    const academyId = (await ctx.sql(`insert into academies (name_en, province, updated_at) values ('Smoke Academy','ขอนแก่น', now()) returning id`))[0].id;
    await ctx.sql(
      `insert into academy_members (user_id, academy_id, name, status, updated_at) select user_id, $1, 'ผู้ดูแล', 'APPROVED', now() from system_users where email='smoke-academy@test.invalid'`,
      [academyId],
    );
    const teamId = (await ctx.sql(`insert into academy_teams (academy_id, name, age_group, updated_at) values ($1,'U12',12, now()) returning id`, [academyId]))[0].id;

    const groups = [
      {
        who: "บุคคลทั่วไป",
        token: null,
        pages: [
          "/",
          "/coach-center",
          "/courses",
          "/coach-center/login",
          "/login",
          "/register",
          "/play-and-learn",
          "/academies",
          "/academies/login",
          "/academies/register",
          "/grassroots-football",
          "/training-centre",
          `/apply/${s.session}`,
          `/verify/${s.coach}`,
          "/g15-womens-series",
          "/g15-womens-series/matches",
          "/g15-womens-series/standings",
          "/g15-womens-series/stats",
          "/g15-womens-series/teams",
          "/g15-womens-series/stadium",
          "/g15-womens-series/gallery",
          "/g15-womens-series/awards",
          `/g15-womens-series/teams/${s.team}`,
          `/g15-womens-series/matches/${s.match}`,
          `/g15-womens-series/players/${s.player}`,
        ],
      },
      {
        who: "แอดมิน",
        token: admin,
        pages: [
          "/dashboard",
          "/dashboard/report",
          "/coaches",
          `/coaches/${s.coach}`,
          `/coaches/${s.coach}/edit`,
          `/coaches/${s.coach}/card`,
          "/coaches/accounts",
          "/instructors",
          "/course-sessions",
          `/course-sessions/${s.session}`,
          "/renewals",
          "/renewals?tab=history",
          "/reports",
          "/requests",
          "/errors",
          "/audit",
          "/users",
          "/calendar",
          "/announcements",
          "/training-centre",
          "/grassroots-football",
          "/academies/manage",
          "/academies/manage/academies",
          "/academies/manage/academies/new",
          "/academies/manage/licences",
          "/academies/manage/licences?tab=expiring",
          "/academies/manage/activity",
          `/academies/manage/${academyId}`,
          ...["info", "licences", "people", "applications", "accounts", "history"].map((t) => `/academies/manage/${academyId}?tab=${t}`),
          "/academies/manage/applications",
          "/academies/manage/applications?status=APPROVED",
          "/academies/manage/accounts",
          "/play-and-learn/manage",
          "/play-and-learn/manage?tab=centers",
          "/play-and-learn/manage?tab=PASSPORT",
          "/play-and-learn/manage?tab=EVENT",
          "/play-and-learn/manage?tab=PHOTO",
          "/g15-womens-series/manage",
          "/g15-womens-series/manage/awards",
          `/g15-womens-series/manage/teams/${s.team}`,
          `/g15-womens-series/manage/matches/${s.match}`,
        ],
      },
      { who: "โค้ช", token: coach, pages: ["/me", "/me/courses", "/me/card", "/me/settings", "/me/edit", "/me/notifications"] },
      {
        who: "อคาเดมี",
        token: academy,
        pages: [
          "/academies",
          "/academies/portal",
          "/academies/portal/profile",
          "/academies/portal/staff",
          "/academies/portal/teams",
          `/academies/portal/teams/${teamId}`,
          "/academies/portal/applications",
          "/academies/portal/notices",
        ],
      },
    ];

    for (const g of groups) {
      const p = await ctx.page(g.token);
      const bad = [];
      for (const url of g.pages) {
        const res = await p.goto(BASE + url, { waitUntil: "networkidle", timeout: 240_000 });
        const body = await p.locator("body").innerText();
        const status = res ? res.status() : 0;
        const toLogin = /\/(coach-center\/)?login/.test(new URL(p.url()).pathname) && !url.includes("login");
        if (status >= 400 || body.includes(ERROR_TEXT) || body.includes(NOT_FOUND_TEXT) || toLogin) bad.push(`${url} (${status}${toLogin ? " → login" : ""})`);
      }
      check(`${g.who}: เปิดได้ครบ ${g.pages.length} หน้า`, bad.length === 0, bad.join(", "));
    }

    // ลิงก์ผิด → หน้า "ไม่พบ" (404) ไม่ใช่หน้าข้อผิดพลาด
    const p = await ctx.page(admin);
    for (const url of ["/coaches/abc", "/coaches/99999999999", "/g15-womens-series/teams/abc", "/news/xyz", "/course-sessions/0", "/academies/manage/applications/abc", "/หน้าที่ไม่มีอยู่"]) {
      const res = await p.goto(BASE + encodeURI(url), { waitUntil: "networkidle" });
      const body = await p.locator("body").innerText();
      check(`ลิงก์ผิด ${url} → 404 ภาษาไทย`, res && res.status() === 404 && body.includes(NOT_FOUND_TEXT) && !body.includes(ERROR_TEXT), String(res && res.status()));
    }
    // ผู้ฝึกสอนต่างชาติ (ไม่มีชื่อไทย) ต้องแสดงชื่ออังกฤษแทนช่องว่าง
    await p.goto(`${BASE}/coaches/${s.foreign}`, { waitUntil: "networkidle" });
    check("ผู้ฝึกสอนต่างชาติ: หน้าประวัติแสดงชื่ออังกฤษ", (await p.locator("main h1, main h2").first().innerText()).includes("MARCO GOCKEL"));
    await p.goto(`${BASE}/renewals?tab=expiring`, { waitUntil: "networkidle" });
    check("ผู้ฝึกสอนต่างชาติ: รายการต่ออายุแสดงชื่ออังกฤษ", (await p.locator("main").innerText()).includes("MARCO GOCKEL"));
    await p.goto(`${BASE}/verify/abc`, { waitUntil: "networkidle" });
    check("QR ผิด /verify/abc → ไม่พบข้อมูล (ไม่ error)", (await p.locator("body").innerText()).includes("ไม่พบข้อมูล"));
    const serverErrors = await ctx.sql("select count(*)::int n from error_logs where source='SERVER'");
    check("ไม่มี error ฝั่งเซิร์ฟเวอร์ถูกบันทึกระหว่างเปิดทุกหน้า", serverErrors[0].n === 0, JSON.stringify(await ctx.sql("select path, message from error_logs limit 3")));
  },
};
