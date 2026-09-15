// Слой базы региона в разделе «Вьетнам».
//
// Всё в этом файле читается из src/data/vietnam.generated.ts, который пишет
// `npm run pull` из базы region-lamdong (Supabase). Руками эти числа никто не
// вписывает: пустая таблица в базе даёт честно пустой блок, а не выдумку.
// Сборка на Vercel в базу не ходит и берёт закоммиченный файл.

import { useEffect, useMemo, useState } from 'react';
import type { EvidenceKind } from '../types';
import { EvidenceTag } from './Overview';
import Val from '../ui/num';
import { useHashRoute } from '../ui/hashRoute';
import { VND_PER_USD } from '../data/vietnam';
import {
  GEN_ENTITIES,
  GEN_ENTITY_METRICS,
  GEN_EVENTS,
  GEN_HEARTBEATS,
  GEN_INSIGHTS,
  GEN_MARKETS,
  GEN_REGIONS,
  GEN_STATS,
  GEN_TOPICS,
  generatedAt,
  generatedCounts,
  missingTables,
  type GenEntity,
  type GenMarket,
  type GenRegion,
  type GenStat
} from '../data/vietnam.generated';

const fmt1 = (v: number) => v.toFixed(1).replace('.', ',');
const fmtInt = (v: number) => Math.round(v).toLocaleString('ru-RU');

// ─── Словари ──────────────────────────────────────────────────────────────────

const LEVEL_LABEL: Record<string, string> = {
  country: 'страна',
  province: 'провинция',
  district: 'район',
  commune: 'община',
  zone: 'зона'
};
const LEVEL_ORDER = ['country', 'province', 'district', 'commune', 'zone'];

const METRIC_LABEL: Record<string, string> = {
  population: 'Население',
  area_km2: 'Площадь',
  communes_count: 'Единиц низового уровня',
  tourists_total: 'Турпоток всего',
  tourists_intl: 'Иностранные туристы',
  'tourists_intl:china': 'Туристы из Китая',
  'tourists_intl:russia': 'Туристы из России',
  tourist_revenue_vnd: 'Выручка туризма',
  tourist_revenue_accommodation_vnd: 'Из неё размещение',
  travel_agency_revenue_vnd: 'Выручка турагентств',
  accommodation_units: 'Средств размещения',
  accommodation_rooms: 'Номеров',
  employed_total: 'Занятых всего',
  unemployment_rate: 'Безработица',
  avg_income_vnd_month: 'Средний доход в месяц',
  businesses_registered: 'Новых предприятий',
  businesses_registered_capital_vnd: 'Капитал новых предприятий',
  budget_revenue_vnd: 'Доходы бюджета',
  grdp_vnd: 'GRDP в абсолюте',
  grdp_growth_pct: 'Рост GRDP',
  grdp_per_capita_vnd: 'GRDP на душу',
  labour_productivity_vnd: 'Производительность труда',
  gdp_usd: 'ВВП',
  gdp_vnd: 'ВВП в донгах',
  gdp_growth_pct: 'Рост ВВП',
  gdp_per_capita_usd: 'ВВП на душу',
  share_agriculture_pct: 'Доля сельского хозяйства',
  share_industry_pct: 'Доля промышленности',
  share_services_pct: 'Доля услуг',
  growth_agriculture_pct: 'Рост сельского хозяйства',
  growth_industry_pct: 'Рост промышленности',
  growth_services_pct: 'Рост услуг',
  exports_goods_usd: 'Экспорт товаров',
  imports_goods_usd: 'Импорт товаров',
  exports_goods_services_usd: 'Экспорт товаров и услуг',
  imports_goods_services_usd: 'Импорт товаров и услуг',
  exports_foreign_sector_usd: 'Экспорт иностранного сектора',
  trade_balance_usd: 'Сальдо торговли',
  fdi_inflow_usd: 'Приток ПИИ',
  cpi_pct: 'Инфляция',
  retail_turnover_vnd: 'Розничный товарооборот',
  digital_economy_gmv_usd: 'Цифровая экономика, GMV',
  ecommerce_gmv_usd: 'Электронная торговля, GMV',
  it_outsourcing_market_usd: 'Рынок IT-аутсорсинга',
  ai_market_usd: 'Рынок ИИ',
  ai_adoption_any_pct: 'Компании, внедрившие ИИ',
  ai_adoption_production_pct: 'ИИ в промышленной эксплуатации',
  ai_no_inhouse_skills_pct: 'Компании без своих ИИ-навыков',
  silk_export_usd: 'Экспорт шёлка',
  flowers_stems: 'Цветы, стеблей в год',
  flowers_stems_export: 'Цветы на экспорт',
  flowers_export_usd: 'Цветы, выручка экспорта',
  airport_passengers: 'Пассажиров аэропорта',
  airport_closure_cost_vnd: 'Стоимость ремонта аэропорта',
  land_price_state_max_vnd_m2: 'Цена земли, госпрайс за м²',
  land_price_market_avg_vnd_m2: 'Цена земли, рынок за м²',
  rent_apartment_vnd_month: 'Аренда квартиры в месяц',
  grdp_usd: 'ВРП в долларах',
  grdp_per_capita_usd: 'ВРП на душу',
  gni_per_capita_usd: 'ВНД на душу',
  labour_force: 'Рабочая сила',
  employment_ratio_pct: 'Доля занятых в населении',
  unemployment_rate_youth: 'Безработица среди молодёжи',
  population_urban: 'Городское население',
  population_urban_pct: 'Доля городского населения',
  population_growth_pct: 'Прирост населения',
  business_density: 'Плотность бизнеса',
  tourist_revenue_usd: 'Выручка туризма в долларах'
};

