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

/** Одна таблица целиком. Нет таблицы (миграция ещё не применена) - пустой
 *  массив и отметка в missingTables.
 *
 *  PostgREST отдаёт максимум 1000 строк за запрос и про обрезку не говорит:
 *  выгрузка молча теряла бы хвост по мере роста базы. Поэтому ходим страницами
 *  через заголовок Range, пока страница приходит полной. */
const PAGE = 1000;
async function table<T>(name: string, query: string): Promise<T[]> {
  // Запрос со своим limit это осознанная выборка верхушки (последние прогнозы,
  // свежие темы): страницами её не ходим, иначе limit спорит с Range.
  const paged = !query.includes('limit=');
  const out: T[] = [];
  for (let from = 0; ; from += PAGE) {
    const res = await fetch(`${BASE}/rest/v1/${name}?${query}`, {
      headers: {
        apikey: KEY,
        authorization: `Bearer ${KEY}`,
        accept: 'application/json',
        ...(paged ? { range: `${from}-${from + PAGE - 1}` } : {})
      }
    });
    if (res.status === 404 || res.status === 400) {
      if (from === 0) missing.push(name);
      return out;
    }
    if (!res.ok) throw new Error(`${name}: HTTP ${res.status} ${(await res.text()).slice(0, 200)}`);
    const page = (await res.json()) as T[];
    out.push(...page);
    if (!paged || page.length < PAGE) return out;
  }
}

// ─── Строки ───────────────────────────────────────────────────────────────────

interface Region { id: string; slug: string; level: string; parent_id: string | null; name_vi: string | null; name_ru: string | null; name_en: string | null; perimeter: string | null; lat: number | null; lon: number | null; area_km2: number | null }
interface Stat { region_id: string; metric: string; period: string | null; value: number | null; unit: string | null; source_type: string | null; source_url: string | null; source_note: string | null; fetched_at: string | null }
interface Market { id: string; region_id: string; slug: string; name_ru: string | null; players_count: number | null; players_source: string | null; players_counted_at: string | null; size_vnd_year: number | null; size_source_type: string | null; size_source_url: string | null; avg_price_vnd: number | null; opportunity_score: number | null; opportunity_note: string | null }
interface Player { market_id: string; name: string | null; lat: number | null; lon: number | null; rating: number | null; reviews: number | null; source: string | null }
interface EventRow { title: string; kind: string | null; event_class: string | null; starts_at: string | null; ends_at: string | null; summary: string | null; source_url: string | null; source_name: string | null; evidence_kind: string | null }
interface Heartbeat { job: string; ok: boolean; message: string | null; last_run_at: string | null; last_ok_at: string | null }
interface Topic { region_slug: string | null; title_ru: string | null; title_vi: string | null; angle: string | null; audience: string | null; score: number | null; score_reason: string | null; status: string | null; created_at: string | null }
interface Insight { kind: string | null; title_ru: string | null; body_ru: string | null; score: number | null; confidence: string | null; status: string | null; created_at: string | null }
interface Entity { id: string; slug: string; kind: string | null; name: string | null; name_vi: string | null; name_ru: string | null; region_slug: string | null; summary_ru: string | null }
interface Edge { src: string; dst: string; relation: string | null; weight: number | null; weight_unit: string | null; source_type: string | null; note: string | null }
interface MarketNode { id: string; slug: string; name: string | null; name_ru: string | null; region_slug: string | null; attrs: Record<string, unknown> | null }
interface EntityMetric { entity_id: string; metric: string; period: string | null; value: number | null; unit: string | null; source_type: string | null; source_url: string | null }

const iso = (d: Date) => d.toISOString();
const day = (d: Date) => d.toISOString().slice(0, 10);

