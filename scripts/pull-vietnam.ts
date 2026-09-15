// Генератор данных домена «Вьетнам» из базы региона.
// Запуск: npm run pull   (или npx tsx scripts/pull-vietnam.ts)
//
// Читает PostgREST базы region-lamdong и пишет src/data/vietnam.generated.ts.
// Файл КОММИТИТСЯ: атлас статический, на Vercel доступа к базе нет, сборка
// берёт закоммиченную версию. Без ключей скрипт молча выходит с нулём -
// это штатный путь сборки на чужой машине, а не отказ.
//
// Ключи только из .env атласа (он в .gitignore) или из окружения:
//   REGION_SUPABASE_URL, REGION_SUPABASE_SERVICE_KEY (или ANON_KEY).
// RLS включён у всех таблиц базы, политик ноль: анонимный ключ не видит НИ ОДНОЙ
// строки и вернёт пустые массивы. Читать надо сервисным ключом.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = resolve(ROOT, 'src/data/vietnam.generated.ts');

// ─── Ключи ────────────────────────────────────────────────────────────────────

const loadEnv = () => {
  const file = resolve(ROOT, '.env');
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(line);
    if (!m) continue;
    const value = m[2].trim().replace(/^['"]|['"]$/g, '');
    if (!process.env[m[1]]) process.env[m[1]] = value;
  }
};
loadEnv();

const BASE = (process.env.REGION_SUPABASE_URL ?? '').replace(/\/$/, '');
const KEY = process.env.REGION_SUPABASE_SERVICE_KEY || process.env.REGION_SUPABASE_ANON_KEY || '';

// ─── PostgREST ────────────────────────────────────────────────────────────────

const missing: string[] = [];

/** Одна таблица. Нет таблицы (миграция ещё не применена) - пустой массив и отметка. */
async function table<T>(name: string, query: string): Promise<T[]> {
  const res = await fetch(`${BASE}/rest/v1/${name}?${query}`, {
    headers: { apikey: KEY, authorization: `Bearer ${KEY}`, accept: 'application/json' }
  });
  if (res.status === 404 || res.status === 400) {
    missing.push(name);
    return [];
  }
  if (!res.ok) throw new Error(`${name}: HTTP ${res.status} ${(await res.text()).slice(0, 200)}`);
  return (await res.json()) as T[];
}

// ─── Строки ───────────────────────────────────────────────────────────────────

interface Region { id: string; slug: string; level: string; parent_id: string | null; name_vi: string | null; name_ru: string | null; name_en: string | null; perimeter: string | null; lat: number | null; lon: number | null; area_km2: number | null }
interface Stat { region_id: string; metric: string; period: string | null; value: number | null; unit: string | null; source_type: string | null; source_url: string | null; source_note: string | null; fetched_at: string | null }
interface Market { id: string; region_id: string; slug: string; name_ru: string | null; players_count: number | null; players_source: string | null; size_vnd_year: number | null; size_source_type: string | null; size_source_url: string | null; avg_price_vnd: number | null; opportunity_score: number | null; opportunity_note: string | null }
interface Player { market_id: string; name: string; lat: number | null; lon: number | null; rating: number | null; reviews: number | null; source: string | null }
interface Forecast { for_date: string; made_at: string; horizon: string | null; subject: string; value: number | null; direction_note: string | null; reasoning: string | null }
interface EventRow { title: string; kind: string | null; event_class: string | null; starts_at: string | null; ends_at: string | null; summary: string | null; source_url: string | null; source_name: string | null; evidence_kind: string | null }
interface Point { id: string; external_id: string; kind: string; name: string; lat: number | null; lon: number | null }
interface Obs { point_id: string; metric: string; at: string; value: number | null; source: string | null }
interface Heartbeat { job: string; ok: boolean; message: string | null; last_run_at: string | null; last_ok_at: string | null }
interface Topic { region_slug: string | null; title_ru: string | null; title_vi: string | null; angle: string | null; audience: string | null; score: number | null; score_reason: string | null; status: string | null; created_at: string | null }
interface Insight { region_slug: string | null; title: string | null; summary: string | null; kind: string | null; score: number | null; created_at: string | null }
interface Entity { id: string; slug: string; kind: string | null; name_ru: string | null; name_vi: string | null; region_slug: string | null; summary: string | null }
interface Edge { from_slug: string | null; to_slug: string | null; kind: string | null; note: string | null }
interface EntityMetric { entity_slug: string | null; metric: string; period: string | null; value: number | null; unit: string | null; source_type: string | null; source_url: string | null }

const iso = (d: Date) => d.toISOString();
const day = (d: Date) => d.toISOString().slice(0, 10);

async function pull() {
  const now = new Date();
  const yesterday = new Date(now.getTime() - 864e5);

  const [regions, stats, markets, players, points] = await Promise.all([
    table<Region>('regions', 'select=id,slug,level,parent_id,name_vi,name_ru,name_en,perimeter,lat,lon,area_km2&order=level,slug&limit=2000'),
    table<Stat>('region_stats', 'select=region_id,metric,period,value,unit,source_type,source_url,source_note,fetched_at&limit=20000'),
    table<Market>('markets', 'select=id,region_id,slug,name_ru,players_count,players_source,size_vnd_year,size_source_type,size_source_url,avg_price_vnd,opportunity_score,opportunity_note&order=slug&limit=2000'),
    table<Player>('market_players', 'select=market_id,name,lat,lon,rating,reviews,source&limit=5000'),
    table<Point>('observation_points', 'select=id,external_id,kind,name,lat,lon&limit=200')
  ]);

  // Прогноз берём только последнего замеса на сегодня: суточный обход пишет
  // весь набор направлений разом, старые замесы того же дня это история.
  const rawForecasts = await table<Forecast>(
    'forecasts',
    // features не берём: там сырые новости прогноза, файл раздувается в мегабайты.
    `select=for_date,made_at,horizon,subject,value,direction_note,reasoning&for_date=eq.${day(now)}&order=made_at.desc&limit=200`
  );
  const lastMade = rawForecasts[0]?.made_at ?? null;
  const forecasts = rawForecasts.filter((f) => f.made_at === lastMade);

  // Ближайшие события, а не окно в 30 дней: календарь региона редкий, до
  // фестиваля цветов 95 дней, и окно в месяц оставляло блок пустым. Берём
  // идущие сейчас (учебный семестр) и ближайшие впереди.
  const events = await table<EventRow>(
    'events',
    `select=title,kind,event_class,starts_at,ends_at,summary,source_url,source_name,evidence_kind&or=(starts_at.gte.${iso(now)},ends_at.gte.${iso(now)})&order=starts_at&limit=12`
  );

  // Граф сущностей (миграция 0004 агента region-graph) и инсайты могут ещё не
  // существовать: table() отдаёт пустой массив и отметку в missingTables.
  const [heartbeats, topics, insights, entities, edges, entityMetrics] = await Promise.all([
    table<Heartbeat>('job_heartbeats', 'select=job,ok,message,last_run_at,last_ok_at&order=job&limit=100'),
    table<Topic>('media_topics', 'select=region_slug,title_ru,title_vi,angle,audience,score,score_reason,status,created_at&order=created_at.desc&limit=20'),
    table<Insight>('insights', 'select=*&order=created_at.desc&limit=20'),
    table<Entity>('entities', 'select=*&limit=2000'),
    table<Edge>('edges', 'select=*&limit=4000'),
    table<EntityMetric>('entity_metrics', 'select=*&limit=8000')
  ]);

  const obs = await table<Obs>(
    'observations',
    `select=point_id,metric,at,value,source&at=gte.${iso(yesterday)}&at=lte.${iso(now)}&order=at&limit=20000`
  );

  // Сводка наблюдений за сутки: по точке и метрике min/max/среднее и последнее.
  const pointById = new Map(points.map((p) => [p.id, p]));
  const buckets = new Map<string, { point: Point; metric: string; vals: number[]; last: number | null; lastAt: string | null }>();
  for (const o of obs) {
    const point = pointById.get(o.point_id);
    if (!point || o.value === null) continue;
    const key = `${o.point_id}|${o.metric}`;
    let b = buckets.get(key);
    if (!b) buckets.set(key, (b = { point, metric: o.metric, vals: [], last: null, lastAt: null }));
    b.vals.push(Number(o.value));
    if (!b.lastAt || o.at > b.lastAt) { b.lastAt = o.at; b.last = Number(o.value); }
  }
  const observationSummary = [...buckets.values()]
    .map((b) => ({
      point: b.point.name,
      point_kind: b.point.kind,
      metric: b.metric,
      min: Math.min(...b.vals),
      max: Math.max(...b.vals),
      avg: b.vals.reduce((s, v) => s + v, 0) / b.vals.length,
      sum: b.vals.reduce((s, v) => s + v, 0),
      last: b.last,
      last_at: b.lastAt,
      samples: b.vals.length
    }))
    .sort((a, b) => a.point.localeCompare(b.point) || a.metric.localeCompare(b.metric));

  // Слаг вместо uuid: генерированный файл читается человеком и джойнится в UI
  // по слагу, а uuid базы наружу не нужен.
  const slugById = new Map(regions.map((r) => [r.id, r.slug]));
  const statRows = stats.map((s) => ({ ...s, region_slug: slugById.get(s.region_id) ?? s.region_id }));
  const playersByMarket = new Map<string, Player[]>();
  for (const p of players) {
    const list = playersByMarket.get(p.market_id) ?? [];
    list.push(p);
    playersByMarket.set(p.market_id, list);
  }
  const marketRows = markets.map((m) => ({
    ...m,
    region_slug: slugById.get(m.region_id) ?? m.region_id,
    players: (playersByMarket.get(m.id) ?? []).sort((a, b) => (b.reviews ?? 0) - (a.reviews ?? 0))
  }));

  return { regions, statRows, marketRows, forecasts, events, observationSummary, heartbeats, topics, insights, entities, edges, entityMetrics, now };
}

// ─── Запись ───────────────────────────────────────────────────────────────────

const json = (v: unknown) => JSON.stringify(v, null, 2);

function render(d: Awaited<ReturnType<typeof pull>>) {
  const counts = {
    regions: d.regions.length,
    region_stats: d.statRows.length,
    markets: d.marketRows.length,
    market_players: d.marketRows.reduce((s, m) => s + m.players.length, 0),
    forecasts: d.forecasts.length,
    events: d.events.length,
    observation_metrics: d.observationSummary.length,
    job_heartbeats: d.heartbeats.length,
    media_topics: d.topics.length,
    insights: d.insights.length,
    entities: d.entities.length,
    edges: d.edges.length,
    entity_metrics: d.entityMetrics.length
  };
  return `// СГЕНЕРИРОВАННЫЙ ФАЙЛ. Руками не править: перезапишется.
// Источник: база региона Supabase region-lamdong, таблицы regions, region_stats,
// markets, market_players, forecasts, events, observations.
// Обновить: npm run pull (нужен .env с REGION_SUPABASE_URL и SERVICE_KEY).
// Сборка на Vercel базу не видит и берёт этот файл как есть.
//
// Снято: ${d.now.toISOString()}
// Строк: ${Object.entries(counts).map(([k, v]) => `${k} ${v}`).join(' · ')}
${missing.length ? `// Таблиц ещё нет в базе: ${missing.join(', ')}\n` : ''}
export interface GenRegion { id: string; slug: string; level: string; parent_id: string | null; name_vi: string | null; name_ru: string | null; name_en: string | null; perimeter: string | null; lat: number | null; lon: number | null; area_km2: number | null }
export interface GenStat { region_slug: string; metric: string; period: string | null; value: number | null; unit: string | null; source_type: string | null; source_url: string | null; source_note: string | null; fetched_at: string | null }
export interface GenPlayer { name: string; lat: number | null; lon: number | null; rating: number | null; reviews: number | null; source: string | null }
export interface GenMarket { id: string; region_slug: string; slug: string; name_ru: string | null; players_count: number | null; players_source: string | null; size_vnd_year: number | null; size_source_type: string | null; size_source_url: string | null; avg_price_vnd: number | null; opportunity_score: number | null; opportunity_note: string | null; players: GenPlayer[] }
export interface GenForecast { for_date: string; made_at: string; horizon: string | null; subject: string; value: number | null; direction_note: string | null; reasoning: string | null }
export interface GenEvent { title: string; kind: string | null; event_class: string | null; starts_at: string | null; ends_at: string | null; summary: string | null; source_url: string | null; source_name: string | null; evidence_kind: string | null }
export interface GenHeartbeat { job: string; ok: boolean; message: string | null; last_run_at: string | null; last_ok_at: string | null }
export interface GenTopic { region_slug: string | null; title_ru: string | null; title_vi: string | null; angle: string | null; audience: string | null; score: number | null; score_reason: string | null; status: string | null; created_at: string | null }
export interface GenInsight { region_slug?: string | null; title?: string | null; summary?: string | null; kind?: string | null; score?: number | null; created_at?: string | null }
export interface GenEntity { slug: string; kind?: string | null; name_ru?: string | null; name_vi?: string | null; region_slug?: string | null; summary?: string | null }
export interface GenEdge { from_slug?: string | null; to_slug?: string | null; kind?: string | null; note?: string | null }
export interface GenEntityMetric { entity_slug?: string | null; metric: string; period?: string | null; value?: number | null; unit?: string | null; source_type?: string | null; source_url?: string | null }
export interface GenObservation { point: string; point_kind: string; metric: string; min: number; max: number; avg: number; sum: number; last: number | null; last_at: string | null; samples: number }

/** Момент выгрузки. Показывается в разделе: данные ровно этой свежести. */
export const generatedAt = ${json(d.now.toISOString())};

/** Сколько строк пришло из каждой таблицы на момент выгрузки. */
export const generatedCounts = ${json(counts)};

/** Таблицы, которых в базе ещё нет: их блоки в разделе не рисуются. */
export const missingTables: string[] = ${json(missing)};

export const GEN_REGIONS: GenRegion[] = ${json(d.regions)};

export const GEN_STATS: GenStat[] = ${json(d.statRows)};

export const GEN_MARKETS: GenMarket[] = ${json(d.marketRows)};

export const GEN_FORECASTS: GenForecast[] = ${json(d.forecasts)};

export const GEN_EVENTS: GenEvent[] = ${json(d.events)};

export const GEN_OBSERVATIONS: GenObservation[] = ${json(d.observationSummary)};

export const GEN_HEARTBEATS: GenHeartbeat[] = ${json(d.heartbeats)};

export const GEN_TOPICS: GenTopic[] = ${json(d.topics)};

export const GEN_INSIGHTS: GenInsight[] = ${json(d.insights)};

export const GEN_ENTITIES: GenEntity[] = ${json(d.entities)};

export const GEN_EDGES: GenEdge[] = ${json(d.edges)};

export const GEN_ENTITY_METRICS: GenEntityMetric[] = ${json(d.entityMetrics)};
`;
}

if (!BASE || !KEY) {
  console.log('pull-vietnam: ключей нет, беру закоммиченный src/data/vietnam.generated.ts');
  process.exit(0);
}

pull()
  .then((d) => {
    writeFileSync(OUT, render(d));
    console.log(
      `pull-vietnam: регионов ${d.regions.length} · показателей ${d.statRows.length} · рынков ${d.marketRows.length} · прогнозов ${d.forecasts.length} · событий ${d.events.length} · метрик наблюдений ${d.observationSummary.length} · пульс ${d.heartbeats.length} · тем ${d.topics.length} · сущностей ${d.entities.length}`
    );
    if (missing.length) console.log(`pull-vietnam: таблиц ещё нет: ${missing.join(', ')}`);
  })
  .catch((e) => {
    console.error(`pull-vietnam: ${e.message}`);
    process.exit(1);
  });
