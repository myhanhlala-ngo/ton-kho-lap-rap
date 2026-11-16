// Cloudflare Pages Function – shared data for "Tồn kho lắp ráp"
// GET  /api/sync  -> { rev, savedAt, data }          (data = all dates, normalized)
// POST /api/sync  { baseRev, rev, data }            -> { ok, rev } | 409 { conflict } when someone saved first
// Needs a D1 database bound to this Pages project with the variable name  DB.
const H = { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' };
const json = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: H });

async function init(db) {
  await db.batch([
    db.prepare("CREATE TABLE IF NOT EXISTS kv (k TEXT PRIMARY KEY, v TEXT NOT NULL)"),
    db.prepare("INSERT OR IGNORE INTO kv (k, v) VALUES ('rev', '')"),
  ]);
}

export async function onRequestGet({ env }) {
  if (!env.DB) return json({ error: 'NO_DB' }, 503);
  await init(env.DB);
  const { results } = await env.DB.prepare("SELECT k, v FROM kv").all();
  const m = {};
  for (const r of results) m[r.k] = r.v;
  if (!m.core) return json({ rev: m.rev || '', savedAt: '', data: null });
  const data = JSON.parse(m.core);
  data.days = {};
  for (const k of Object.keys(m)) if (k.startsWith('day:')) data.days[k.slice(4)] = JSON.parse(m[k]);
  return json({ rev: m.rev || '', savedAt: m.savedAt || '', data });
}

export async function onRequestPost({ request, env }) {
  if (!env.DB) return json({ error: 'NO_DB' }, 503);
  let b;
  try { b = JSON.parse(await request.text()); } catch (e) { return json({ error: 'BAD_JSON' }, 400); }
  if (!b || typeof b.data !== 'object' || !b.data) return json({ error: 'NO_DATA' }, 400);
  const db = env.DB;
  await init(db);
  const base = String(b.baseRev || ''), rev = String(b.rev || Date.now());
  const days = b.data.days || {};
  const core = { ...b.data }; delete core.days;
  const cond = "(SELECT v FROM kv WHERE k = 'rev') = ?";
  // every statement only runs while the stored revision is still the one this client started from;
  // the batch runs as one transaction, so a concurrent save can never be half-overwritten
  const st = [db.prepare(`INSERT OR REPLACE INTO kv (k, v) SELECT 'core', ? WHERE ${cond}`).bind(JSON.stringify(core), base)];
  for (const [d, v] of Object.entries(days))
    st.push(db.prepare(`INSERT OR REPLACE INTO kv (k, v) SELECT ?, ? WHERE ${cond}`).bind('day:' + d, JSON.stringify(v), base));
  st.push(db.prepare(`DELETE FROM kv WHERE k LIKE 'day:%' AND k NOT IN (SELECT value FROM json_each(?)) AND ${cond}`)
    .bind(JSON.stringify(Object.keys(days).map(d => 'day:' + d)), base));
  st.push(db.prepare(`INSERT OR REPLACE INTO kv (k, v) SELECT 'savedAt', ? WHERE ${cond}`).bind(new Date().toISOString(), base));
  st.push(db.prepare("UPDATE kv SET v = ? WHERE k = 'rev' AND v = ?").bind(rev, base));
  const res = await db.batch(st);
  if (!res[res.length - 1].meta.changes) return json({ conflict: true }, 409);
  return json({ ok: true, rev });
}