async function pull() {
  const now = new Date();

  const [regions, stats, markets, players] = await Promise.all([
    table<Region>('regions', 'select=id,slug,level,parent_id,name_vi,name_ru,name_en,perimeter,lat,lon,area_km2&order=level,slug'),
    table<Stat>('region_stats', 'select=region_id,metric,period,value,unit,source_type,source_url,source_note,fetched_at'),
    table<Market>('markets', 'select=id,region_id,slug,name_ru,players_count,players_source,players_counted_at,size_vnd_year,size_source_type,size_source_url,avg_price_vnd,opportunity_score,opportunity_note&order=slug'),
    table<Player>('market_players', 'select=market_id,name,lat,lon,rating,reviews,source')
  ]);

  // Колонки перечисляем поимённо: у entities есть tsvector search и jsonb
  // attrs, у edges - attrs. Через select=* они утраивали вес выгрузки, а в
  // разделе не показывается ни одна из них.
  const [heartbeats, topics, insights, entities, edges, entityMetrics] = await Promise.all([
    table<Heartbeat>('job_heartbeats', 'select=job,ok,message,last_run_at,last_ok_at&order=job'),
    table<Topic>('media_topics', 'select=region_slug,title_ru,title_vi,angle,audience,score,score_reason,status,created_at&order=created_at.desc&limit=20'),
    table<Insight>('insights', 'select=kind,title_ru,body_ru,score,confidence,status,created_at&order=created_at.desc&limit=20'),
    table<Entity>('entities', 'select=id,slug,kind,name,name_vi,name_ru,region_slug,summary_ru'),
    table<Edge>('edges', 'select=src,dst,relation,weight,weight_unit,source_type,note'),
    table<EntityMetric>('entity_metrics', 'select=entity_id,metric,period,value,unit,source_type,source_url')
  ]);

  // Узлы рынков графа несут то, чего нет в реестре markets: свёрнутые по дереву
  // игроки, плотность разметки OSM и вердикт gap_status. Ноль игроков при
  // плотности 1,1 и ноль при 62 это разные нули, и без вердикта первый читается
  // как возможность. Берём только эти узлы и только колонку attrs.
  const entityName = new Map(
    entities.map((e) => [e.id, e.name_ru || e.name || e.name_vi || e.slug] as const)
  );

  const marketNodes = await table<MarketNode>(
    'entities',
    'select=id,slug,name,name_ru,region_slug,attrs&kind=eq.market'
  );
  const nodeBySlug = new Map(marketNodes.map((n) => [n.slug, n.attrs ?? {}]));

  // Тринадцать рынков живут только в графе: национальные и отраслевые, где
  // игроки названы поимённо рёбрами operates_market, а не посчитаны по карте.
  // В реестре markets их нет, и счётчика карты у них быть не может.
  const namedEdges = await table<{ src: string; dst: string; note: string | null; source_type: string | null; evidence_url: string | null }>(
    'edges',
    'select=src,dst,note,source_type,evidence_url&relation=eq.operates_market'
  );
  const regionSlugById = new Map(regions.map((r) => [r.id, r.slug]));
  const inRegistry = new Set(
    markets.map((m) => `market:${regionSlugById.get(m.region_id) ?? m.region_id}:${m.slug}`)
  );
  const playersByNode = new Map<string, { name: string; note: string | null; source_type: string | null; evidence_url: string | null }[]>();
  for (const e of namedEdges) {
    const company = entityName.get(e.src);
    if (!company) continue;
    const list = playersByNode.get(e.dst) ?? [];
    list.push({ name: company, note: e.note, source_type: e.source_type, evidence_url: e.evidence_url });
    playersByNode.set(e.dst, list);
  }
  const namedMarkets = marketNodes
    .filter((n) => !inRegistry.has(n.slug) && (playersByNode.get(n.id)?.length ?? 0) > 0)
    .map((n) => ({
      slug: n.slug,
      name_ru: n.name_ru ?? n.name ?? n.slug,
      region_slug: n.region_slug,
      players: (playersByNode.get(n.id) ?? []).sort((a, b) => a.name.localeCompare(b.name))
    }))
    .sort((a, b) => b.players.length - a.players.length);

  // Календарь берём только экономический: государственные праздники и
  // фестивали двигают спрос на рынках. Учебные периоды и расписание школ это
  // личный контекст владельца, он живёт в консоли региона, а не в атласе.
  const events = await table<EventRow>(
    'events',
    `select=title,kind,event_class,starts_at,ends_at,source_url,source_name,evidence_kind&kind=in.(holiday,conference)&or=(starts_at.gte.${iso(now)},ends_at.gte.${iso(now)})&order=starts_at&limit=12`
  );

  // Слаг вместо uuid: генерированный файл читается человеком и джойнится в UI
  // по слагу, а uuid базы наружу не нужен.
  const slugById = new Map(regions.map((r) => [r.id, r.slug]));
  const statRows = stats.map(({ region_id, ...rest }) => ({
    region_slug: slugById.get(region_id) ?? region_id,
    ...rest
  }));
  const playersByMarket = new Map<string, Player[]>();
  for (const p of players) {
    const list = playersByMarket.get(p.market_id) ?? [];
    list.push(p);
    playersByMarket.set(p.market_id, list);
  }
  const num = (v: unknown) => (v === null || v === undefined ? null : Number(v));
  const str = (v: unknown) => (typeof v === 'string' ? v : null);
  const marketRows = markets.map(({ region_id, ...rest }) => {
    const region_slug = slugById.get(region_id) ?? region_id;
    const attrs = nodeBySlug.get(`market:${region_slug}:${rest.slug}`) ?? {};
    return {
    ...rest,
    region_slug,
    gap_status: str(attrs.gap_status),
    gap_score: num(attrs.gap_score),
    players_rolled: num(attrs.players_rolled),
    osm_density_per_10k: num(attrs.osm_density_per_10k),
    // Игроков в файл целиком не кладём: раздел показывает имена первых, а счёт
    // берёт из players_count. Координаты не рисуются вовсе.
    players: (playersByMarket.get(rest.id) ?? [])
      .sort((a, b) => (b.reviews ?? 0) - (a.reviews ?? 0))
      .slice(0, 12)
      .map(({ name, rating, reviews, source }) => ({ name, rating, reviews, source }))
    };
  });

  const entitySlug = new Map(entities.map((e) => [e.id, e.slug]));
  const entityRows = entities.map(({ id, ...rest }) => rest);
  const edgeRows = edges.map(({ src, dst, ...rest }) => ({
    src_slug: entitySlug.get(src) ?? src,
    dst_slug: entitySlug.get(dst) ?? dst,
    ...rest,
    weight: rest.weight === null || rest.weight === undefined ? null : Number(rest.weight)
  }));
  const entityMetricRows = entityMetrics.map(({ entity_id, ...rest }) => ({
    entity_slug: entitySlug.get(entity_id) ?? entity_id,
    ...rest,
    value: num(rest.value)
  }));

  return { regions, statRows, marketRows, namedMarkets, events, heartbeats, topics, insights, entities: entityRows, edges: edgeRows, entityMetrics: entityMetricRows, now };
}