// Отрасли занятости приходят семейством employed:<отрасль>_pct.
const SECTOR: Record<string, string> = {
  agriculture: 'сельское хозяйство',
  industry: 'промышленность',
  services: 'услуги',
  construction: 'строительство'
};

// Урожаи приходят семейством crop:<культура>_<единица>: словарь на каждую
// культуру не заводим, разбираем слаг.
const CROP: Record<string, string> = {
  coffee: 'кофе', vegetables: 'овощи', durian: 'дуриан', tea: 'чай',
  dragonfruit: 'драконий фрукт', avocado: 'авокадо', mulberry: 'шелковица'
};

function metricLabel(m: string): string {
  if (METRIC_LABEL[m]) return METRIC_LABEL[m];
  const sector = /^employed:([a-z]+)(_pct)?$/.exec(m);
  if (sector) return `Занятость: ${SECTOR[sector[1]] ?? sector[1]}`;
  if (m.startsWith('employed:')) return `Занятость: ${m.slice(9)}`;
  const crop = /^crop:([a-z]+)_(ha|tons|area_ha)$/.exec(m);
  if (crop) {
    const name = CROP[crop[1]] ?? crop[1];
    return crop[2] === 'tons' ? `Урожай: ${name}` : `Площадь: ${name}`;
  }
  // Незнакомую метрику показываем слагом: соврать переводом хуже, чем показать
  // как она называется в базе.
  return m;
}

// Тип источника в базе и метка доказательства в интерфейсе — один словарь.
// Незнакомое значение показывается как «без источника», а не прячется.
const EVIDENCE_KINDS: EvidenceKind[] = ['official', 'analyst', 'company', 'proxy', 'forecast'];
const asKind = (s: string | null | undefined): EvidenceKind | null =>
  s && (EVIDENCE_KINDS as string[]).includes(s) ? (s as EvidenceKind) : null;

// ─── Разбор строк базы ────────────────────────────────────────────────────────

const REGION_BY_SLUG = new Map(GEN_REGIONS.map((r) => [r.slug, r]));
// В базе зона владельца названа «Дом · Đông Thanh, Nam Ban»: в атласе она
// показывается местом, а не домом. Экономику зоны (29 рынков) при этом не
// выбрасываем: личное тут только имя.
const depersonalize = (name: string) => name.replace(/^Дом\s*·\s*/, '').replace(/^Дом$/, 'Đông Thanh, Nam Ban');
const regionName = (slug: string) => depersonalize(REGION_BY_SLUG.get(slug)?.name_ru ?? slug);

// В таблице entities имя лежит в name, русское резюме в summary_ru: колонки
// name_ru и summary у первой волны строк пустые, поэтому берём что есть.
const str = (v: unknown) => (typeof v === 'string' && v ? v : null);
const entityName = (e: GenEntity) =>
  depersonalize(str(e.name_ru) ?? str(e.name) ?? str(e.name_vi) ?? e.slug);
const entitySummary = (e: GenEntity) => str(e.summary_ru) ?? null;

/** Показатели региона: ключ «слаг|метрика», внутри последний по периоду. */
const STATS_BY_KEY = new Map<string, GenStat[]>();
const STATS_BY_REGION = new Map<string, GenStat[]>();
for (const s of GEN_STATS) {
  const key = `${s.region_slug}|${s.metric}`;
  (STATS_BY_KEY.get(key) ?? STATS_BY_KEY.set(key, []).get(key)!).push(s);
  (STATS_BY_REGION.get(s.region_slug) ?? STATS_BY_REGION.set(s.region_slug, []).get(s.region_slug)!).push(s);
}
const statOf = (slug: string, metric: string): GenStat | undefined => {
  const list = STATS_BY_KEY.get(`${slug}|${metric}`);
  return list?.reduce((a, b) => ((b.period ?? '') > (a.period ?? '') ? b : a));
};

/** Обход пишет ряд по годам: показываем последний год строкой, прошлые подписью.
 *  Иначе одна метрика занимает пять строк и регион читать невозможно. */
function latestPerMetric(rows: GenStat[]): { last: GenStat; history: GenStat[] }[] {
  const byMetric = new Map<string, GenStat[]>();
  for (const r of rows) {
    const list = byMetric.get(r.metric) ?? [];
    list.push(r);
    byMetric.set(r.metric, list);
  }
  return [...byMetric.entries()]
    .map(([metric, list]) => {
      const sorted = list.slice().sort((a, b) => (b.period ?? '').localeCompare(a.period ?? ''));
      return { metric, last: sorted[0], history: sorted.slice(1, 5) };
    })
    .sort((a, b) => metricLabel(a.metric).localeCompare(metricLabel(b.metric)))
    .map(({ last, history }) => ({ last, history }));
}

