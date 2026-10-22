// รางวัล G15: ค่าแนะนำจากผลการแข่งขัน, ดาวซัลโวร่วม (สถิติเท่ากัน), รางวัลร่วมหลายคน, บันทึก/แสดงหน้าเว็บ
async function seed(ctx) {
  const q = ctx.sql;
  const teams = {};
  for (const [name, g, s] of [["ทีมแดง", "A", 1], ["ทีมน้ำเงิน", "A", 2], ["ทีมเขียว", "B", 1], ["ทีมเหลือง", "B", 2]]) {
    const t = (await q(`insert into g15_teams (name, national_group, national_seed) values ($1,$2,$3) returning id`, [name, g, s]))[0].id;
    teams[name] = { id: t, players: {} };
    for (const [pos, no] of [["ผู้รักษาประตู", 1], ["กองหลัง", 2], ["กองหลัง", 3], ["กองหลัง", 4], ["กองหลัง", 5], ["กองกลาง", 6], ["กองกลาง", 7], ["กองกลาง", 8], ["กองกลาง", 10], ["กองหน้า", 9], ["กองหน้า", 11], ["กองหน้า", 17]]) {
      teams[name].players[no] = (
        await q(`insert into g15_players (team_id, first_name_th, last_name_th, jersey_number, position) values ($1,$2,'ทดสอบ',$3,$4) returning id`, [t, `${name.replace("ทีม", "")}${no}`, no, pos])
      )[0].id;
    }
    await q(`insert into g15_officials (team_id, first_name_th, last_name_th, role) values ($1,$2,'โค้ช','หัวหน้าผู้ฝึกสอน')`, [t, `โค้ช${name.replace("ทีม", "")}`]);
  }
  const match = async (no, round, h, a, hs, as) =>
    (
      await q(
        `insert into g15_matches (stage, match_no, round, match_date, home_team_id, away_team_id, home_score, away_score, status, clock_phase) values ('NATIONAL',$1,$2, now() - interval '1 day', $3,$4,$5,$6,'FINISHED','FULL_TIME') returning id`,
        [no, round, teams[h].id, teams[a].id, hs, as],
      )
    )[0].id;
  await match(15, "ชิงอันดับที่ 3", "ทีมน้ำเงิน", "ทีมเหลือง", 2, 0);
  const final = await match(16, "ชิงชนะเลิศ", "ทีมแดง", "ทีมเขียว", 4, 3);
  // แดง9 ยิง 3 · เขียว11 ยิง 3 → ดาวซัลโวร่วม
  for (const [team, no] of [["ทีมแดง", 9], ["ทีมแดง", 9], ["ทีมแดง", 9], ["ทีมเขียว", 11], ["ทีมเขียว", 11], ["ทีมเขียว", 11]])
    await q(`insert into g15_goals (match_id, team_id, player_id, player_name, minute) values ($1,$2,$3,'x',10)`, [final, teams[team].id, teams[team].players[no]]);
  await q(`update g15_matches set player_of_match_id=$1 where id=$2`, [teams["ทีมแดง"].players[9], final]);
  return teams;
}

module.exports = {
  name: "รางวัล G15 (รางวัลร่วม)",
  async run(ctx) {
    const { check, sql, BASE } = ctx;
    const teams = await seed(ctx);
    const P = (t, n) => teams[t].players[n];
    const token = await ctx.login("ADMIN");
    const p = await ctx.page(token);
    await p.goto(`${BASE}/g15-womens-series/manage/awards`, { waitUntil: "networkidle", timeout: 240_000 });
    const hidden = async (name) => (await p.locator(`input[type=hidden][name="${name}"]`).evaluateAll((els) => els.map((e) => e.value))).sort();
    const dlg = () => p.locator('[role="dialog"]');
    const card = (title) => p.locator("div.rounded-xl", { hasText: title }).first();
    const rows = async (key) => sql("select player_id, official_id, team_id, note from g15_awards where key=$1 order by id", [key]);

    check("แชมป์จากผลนัดชิง", (await hidden("winner_CHAMPION"))[0] === String(teams["ทีมแดง"].id));
    const tie = [String(P("ทีมแดง", 9)), String(P("ทีมเขียว", 11))].sort();
    check("สถิติเท่ากัน → ใส่ดาวซัลโวให้ครบ 2 คน", JSON.stringify(await hidden("winner_TOP_SCORER")) === JSON.stringify(tie));
    check("ข้อความ 3 ประตู", (await p.locator('input[name="note_TOP_SCORER"]').inputValue()) === "3 ประตู");

    await p.getByRole("button", { name: "เอา เขียว11 ทดสอบ ออกจาก รางวัลดาวซัลโวสูงสุด" }).click();
    check("เอาออก 1 คน", (await hidden("winner_TOP_SCORER")).length === 1);
    await card("รางวัลดาวซัลโวสูงสุด").getByRole("button", { name: /ใช้ค่าแนะนำจากสถิติ \(เท่ากัน 2 คน\)/ }).click();
    check("ปุ่มค่าแนะนำใส่กลับครบ 2 คน", (await hidden("winner_TOP_SCORER")).length === 2);

    const sp = card("รางวัลน้ำใจนักกีฬา");
    await sp.getByRole("button", { name: /เลือก/ }).first().click();
    await dlg().locator("input").fill("เหลือง6");
    await dlg().getByRole("button", { name: /เหลือง6 ทดสอบ/ }).click();
    await dlg().waitFor({ state: "detached" });
    await sp.getByRole("button", { name: "เพิ่มผู้ได้รับรางวัลร่วม" }).click();
    await dlg().locator("input").fill("เหลือง6");
    check("เลือกคนเดิมซ้ำไม่ได้", await dlg().getByRole("button", { name: /เหลือง6 ทดสอบ/ }).isDisabled());
    await dlg().locator("input").fill("น้ำเงิน7");
    await dlg().getByRole("button", { name: /น้ำเงิน7 ทดสอบ/ }).click();
    await dlg().waitFor({ state: "detached" });
    check("รางวัลน้ำใจนักกีฬา 2 คน", (await hidden("winner_SPORTSMANSHIP")).length === 2);

    await p.getByRole("button", { name: "บันทึกรางวัลทั้งหมด" }).click();
    await p.getByText("บันทึกรางวัลแล้ว").waitFor({ timeout: 30_000 });
    const ts = await rows("TOP_SCORER");
    check("บันทึกดาวซัลโว 2 แถว ข้อความเดียวกัน", ts.length === 2 && ts.every((r) => r.note === "3 ประตู"));
    check("บันทึกรางวัลทีม 1 แถว", (await rows("CHAMPION")).length === 1);

    const pub = await ctx.page(null);
    await pub.goto(`${BASE}/g15-womens-series/awards`, { waitUntil: "networkidle" });
    const txt = await pub.locator("body").innerText();
    check("หน้ารางวัล: แสดงรางวัลร่วม + ชื่อทั้งสองคน", txt.includes("รางวัลร่วม 2 คน") && txt.includes("แดง9 ทดสอบ") && txt.includes("เขียว11 ทดสอบ"));
    const ph = await ctx.page(null, { width: 390, height: 844 });
    await ph.goto(`${BASE}/g15-womens-series/awards`, { waitUntil: "networkidle" });
    check("หน้ารางวัลบนมือถือ: ไม่มีเลื่อนซ้ายขวา", (await ph.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)) <= 0);
  },
};