// ─── Запись ───────────────────────────────────────────────────────────────────

const json = (v: unknown) => JSON.stringify(v, null, 2);

function render(d: Awaited<ReturnType<typeof pull>>) {
  const counts = {
    regions: d.regions.length,
    region_stats: d.statRows.length,
    markets: d.marketRows.length,
    market_players_shown: d.marketRows.reduce((s, m) => s + m.players.length, 0),
    market_players_counted: d.marketRows.reduce((s, m) => s + (m.players_count ?? 0), 0),
    events: d.events.length,
    named_markets: d.namedMarkets.length,
    job_heartbeats: d.heartbeats.length,
    media_topics: d.topics.length,
    insights: d.insights.length,
    entities: d.entities.length,
    edges: d.edges.length,
    entity_metrics: d.entityMetrics.length
  };
  return `// СГЕНЕРИРОВАННЫЙ ФАЙЛ. Руками не править: перезапишется.
// Источник: база региона Supabase region-lamdong, таблицы regions, region_stats,
// markets, market_players, events, job_heartbeats, insights, media_topics и
// граф entities/edges/entity_metrics.
// Прогноза потоков и погоды здесь нет: атлас про рынки и экономику, а
// персональный экран владельца живёт в консоли региона.
// Обновить: npm run pull (нужен .env с REGION_SUPABASE_URL и SERVICE_KEY).
// Сборка на Vercel базу не видит и берёт этот файл как есть.
//
// Снято: ${d.now.toISOString()}
// Строк: ${Object.entries(counts).map(([k, v]) => `${k} ${v}`).join(' · ')}
${missing.length ? `// Таблиц ещё нет в базе: ${missing.join(', ')}\n` : ''}
export interface GenRegion { id: string; slug: string; level: string; parent_id: string | null; name_vi: string | null; name_ru: string | null; name_en: string | null; perimeter: string | null; lat: number | null; lon: number | null; area_km2: number | null }
export interface GenStat { region_slug: string; metric: string; period: string | null; value: number | null; unit: string | null; source_type: string | null; source_url: string | null; source_note: string | null; fetched_at: string | null }
export interface GenPlayer { name: string | null; rating: number | null; reviews: number | null; source: string | null }
export interface GenMarket { id: string; region_slug: string; slug: string; name_ru: string | null; players_count: number | null; players_source: string | null; players_counted_at: string | null; gap_status: string | null; gap_score: number | null; players_rolled: number | null; osm_density_per_10k: number | null; size_vnd_year: number | null; size_source_type: string | null; size_source_url: string | null; avg_price_vnd: number | null; opportunity_score: number | null; opportunity_note: string | null; players: GenPlayer[] }
export interface GenNamedPlayer { name: string; note: string | null; source_type: string | null; evidence_url: string | null }
export interface GenNamedMarket { slug: string; name_ru: string; region_slug: string | null; players: GenNamedPlayer[] }
export interface GenEvent { title: string; kind: string | null; event_class: string | null; starts_at: string | null; ends_at: string | null; source_url: string | null; source_name: string | null; evidence_kind: string | null }
export interface GenHeartbeat { job: string; ok: boolean; message: string | null; last_run_at: string | null; last_ok_at: string | null }
export interface GenTopic { region_slug: string | null; title_ru: string | null; title_vi: string | null; angle: string | null; audience: string | null; score: number | null; score_reason: string | null; status: string | null; created_at: string | null }
/** Инсайты и граф ведёт агент region-graph: колонки ещё меняются, поэтому
 *  интерфейсы терпят лишние поля - новая колонка в базе не роняет сборку. */
export interface GenInsight { kind: string | null; title_ru: string | null; body_ru: string | null; score: number | null; confidence: string | null; status: string | null; created_at: string | null }
export interface GenEntity { slug: string; kind: string | null; name: string | null; name_vi: string | null; name_ru: string | null; region_slug: string | null; summary_ru: string | null }
export interface GenEntityMetric { entity_slug: string; metric: string; period: string | null; value: number | null; unit: string | null; source_type: string | null; source_url: string | null }

/** Момент выгрузки. Показывается в разделе: данные ровно этой свежести. */
export const generatedAt = ${json(d.now.toISOString())};

/** Сколько строк пришло из каждой таблицы на момент выгрузки. */
export const generatedCounts = ${json(counts)};

/** Таблицы, которых в базе ещё нет: их блоки в разделе не рисуются. */
export const missingTables: string[] = ${json(missing)};

export const GEN_REGIONS: GenRegion[] = ${json(d.regions)};

export const GEN_STATS: GenStat[] = ${json(d.statRows)};

export const GEN_MARKETS: GenMarket[] = ${json(d.marketRows)};

export const GEN_NAMED_MARKETS: GenNamedMarket[] = ${json(d.namedMarkets)};

export const GEN_EVENTS: GenEvent[] = ${json(d.events)};

export const GEN_HEARTBEATS: GenHeartbeat[] = ${json(d.heartbeats)};

export const GEN_TOPICS: GenTopic[] = ${json(d.topics)};

export const GEN_INSIGHTS: GenInsight[] = ${json(d.insights)};

export const GEN_ENTITIES: GenEntity[] = ${json(d.entities)};

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
      `pull-vietnam: регионов ${d.regions.length} · показателей ${d.statRows.length} · рынков ${d.marketRows.length} · событий ${d.events.length} · пульс ${d.heartbeats.length} · тем ${d.topics.length} · сущностей ${d.entities.length}`
    );
    if (missing.length) console.log(`pull-vietnam: таблиц ещё нет: ${missing.join(', ')}`);
  })
  .catch((e) => {
    console.error(`pull-vietnam: ${e.message}`);
    process.exit(1);
  });