const SCALES: [number, string][] = [
  [1e12, 'трлн'],
  [1e9, 'млрд'],
  [1e6, 'млн'],
  [1e3, 'тыс.']
];

/** Число с единицей из базы. Крупное сокращается, проценты не трогаем. */
function statText(s: GenStat | undefined): string | null {
  if (!s || s.value === null || s.value === undefined) return null;
  const v = Number(s.value);
  const unit = s.unit ?? '';
  if (unit === 'percent') return `${fmt1(v)} %`;
  const tail =
    unit === 'person' ? 'чел.'
    : unit === 'ton' ? 'т'
    : unit === 'ha' ? 'га'
    : unit === 'km2' ? 'км²'
    : unit === 'unit' ? 'шт.'
    : unit === 'USD' ? '$'
    : unit;
  const scale = SCALES.find(([n]) => Math.abs(v) >= n);
  if (!scale) return `${fmtInt(v)} ${tail}`.trim();
  return `${fmt1(v / scale[0])} ${scale[1]} ${tail}`.trim();
}

/** Донги в доллары по справочному курсу. Только для пересказа величины. */
function vndText(v: number | null | undefined): string | null {
  if (v === null || v === undefined) return null;
  const usd = v / VND_PER_USD;
  const scale = SCALES.find(([n]) => Math.abs(usd) >= n);
  return scale ? `${fmt1(usd / scale[0])} ${scale[1]} $` : `${fmtInt(usd)} $`;
}

/** Дерево регионов сверху вниз: страна, её провинции, их районы и общины. */
function regionTree(): { region: GenRegion; depth: number }[] {
  const byParent = new Map<string | null, GenRegion[]>();
  for (const r of GEN_REGIONS) {
    const list = byParent.get(r.parent_id) ?? [];
    list.push(r);
    byParent.set(r.parent_id, list);
  }
  const ids = new Set(GEN_REGIONS.map((r) => r.id));
  const out: { region: GenRegion; depth: number }[] = [];
  const walk = (parent: string | null, depth: number) => {
    const kids = (byParent.get(parent) ?? []).sort(
      (a, b) =>
        LEVEL_ORDER.indexOf(a.level) - LEVEL_ORDER.indexOf(b.level) ||
        a.slug.localeCompare(b.slug)
    );
    for (const region of kids) {
      out.push({ region, depth });
      walk(region.id, depth + 1);
    }
  };
  walk(null, 0);
  // Сирота (родитель есть, но его строки в выгрузке нет) иначе исчезает молча.
  for (const r of GEN_REGIONS) if (r.parent_id && !ids.has(r.parent_id)) out.push({ region: r, depth: 0 });
  return out;
}
const TREE = regionTree();

// ─── Поиск по домену ──────────────────────────────────────────────────────────

interface Hit {
  kind: 'region' | 'market' | 'entity' | 'metric';
  label: string;
  sub: string;
  level: string | null;
  href: string;
}

// Индекс строится один раз на модуле: выгрузка неизменна за жизнь страницы.
// У показателя уровня нет — он встречается на разных, поэтому при выбранном
// масштабе показатели из выдачи уходят.
const SEARCH_INDEX: Hit[] = [
  ...GEN_REGIONS.map((r) => ({
    kind: 'region' as const,
    label: depersonalize([r.name_ru, r.name_vi, r.name_en].filter(Boolean).join(' · ') || r.slug),
    sub: `${LEVEL_LABEL[r.level] ?? r.level} · ${r.slug}${r.perimeter ? ` · ${r.perimeter}` : ''}`,
    level: r.level,
    href: `#/vietnam/region/${r.slug}`
  })),
  ...GEN_MARKETS.map((m) => ({
    kind: 'market' as const,
    label: m.name_ru ?? m.slug,
    sub: `рынок · ${regionName(m.region_slug)}${m.players_count ? ` · игроков ${m.players_count}` : ''}`,
    level: REGION_BY_SLUG.get(m.region_slug)?.level ?? null,
    href: `#/vietnam/market/${m.region_slug}/${m.slug}`
  })),
  // Граф зеркалит регионы и рынки отдельными сущностями: в индексе они дали бы
  // два попадания на один и тот же объект. Индексируем только то, чего в других
  // таблицах выгрузки нет.
  ...GEN_ENTITIES.filter((e) => e.kind !== 'market' && e.kind !== 'region').map((e) => ({
    kind: 'entity' as const,
    label: entityName(e),
    sub: `сущность${e.kind ? ` · ${e.kind}` : ''}${e.region_slug ? ` · ${regionName(e.region_slug)}` : ''}`,
    level: e.region_slug ? REGION_BY_SLUG.get(e.region_slug)?.level ?? null : null,
    href: `#/vietnam/entity/${e.slug}`
  })),
  ...[...new Set(GEN_STATS.map((s) => s.metric))].map((m) => ({
    kind: 'metric' as const,
    label: metricLabel(m),
    sub: `показатель · ${m} · регионов ${new Set(GEN_STATS.filter((s) => s.metric === m).map((s) => s.region_slug)).size}`,
    level: null,
    href: `#/vietnam/section/regions`
  }))
];

/** Якоря блоков раздела. Тот же список назван агенту region-brief и в README. */
const SECTION_IDS = [
  'search', 'calendar', 'regions', 'employment', 'markets', 'opportunity', 'entities', 'sweeps'
];

const HIT_LABEL: Record<Hit['kind'], string> = {
  region: 'регион',
  market: 'рынок',
  entity: 'сущность',
  metric: 'показатель'
};

// ─── Мелкие куски разметки ────────────────────────────────────────────────────

function StatSource({ s }: { s: GenStat | undefined }) {
  if (!s) return null;
  return (
    <span className="stat-note">
      <EvidenceTag kind={asKind(s.source_type)} />{' '}
      {s.source_url ? (
        <a href={s.source_url} target="_blank" rel="noreferrer">
          {s.period ?? 'без периода'}
        </a>
      ) : (
        <span>{s.period ?? 'без периода'}</span>
      )}
      {s.source_note ? ` · ${s.source_note}` : ''}
    </span>
  );
}

/** Блок, которого база ещё не наполнила. Молчать про дыру нельзя. */
function Gap({ what, why }: { what: string; why: string }) {
  return (
    <div className="empty">
      <span className="empty-title">{what}</span>
      <span>{why}</span>
    </div>
  );
}

const dayRu = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' }) : '';

// ─── Раздел ───────────────────────────────────────────────────────────────────

export default function VietnamDb() {
  const route = useHashRoute();
  const [query, setQuery] = useState('');
  const [level, setLevel] = useState<string>('all');
  const [openRegion, setOpenRegion] = useState<string | null>(null);
  const [openMarket, setOpenMarket] = useState<string | null>(null);
  const [allRegions, setAllRegions] = useState(false);

  // Маршрут раскрывает нужную строку и прокручивает к её блоку.
  useEffect(() => {
    if (!route || route.domain !== 'vietnam') return;
    const anchor =
      route.kind === 'region' ? `vn-region-${route.a}`
      : route.kind === 'market' ? 'vn-markets'
      : route.kind === 'entity' ? 'vn-entities'
      : `vn-${route.a}`;
    if (route.kind === 'region') setOpenRegion(route.a);
    if (route.kind === 'market') setOpenMarket(`${route.a}/${route.b}`);
    // Строка региона появляется только после setOpenRegion, поэтому прокрутка
    // идёт следующим кадром; запасной якорь - начало блока.
    requestAnimationFrame(() => {
      (document.getElementById(anchor) ?? document.getElementById('vn-regions'))
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }, [route]);

  // Блоки раздела: список нужен и для проверки ссылки на секцию.
  // Прогноза потоков и погоды здесь нет намеренно: атлас про рынки и
  // экономику, персональный экран владельца живёт в консоли региона.
  // Ссылка ведёт в никуда — говорим об этом, а не показываем пустой экран.
  const lostRoute =
    route && route.domain === 'vietnam'
      ? route.kind === 'region' && !REGION_BY_SLUG.has(route.a) ? `региона «${route.a}» в выгрузке нет`
        : route.kind === 'market' && !GEN_MARKETS.some((m) => m.region_slug === route.a && m.slug === route.b) ? `рынка «${route.b}» в регионе «${route.a}» в выгрузке нет`
        : route.kind === 'entity' && !GEN_ENTITIES.some((e) => e.slug === route.a) ? `сущности «${route.a}» в выгрузке нет`
        : route.kind === 'section' && !SECTION_IDS.includes(route.a) ? `блока «${route.a}» в разделе нет; блоки: ${SECTION_IDS.join(', ')}`
        : null
      : null;

  const hits = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    return SEARCH_INDEX.filter(
      (h) =>
        (level === 'all' || h.level === level) &&
        (h.label.toLowerCase().includes(q) || h.sub.toLowerCase().includes(q))
    ).slice(0, 24);
  }, [query, level]);

  // Занятость: всё, что база знает про труд, по регионам.
  const employmentRows = useMemo(() => {
    const slugs = [...new Set(GEN_STATS.filter((s) => s.metric.startsWith('employed') || s.metric === 'unemployment_rate' || s.metric === 'avg_income_vnd_month').map((s) => s.region_slug))];
    return slugs.map((slug) => {
      // Ряд по годам сворачиваем как в дереве регионов: столбик показывает
      // последний год, прошлые уходят подписью.
      const sectors = latestPerMetric(
        (STATS_BY_REGION.get(slug) ?? []).filter((s) => s.metric.startsWith('employed:'))
      );
      const max = Math.max(...sectors.map((s) => Number(s.last.value ?? 0)), 1);
      return {
        slug,
        total: statOf(slug, 'employed_total') ?? statOf(slug, 'labour_force'),
        unemployment: statOf(slug, 'unemployment_rate'),
        income: statOf(slug, 'avg_income_vnd_month'),
        sectors: sectors
          .sort((a, b) => Number(b.last.value ?? 0) - Number(a.last.value ?? 0))
          .map(({ last, history }) => ({ stat: last, history, share: Number(last.value ?? 0) / max }))
      };
    });
  }, []);

  // В базе 238 регионов: 97 провинций страны и 125 общин объединённой Lâm Đồng.
  // Вывалить всё значит утопить то, ради чего раздел и сделан. По умолчанию
  // показываем страну, обе Lâm Đồng, её районы, зоны владельца, всё, где есть
  // рынки, и регион, на который ведёт ссылка. Полный список за переключателем.
  const visibleTree = useMemo(() => {
    if (allRegions) return TREE;
    const withMarkets = new Set(GEN_MARKETS.map((m) => m.region_slug));
    return TREE.filter(
      ({ region }) =>
        region.level === 'country' ||
        region.level === 'zone' ||
        region.slug === 'vn-lamdong' ||
        region.slug === 'vn-lamdong-pre2025' ||
        (region.level === 'district' && region.slug.startsWith('vn-lamdong')) ||
        withMarkets.has(region.slug) ||
        region.slug === openRegion
    );
  }, [allRegions, openRegion]);

  const marketsByRegion = useMemo(() => {
    const byRegion = new Map<string, GenMarket[]>();
    for (const m of GEN_MARKETS) {
      const list = byRegion.get(m.region_slug) ?? [];
      list.push(m);
      byRegion.set(m.region_slug, list);
    }
    // Зоны по числу посчитанных точек: сверху та, где рынок живой, а не та,
    // чьё имя раньше по алфавиту. Внутри зоны так же.
    const players = (list: GenMarket[]) => list.reduce((n, m) => n + (m.players_count ?? 0), 0);
    for (const [, list] of byRegion) list.sort((a, b) => (b.players_count ?? 0) - (a.players_count ?? 0));
    return [...byRegion.entries()].sort((a, b) => players(b[1]) - players(a[1]));
  }, []);

  const opportunities = useMemo(
    () =>
      GEN_MARKETS.filter((m) => m.opportunity_score !== null && m.opportunity_score !== undefined)
        .sort((a, b) => Number(b.opportunity_score) - Number(a.opportunity_score))
        .slice(0, 12),
    []
  );
  // Шкала оценки в базе не закреплена: нормируем по максимуму выгрузки.
  const maxScore = Math.max(...opportunities.map((m) => Number(m.opportunity_score)), 1);

  return (
    <>
      <div className="hair" />

      <div className="section-head">
        <div className="kicker">Из базы региона</div>
        <h2 className="section-title">Живой слой: данные, а не вёрстка</h2>
        <p className="section-lead">
          Всё ниже приходит из базы региона Lâm Đồng и обновляется командой{' '}
          <span className="code">npm run pull</span>. Снято{' '}
          {new Date(generatedAt).toLocaleString('ru-RU')}. Пустая таблица в базе даёт пустой блок:
          выдуманных чисел здесь нет.
        </p>
      </div>

      {lostRoute && (
        <div className="note note--warn">
          <div className="kicker">По ссылке ничего не нашлось</div>
          <p className="section-lead">{lostRoute}. Раздел открыт целиком.</p>
        </div>
      )}

      {/* ── Поиск ─────────────────────────────────────────────────────────── */}
      <div id="vn-search" className="section-head">
        <h2 className="section-title">Поиск по домену</h2>
        <p className="section-lead">
          Регионы, рынки, сущности и показатели из выгрузки. Индекс строится на клиенте, запросов
          в сеть нет. Фильтр масштаба показатели прячет: один показатель живёт сразу на нескольких
          уровнях.
        </p>
      </div>
      <div className="toolbar">
        <div className="field">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Nam Ban, массаж, население"
            aria-label="Поиск по домену Вьетнам"
          />
        </div>
        <div className="seg" role="group" aria-label="Масштаб">
          {[{ key: 'all', label: 'Все' }, ...LEVEL_ORDER.map((l) => ({ key: l, label: LEVEL_LABEL[l] }))].map((l) => (
            <button
              key={l.key}
              className="seg-btn"
              aria-pressed={level === l.key}
              onClick={() => setLevel(l.key)}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>
      {query.trim().length >= 2 && (
        <div className="list">
          {hits.length === 0 && (
            <div className="list-row">
              <span className="list-main">Ничего не нашлось. В выгрузке {SEARCH_INDEX.length} записей.</span>
            </div>
          )}
          {hits.map((h) => (
            <a key={h.href + h.label} className="list-row" href={h.href}>
              <span className="list-main">
                <span>{h.label}</span>
                <span className="tag">{HIT_LABEL[h.kind]}</span>
                <span className="stat-note">{h.sub}</span>
              </span>
            </a>
          ))}
        </div>
      )}

      <div className="hair" />

      {/* ── Календарь рынка ────────────────────────────────────────────── */}
      {GEN_EVENTS.length > 0 && (
        <>
          <div id="vn-calendar" className="section-head">
            <h2 className="section-title">Календарь: что двигает спрос</h2>
            <p className="section-lead">
              Государственные праздники и фестивали из календаря региона. Это сезонность рынков:
              в эти дни спрос на размещение, еду и услуги идёт не как в будни.
            </p>
          </div>
          <div className="list">
            {GEN_EVENTS.map((e) => (
              <div className="list-row" key={e.title + (e.starts_at ?? '')}>
                <span className="list-main">
                  <span>{e.title}</span>
                  <span className="tag">{e.event_class ?? e.kind ?? 'событие'}</span>
                </span>
                <span className="list-side num">{dayRu(e.starts_at)}</span>
              </div>
            ))}
          </div>

          <div className="hair" />
        </>
      )}

      {/* ── Регионы ───────────────────────────────────────────────────────── */}
      <div id="vn-regions" className="section-head">
        <h2 className="section-title">Регионы: население и туристы</h2>
        <p className="section-lead">
          Дерево от страны к зонам владельца. Числа периметров не складываются между собой: строка
          провинции и строки её районов считаны разными службами и в разных границах. Клик по
          строке раскрывает все показатели региона со ссылками на источники.
        </p>
      </div>
      <div className="toolbar">
        <div className="seg" role="group" aria-label="Охват списка регионов">
          <button className="seg-btn" aria-pressed={!allRegions} onClick={() => setAllRegions(false)}>
            Lâm Đồng, районы и зоны
          </button>
          <button className="seg-btn" aria-pressed={allRegions} onClick={() => setAllRegions(true)}>
            Все регионы · {TREE.length}
          </button>
        </div>
      </div>
      {TREE.length === 0 ? (
        <Gap
          what="Регионов в выгрузке нет"
          why="Таблица regions базы региона пуста или не выгружена. Запусти npm run pull с ключами в .env."
        />
      ) : (
        <div className="list">
          {visibleTree.map(({ region, depth }) => {
            const open = openRegion === region.slug;
            const stats = STATS_BY_REGION.get(region.slug) ?? [];
            return (
              <div key={region.id} id={`vn-region-${region.slug}`}>
                <button
                  className="list-row"
                  aria-current={open ? 'true' : undefined}
                  aria-expanded={open}
                  onClick={() => setOpenRegion(open ? null : region.slug)}
                >
                  <span className="list-main" style={{ paddingLeft: depth * 16 }}>
                    <span>{depersonalize(region.name_ru ?? region.name_vi ?? region.slug)}</span>
                    <span className="tag">{LEVEL_LABEL[region.level] ?? region.level}</span>
                    {region.perimeter && <span className="tag tag--muted">{region.perimeter}</span>}
                    <span className="stat-note">
                      {region.slug}
                      {stats.length ? ` · показателей ${stats.length}` : ' · показателей нет'}
                    </span>
                  </span>
                  <span className="list-side">
                    {statText(statOf(region.slug, 'population')) ?? ''}
                  </span>
                </button>
                {open && (
                  <div className="list">
                    {stats.length === 0 && (
                      <div className="list-row">
                        <span className="list-main">
                          У этого региона в базе нет ни одного показателя.
                        </span>
                      </div>
                    )}
                    {latestPerMetric(stats).map(({ last, history }) => (
                      <div className="list-row" key={last.metric}>
                        <span className="list-main" style={{ paddingLeft: (depth + 1) * 16 }}>
                          <span>{metricLabel(last.metric)}</span>
                          <StatSource s={last} />
                          {history.length > 0 && (
                            <span className="stat-note">
                              раньше: {history.map((h) => `${h.period} ${statText(h)}`).join(' · ')}
                            </span>
                          )}
                        </span>
                        <span className="list-side">
                          <Val value={statText(last) ?? '—'} />
                          {last.unit === 'VND' && last.value ? (
                            <span className="stat-note">{vndText(Number(last.value))}</span>
                          ) : null}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="hair" />

      {/* ── Занятость ─────────────────────────────────────────────────────── */}
      <div id="vn-employment" className="section-head">
        <h2 className="section-title">Занятость по отраслям и безработица</h2>
        <p className="section-lead">
          Столбик показывает долю отрасли от самой крупной в регионе, а не от всех занятых:
          отраслевые ряды в источниках неполные и до целого не дополняются.
        </p>
      </div>
      {employmentRows.length === 0 ? (
        <Gap
          what="Занятости и безработицы в базе пока нет"
          why="Метрик employed_total, employed:<отрасль>, unemployment_rate и avg_income_vnd_month нет ни у одного региона. Разведка 14.09.2026 этих чисел не нашла ни по стране, ни по провинции: их собирает следующий обход региона."
        />
      ) : (
        employmentRows.map((r) => (
          <div key={r.slug} className="stack">
            <div className="row row--between">
              <span className="h2">{regionName(r.slug)}</span>
              <span className="row row--wrap">
                {r.total && <Val className="stat-num--s" value={statText(r.total) ?? ''} />}
                {r.unemployment && (
                  <span className="tag tag--warn">
                    безработица {statText(r.unemployment)}
                  </span>
                )}
                {r.income && <span className="tag">доход {statText(r.income)}</span>}
              </span>
            </div>
            <div className="list">
              {r.sectors.map(({ stat, history, share }) => (
                <div className="list-row" key={stat.metric}>
                  <span className="list-main">
                    <span>{metricLabel(stat.metric)}</span>
                    <span className="bar">
                      <span className="bar-fill" style={{ width: `${Math.round(share * 100)}%` }} />
                    </span>
                    <StatSource s={stat} />
                    {history.length > 0 && (
                      <span className="stat-note">
                        раньше: {history.map((h) => `${h.period} ${statText(h)}`).join(' · ')}
                      </span>
                    )}
                  </span>
                  <Val className="list-side" value={statText(stat) ?? '—'} />
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      <div className="hair" />

      {/* ── Рынки ─────────────────────────────────────────────────────────── */}
      <div id="vn-markets" className="section-head">
        <h2 className="section-title">Рынки по зонам</h2>
        <p className="section-lead">
          Массаж, спа, отели, кофейни и прочее, что считается поимённо. Число игроков это перепись
          точек на карте, а не реестр юрлиц: метка у строки говорит, чем подкреплён размер рынка.
        </p>
      </div>
      {marketsByRegion.length === 0 ? (
        <Gap
          what="Рынков в базе пока нет"
          why="Таблица markets создана миграцией 0002, но строк в ней нет. Массаж, спа и остальные категории собирает обход рынков: как только он отработает, таблица ниже появится сама, без правки кода."
        />
      ) : (
        marketsByRegion.map(([slug, list]) => (
          <div key={slug} className="stack">
            <div className="row row--between">
              <span className="h2">{regionName(slug)}</span>
              <span className="meta">{LEVEL_LABEL[REGION_BY_SLUG.get(slug)?.level ?? ''] ?? ''}</span>
            </div>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th scope="col">Рынок</th>
                    <th scope="col" className="num">Игроков</th>
                    <th scope="col" className="num">Средний чек</th>
                    <th scope="col" className="num">Размер в год</th>
                    <th scope="col">Чем подкреплено</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((m) => {
                    const key = `${m.region_slug}/${m.slug}`;
                    const open = openMarket === key;
                    return (
                      <tr key={m.id} aria-current={open ? 'true' : undefined}>
                        <td>
                          <button className="link" onClick={() => setOpenMarket(open ? null : key)}>
                            {m.name_ru ?? m.slug}
                          </button>
                          {open && m.players.length > 0 && (
                            <span className="stat-note">
                              {m.players.map((p) => p.name).filter(Boolean).slice(0, 12).join(' · ') ||
                                `${m.players.length} точек на карте, ни одна не подписана именем`}
                            </span>
                          )}
                        </td>
                        <td className="num">{m.players_count ?? '—'}</td>
                        <td className="num">
                          {m.avg_price_vnd ? <Val value={fmtInt(m.avg_price_vnd)} unit="VND" /> : '—'}
                        </td>
                        <td className="num">
                          {m.size_vnd_year ? (
                            <Val value={statText({ value: m.size_vnd_year, unit: 'VND' } as GenStat) ?? ''} />
                          ) : '—'}
                        </td>
                        <td>
                          {/* Размер рынка и перепись точек это разные вещи:
                              метку размера ставим, только когда размер есть. */}
                          {m.size_vnd_year !== null && m.size_vnd_year !== undefined && (
                            <>
                              <EvidenceTag kind={asKind(m.size_source_type)} />{' '}
                            </>
                          )}
                          {m.players_source ? (
                            <>
                              <EvidenceTag kind="proxy" /> перепись точек · {m.players_source}
                            </>
                          ) : (
                            'размера нет, только счёт точек'
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}

      <div className="hair" />

      {/* ── Возможности ───────────────────────────────────────────────────── */}
      <div id="vn-opportunity" className="section-head">
        <h2 className="section-title">Возможности по зонам</h2>
        <p className="section-lead">
          Оценка возможности считается обходом рынков и живёт в базе строкой. Это не прогноз выручки,
          а порядок «где меньше всего занято при том же спросе».
        </p>
      </div>
      {opportunities.length === 0 ? (
        <Gap
          what="Оценок возможности в базе пока нет"
          why="Колонки opportunity_score и opportunity_note таблицы markets пусты. Они заполняются вместе с рынками."
        />
      ) : (
        <div className="list">
          {opportunities.map((m) => (
            <a className="list-row" key={m.id} href={`#/vietnam/market/${m.region_slug}/${m.slug}`}>
              <span className="list-main">
                <span>{m.name_ru ?? m.slug}</span>
                <span className="meta"> · {regionName(m.region_slug)}</span>
                <span className="bar bar--tall">
                  <span
                    className="bar-fill"
                    style={{ width: `${Math.round((Number(m.opportunity_score) / maxScore) * 100)}%` }}
                  />
                </span>
                {m.opportunity_note && <span className="stat-note">{m.opportunity_note}</span>}
              </span>
              <Val className="list-side" value={String(m.opportunity_score)} />
            </a>
          ))}
        </div>
      )}

      <div className="hair" />

      {/* ── Граф сущностей ────────────────────────────────────────────────── */}
      <div id="vn-entities" className="section-head">
        <h2 className="section-title">Сущности региона</h2>
        <p className="section-lead">
          Граф из таблиц entities, edges и entity_metrics. Зеркала регионов и рынков здесь не
          показываются: они уже есть блоками выше. Связей в графе {generatedCounts.edges}.
        </p>
      </div>
      {GEN_ENTITIES.length === 0 ? (
        <Gap
          what="Графа сущностей в выгрузке нет"
          why={`Таблиц ${['entities', 'edges', 'entity_metrics'].filter((t) => missingTables.includes(t)).join(', ') || 'entities, edges, entity_metrics'} в базе ещё нет: их заводит миграция 0004. Маршрут #/vietnam/entity/<slug> уже работает и честно говорит, что сущности нет.`}
        />
      ) : (
        <div className="list">
          {GEN_ENTITIES.filter((e) => e.kind !== 'market' && e.kind !== 'region')
            .slice(0, 40)
            .map((e) => (
            <div className="list-row" key={e.slug}>
              <span className="list-main">
                <span>{entityName(e)}</span>
                {e.kind && <span className="tag">{e.kind}</span>}
                {e.region_slug && <span className="meta"> · {regionName(e.region_slug)}</span>}
                {entitySummary(e) && <span className="stat-note">{entitySummary(e)}</span>}
              </span>
              <span className="list-side num">
                {GEN_ENTITY_METRICS.filter((m) => m.entity_slug === e.slug).length}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="hair" />

      {/* ── Результаты обходов ────────────────────────────────────────────── */}
      <div id="vn-sweeps" className="section-head">
        <h2 className="section-title">Результаты обходов</h2>
        <p className="section-lead">
          Пульс кроновых обходов региона на момент выгрузки. Красная строка значит, что числа выше
          устарели именно в этой части, и это видно до того, как кто-то поверит цифре.
        </p>
      </div>
      {GEN_HEARTBEATS.length === 0 ? (
        <Gap what="Пульса обходов в выгрузке нет" why="Таблица job_heartbeats пуста или не выгружена." />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Обход</th>
                <th scope="col">Итог</th>
                <th scope="col">Последний запуск</th>
                <th scope="col">Последний успех</th>
              </tr>
            </thead>
            <tbody>
              {GEN_HEARTBEATS.map((h) => (
                <tr key={h.job}>
                  <td>{h.job}</td>
                  <td>
                    <span className={h.ok ? 'tag tag--up' : 'tag tag--down'}>
                      {h.ok ? 'успех' : 'отказ'}
                    </span>
                    {h.message ? ` ${h.message}` : ''}
                  </td>
                  <td>{h.last_run_at ? new Date(h.last_run_at).toLocaleString('ru-RU') : '—'}</td>
                  <td>{h.last_ok_at ? new Date(h.last_ok_at).toLocaleString('ru-RU') : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(GEN_TOPICS.length > 0 || GEN_INSIGHTS.length > 0) && (
        <div className="list">
          {GEN_INSIGHTS.map((i, n) => (
            <div className="list-row" key={`ins-${n}`}>
              <span className="list-main">
                <span>{i.title_ru ?? 'без заголовка'}</span>
                <span className="tag">{i.kind ?? 'вывод'}</span>
                {i.body_ru && <span className="stat-note">{i.body_ru}</span>}
              </span>
              <span className="list-side num">{i.score ?? ''}</span>
            </div>
          ))}
          {GEN_TOPICS.map((t, n) => (
            <div className="list-row" key={`top-${n}`}>
              <span className="list-main">
                <span>{t.title_ru ?? t.title_vi ?? 'без заголовка'}</span>
                <span className="tag">тема</span>
                {t.region_slug && <span className="meta"> · {regionName(t.region_slug)}</span>}
                {t.score_reason && <span className="stat-note">{t.score_reason}</span>}
              </span>
              <span className="list-side num">{t.score ?? ''}</span>
            </div>
          ))}
        </div>
      )}

      <div className="note">
        <div className="kicker">Откуда эти блоки и как их обновить</div>
        <p className="section-lead">
          База региона Lâm Đồng, Supabase. Выгрузка снята{' '}
          {new Date(generatedAt).toLocaleString('ru-RU')} командой{' '}
          <span className="code">npm run pull</span>, результат лежит в{' '}
          <span className="code">src/data/vietnam.generated.ts</span> и коммитится: сборка на
          Vercel в базу не ходит.
        </p>
        <div className="list">
          {Object.entries(generatedCounts).map(([table, count]) => (
            <div className="list-row" key={table}>
              <span className="list-main">
                <span className="code">{table}</span>
                {missingTables.includes(table) && <span className="tag tag--warn">таблицы ещё нет</span>}
              </span>
              <Val className="list-side" value={String(count)} unit="строк" />
            </div>
          ))}
          <div className="list-row">
            <span className="list-main">
              <span className="code">edges</span>
              <span className="stat-note">связи графа: в выгрузку не кладутся, только счёт</span>
            </span>
            <Val className="list-side" value={String(generatedCounts.edges)} unit="строк" />
          </div>
        </div>
      </div>
    </>
  );
}
