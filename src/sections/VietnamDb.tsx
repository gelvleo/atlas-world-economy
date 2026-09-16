// Слой базы региона в разделе «Вьетнам».
//
// Всё в этом файле читается из src/data/vietnam.generated.ts, который пишет
// `npm run pull` из базы region-lamdong (Supabase). Руками эти числа никто не
// вписывает: пустая таблица в базе даёт честно пустой блок, а не выдумку.
// `npm run build` перед сборкой выполняет `pull`; только сценарий
// `build:local` гарантирует проверку и сборку по этому снимку без запроса к базе.

import { useEffect, useMemo, useState } from 'react';
import type { EvidenceKind } from '../types';
import { EvidenceTag } from './Overview';
import Val from '../ui/num';
import { useHashRoute } from '../ui/hashRoute';
import { ComparableTrend } from '../ui/ComparableTrend';
import { selectComparableSeries } from '../ui/vietnamSelectors';
import { VND_PER_USD } from '../data/vietnam';
import { Bars, Shares, Sparkline, Trend, type Point } from '../ui/charts';
import VietnamGraph from './VietnamGraph';
import VietnamTimeline from './VietnamTimeline';
import {
  GEN_ENTITIES,
  GEN_ENTITY_METRICS,
  GEN_EVENTS,
  GEN_HEARTBEATS,
  GEN_INSIGHTS,
  GEN_MARKETS,
  GEN_NAMED_MARKETS,
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
  tourist_revenue_usd: 'Выручка туризма в долларах',
  tourists_growth_pct: 'Рост турпотока',
  tourists_intl_growth_pct: 'Рост потока иностранцев',
  tourist_spend_per_visit_vnd: 'Средний чек визита',
  // Гео-слой: считается по снимкам и моделям расселения, не по переписи.
  // Все эти строки приходят с типом «оценка», и метка в интерфейсе это покажет.
  population_hrsl: 'Население по снимкам',
  buildings_count: 'Строений на снимках',
  persons_per_building: 'Человек на строение',
  landcover_builtup_share: 'Доля застройки',
  landcover_cropland_share: 'Доля пашни',
  landcover_tree_share: 'Доля леса',
  isochrone_15min_population: 'Людей в 15 минутах езды',
  isochrone_30min_population: 'Людей в 30 минутах езды',
  isochrone_60min_population: 'Людей в часе езды',
  mobility_home_share: 'Доля остающихся дома',
  mobility_0_10km_share: 'Поездки до 10 км',
  mobility_10_100km_share: 'Поездки 10-100 км',
  mobility_100plus_share: 'Поездки свыше 100 км',
  // Госстатистика PxWeb: ряды по годам, ради которых в карточке региона
  // появились графики. Слаг на экране читался как «businesses_active».
  population_density: 'Плотность населения',
  iip_index: 'Индекс промышленного производства',
  iip_yoy_pct: 'Промышленность к прошлому году',
  employed_enterprises: 'Занятых на предприятиях',
  businesses_active: 'Действующих предприятий',
  businesses_registered_year: 'Зарегистрировано предприятий за год',
  businesses_registered_month: 'Зарегистрировано предприятий за месяц',
  businesses_resumed_month: 'Возобновили работу за месяц',
  businesses_suspended_month: 'Приостановили работу за месяц',
  businesses_dissolved_month: 'Закрылись за месяц',
  cpi_avg_ytd_yoy_pct: 'Инфляция с начала года',
  retail_turnover_month: 'Розничный товарооборот за месяц',
  tourism_revenue_month: 'Выручка туризма за месяц',
  tourism_revenue_vnd: 'Выручка туризма',
  budget_revenue_month: 'Доходы бюджета за месяц',
  tourists_month: 'Турпоток за месяц',
  tourists_intl_month: 'Иностранные туристы за месяц',
  tourists: 'Туристы',
  // Слой спроса: цены, зарплаты и вакансии, собранные обходом объявлений.
  land_ask_median_vnd_m2: 'Земля, медианная цена запроса за м²',
  land_listings_count: 'Объявлений о продаже земли',
  rent_ask_median_vnd: 'Аренда, медиана запроса',
  rent_ask_1br_expat_usd: 'Аренда однушки для экспата',
  airbnb_median_usd: 'Медиана суток на Airbnb',
  salary_median_vnd: 'Медианная зарплата',
  income_per_capita_vnd: 'Доход на душу',
  poverty_rate_pct: 'Доля бедности',
  salary_hotel_staff_min_vnd: 'Зарплата в отеле, нижняя',
  salary_hotel_staff_max_vnd: 'Зарплата в отеле, верхняя',
  salary_waiter_vnd: 'Зарплата официанта',
  salary_tour_driver_vnd: 'Зарплата водителя экскурсий',
  salary_truck_driver_vnd: 'Зарплата водителя грузовика',
  job_postings_count: 'Вакансий всего',
  cost_of_living_nomad_usd: 'Стоимость жизни, удалёнщик',
  cost_of_living_local_usd: 'Стоимость жизни, местный',
  remote_workers_count: 'Удалённых работников',
  internet_speed_mbps: 'Скорость интернета',
  english_course_price_vnd_hour: 'Час английского',
  fnb_revenue_vnd: 'Выручка еды и напитков',
  accommodation_revenue_vnd: 'Выручка размещения',
  food_delivery_gmv_usd: 'Доставка еды, GMV',
  ecommerce_gmv_vnd: 'Электронная торговля, GMV',
  visa_fine_min_vnd: 'Штраф за просроченную визу'
};

/** Семейства метрик, которые различаются только хвостом слага. Заводить на
 *  каждую отдельную строку словаря незачем: их сорок, и все читаются шаблоном. */
const METRIC_FAMILY: [RegExp, (tail: string) => string][] = [
  [/^job_postings_(.+)$/, (t) => `Вакансии: ${{
    teachers: 'учителя', retail_sales: 'продавцы', finance_sales: 'финансы и продажи',
    horeca: 'кафе и отели', pharma_sales: 'аптеки', construction: 'стройка',
    accounting: 'бухгалтерия'
  }[t] ?? t}`],
  [/^(.+)_points$/, (t) => `Точек на карте: ${{
    coworking: 'коворкинги', language_school: 'языковые школы', spa: 'спа',
    massage: 'массаж', clinic: 'клиники', pharmacy: 'аптеки', beauty: 'красота',
    dental: 'стоматология', clinics: 'клиники', largest_chain: 'крупнейшая сеть'
  }[t] ?? t}`]
];

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
  for (const [re, name] of METRIC_FAMILY) {
    const hit = re.exec(m);
    if (hit) return name(hit[1]);
  }
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

type CompactCatalogView = 'search' | 'regions' | 'markets' | 'national' | 'employment' | 'entities' | 'sweeps';
const COMPACT_VIEWS: { id: CompactCatalogView; label: string }[] = [
  { id: 'search', label: 'Поиск' }, { id: 'regions', label: 'Регионы' }, { id: 'markets', label: 'Рынки по зонам' },
  { id: 'national', label: 'Национальные игроки' }, { id: 'employment', label: 'Занятость' }, { id: 'entities', label: 'Сущности' }, { id: 'sweeps', label: 'Обходы' }
];
const COMPACT_ALIASES: Record<string, CompactCatalogView> = { search: 'search', regions: 'regions', markets: 'markets', national: 'national', employment: 'employment', entities: 'entities', sweeps: 'sweeps', opportunity: 'markets', mobility: 'employment' };

function ResultCount({ shown, total }: { shown: number; total: number }) {
  if (shown >= total) return null;
  return <p className="stat-note">Показано {shown} из {total}; остальные строки доступны через уточнение поиска.</p>;
}

function CompactVietnamDb({ initialScope = 'country' }: { initialScope?: 'lamdong' | 'country' } = {}) {
  const route = useHashRoute();
  const routeView = route?.kind === 'section'
    ? route.a === 'data' ? COMPACT_ALIASES[route.b] ?? 'search' : COMPACT_ALIASES[route.a]
    : undefined;
  const [view, setView] = useState<CompactCatalogView>(routeView ?? (route?.kind === 'entity' ? 'entities' : route?.kind === 'region' || route?.kind === 'market' ? 'regions' : 'search'));
  const [scope, setScope] = useState<'country' | 'local'>(initialScope === 'lamdong' ? 'local' : 'country');
  const [query, setQuery] = useState('');

  useEffect(() => setScope(initialScope === 'lamdong' ? 'local' : 'country'), [initialScope]);
  useEffect(() => {
    if (routeView) setView(routeView);
    else if (route?.kind === 'region' || route?.kind === 'market') setView('regions');
  }, [routeView, route?.kind]);

  const selectedRegion = route?.kind === 'region' ? route.a : null;
  const selectedMarket = route?.kind === 'market' ? `${route.a}/${route.b}` : null;
  const unknownRegion = Boolean(selectedRegion && !REGION_BY_SLUG.has(selectedRegion));
  const unknownMarket = Boolean(selectedMarket && !GEN_MARKETS.some((market) => `${market.region_slug}/${market.slug}` === selectedMarket));
  const hasUnknownSelection = unknownRegion || unknownMarket;
  const q = query.trim().toLowerCase();
  const searchMatches = q.length >= 2
    ? SEARCH_INDEX.filter((hit) => `${hit.label} ${hit.sub}`.toLowerCase().includes(q))
    : [];
  const hits = searchMatches.slice(0, 30);
  const choose = (next: CompactCatalogView) => {
    setView(next);
    window.location.hash = `#/vietnam/section/data/${next}`;
  };

  const localPrefixes = ['vn-lamdong-dalat', 'vn-lamdong-ductrong'];
  const localZoneSlugs = new Set(['zone:dalat-center', 'zone:lienkhuong', 'zone:namban-home']);
  const isLocalDliSlice = (slug: string) => localPrefixes.some((prefix) => slug === prefix || slug.startsWith(`${prefix}-`)) || localZoneSlugs.has(slug);
  const country = GEN_REGIONS.find((region) => region.level === 'country');
  const regionMatches = GEN_REGIONS.filter((region) => {
    const inScope = scope === 'local'
      ? isLocalDliSlice(region.slug)
      : region.slug === country?.slug || (region.level === 'province' && region.perimeter === 'post-2025');
    return inScope && (!q || `${region.name_ru ?? ''} ${region.name_vi ?? ''} ${region.slug}`.toLowerCase().includes(q));
  });
  const regions = regionMatches.slice(0, 80);

  const marketMatches = GEN_MARKETS.filter((market) => !q || `${market.name_ru ?? market.slug} ${market.region_slug}`.toLowerCase().includes(q));
  const marketRows = marketMatches.slice(0, 30);
  const namedNationalMatches = GEN_NAMED_MARKETS.filter((market) => market.region_slug === 'vn' && (!q || `${market.name_ru} ${market.players.map((player) => player.name).join(' ')}`.toLowerCase().includes(q)));
  const nationalRows = namedNationalMatches.slice(0, 30);
  const entityMatches = GEN_ENTITIES.filter((entity) => !q || `${entity.name_ru ?? entity.name ?? entity.slug} ${entity.kind ?? ''}`.toLowerCase().includes(q));
  const entityRows = entityMatches.slice(0, 30);
  const employmentMatches = GEN_STATS.filter((stat) => stat.region_slug === 'vn' && (stat.metric.startsWith('employed') || stat.metric === 'unemployment_rate' || stat.metric === 'employment_ratio_pct') && (!q || `${metricLabel(stat.metric)} ${stat.period ?? ''} ${stat.source_note ?? ''}`.toLowerCase().includes(q)));
  const employmentRows = employmentMatches.slice(0, 80);
  const sweepMatches = GEN_HEARTBEATS.filter((heartbeat) => !q || `${heartbeat.job} ${heartbeat.message ?? ''}`.toLowerCase().includes(q));
  const detailStats = selectedRegion && !unknownRegion
    ? (STATS_BY_REGION.get(selectedRegion) ?? []).slice().sort((a, b) => (b.period ?? '').localeCompare(a.period ?? ''))
    : [];
  const detailMarket = selectedMarket && !unknownMarket
    ? GEN_MARKETS.find((market) => `${market.region_slug}/${market.slug}` === selectedMarket)
    : undefined;
  const regionTrendSeries = selectedRegion && !unknownRegion ? comparableRegionTrends(selectedRegion) : [];
  const employmentTrendSeries = view === 'employment' ? employmentTrends() : [];
  const returnHref = unknownMarket ? '#/vietnam/section/data/markets' : '#/vietnam/section/data/regions';
  const returnLabel = unknownMarket ? 'Вернуться к рынкам' : 'Вернуться к регионам';

  return (
    <div className="vn-compact-catalog">
      <p className="stat-note">Снимок данных: {new Intl.DateTimeFormat('ru-RU', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date(generatedAt))} (Вьетнам)</p>
      <div className="vn-catalog-tabs" role="tablist" aria-label="Категории каталога">
        {COMPACT_VIEWS.map((item) => <button key={item.id} className="btn btn--ghost" role="tab" aria-selected={view === item.id} onClick={() => choose(item.id)}>{item.label}</button>)}
      </div>

      <div className="toolbar">
        {!selectedRegion && !detailMarket && !hasUnknownSelection && <div>
          <input className="field" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Поиск по выбранной категории" aria-label="Поиск в каталоге" />
        </div>}
        {view === 'regions' && !selectedRegion && <div className="seg" role="group" aria-label="Охват каталога">
          <button className="seg-btn" aria-pressed={scope === 'country'} onClick={() => setScope('country')}>Вся страна</button>
          <button className="seg-btn" aria-pressed={scope === 'local'} onClick={() => setScope('local')}>Срез DLI: Далат и Льенкыонг</button>
        </div>}
      </div>

      {hasUnknownSelection && <div className="empty" role="status">
        <span className="empty-title">Объект не найден</span>
        <span>{unknownRegion ? `Регион «${selectedRegion}» отсутствует в текущей выгрузке.` : `Рынок «${selectedMarket?.split('/')[1]}» отсутствует в текущей выгрузке.`}</span>
        <a href={returnHref}>{returnLabel}</a>
      </div>}

      {!hasUnknownSelection && selectedRegion && <div className="note">
        <div className="kicker">Выбранный регион</div>
        <h2 className="h2">{regionName(selectedRegion)}</h2>
        <p className="stat-note">Строки относятся к этой территории. Старые и новые границы не складываются.</p>
        <p><a href="#/vietnam/section/data/regions">Вернуться к каталогу регионов</a></p>
        {regionTrendSeries.length > 0 ? (
          <div className="grid grid--2">
            {regionTrendSeries.map(({ metric, series }) => (
              <ComparableTrend
                key={metric}
                series={series}
                title={metricLabel(metric)}
                note="Годовой ряд"
                unit={unitRu(series.unit)}
              />
            ))}
          </div>
        ) : (
          <p className="section-lead">Для графика нужны минимум три сопоставимых годовых наблюдения. Доступные числа — ниже.</p>
        )}
        <div className="list">
          {detailStats.map((stat, index) => {
            const conflict = detailStats.some((other, otherIndex) => otherIndex !== index && other.metric === stat.metric && other.period === stat.period && other.unit === stat.unit && stat.value !== null && Number.isFinite(stat.value) && other.value !== null && Number.isFinite(other.value) && other.value !== stat.value);
            return <div className="list-row" key={`${stat.metric}-${stat.period}-${stat.source_url ?? 'без-источника'}-${index}`}>
              <span className="list-main"><span>{metricLabel(stat.metric)}</span><StatSource s={stat} />{conflict && <span className="tag">Конфликт значений: источники расходятся</span>}</span>
              <Val className="list-side" value={statText(stat) ?? '—'} />
            </div>;
          })}
        </div>
      </div>}

      {!hasUnknownSelection && detailMarket && <div className="note">
        <div className="kicker">Выбранный рынок</div>
        <h2 className="h2">{detailMarket.name_ru ?? detailMarket.slug}</h2>
        <p className="stat-note">{regionName(detailMarket.region_slug)} · единица точек карты · {detailMarket.players_count ?? 'нет данных'}</p>
        <p>{detailMarket.players.join(' · ') || 'Игроки поимённо не указаны в выгрузке.'}</p>
      </div>}

      {!hasUnknownSelection && !selectedRegion && !detailMarket && view === 'search' && <>
        <div className="list">{hits.map((hit) => <a className="list-row" key={hit.href + hit.label} href={hit.href}><span className="list-main"><span>{hit.label}</span><span className="tag">{HIT_LABEL[hit.kind]}</span><span className="stat-note">{hit.sub}</span></span></a>)}</div>
        <ResultCount shown={hits.length} total={searchMatches.length} />
      </>}

      {!hasUnknownSelection && !selectedRegion && !detailMarket && view === 'regions' && <>
        <div className="list">{regions.map((region) => <a className="list-row" key={region.id} href={`#/vietnam/region/${region.slug}`}><span className="list-main"><span>{depersonalize(region.name_ru ?? region.name_vi ?? region.slug)}</span><span className="tag">{region.perimeter ?? region.level}</span></span><span className="list-side meta">{statText(statOf(region.slug, 'population')) ?? 'нет данных'}</span></a>)}</div>
        <ResultCount shown={regions.length} total={regionMatches.length} />
      </>}

      {!hasUnknownSelection && !selectedRegion && !detailMarket && view === 'markets' && <>
        <div className="list">{marketRows.map((market) => <a className="list-row" key={market.id} href={`#/vietnam/market/${market.region_slug}/${market.slug}`}><span className="list-main"><span>{market.name_ru ?? market.slug}</span><span className="stat-note">{regionName(market.region_slug)} · пересчитано {market.players_counted_at ? dayRu(market.players_counted_at) : 'нет даты'}</span></span><Val className="list-side" value={market.players_count === null ? '—' : String(market.players_count)} unit="точек" /></a>)}</div>
        <ResultCount shown={marketRows.length} total={marketMatches.length} />
      </>}

      {!hasUnknownSelection && !selectedRegion && !detailMarket && view === 'national' && <>
        <div className="list">{nationalRows.map((market) => <div className="list-row" key={market.slug}><span className="list-main"><span>{market.name_ru}</span><span className="stat-note">{market.players.map((player) => player.name).join(' · ')}</span></span><Val className="list-side" value={String(market.players.length)} unit="игроков" /></div>)}</div>
        <ResultCount shown={nationalRows.length} total={namedNationalMatches.length} />
      </>}

      {!hasUnknownSelection && !selectedRegion && !detailMarket && view === 'employment' && <>
        {employmentTrendSeries.length > 0 ? (
          <div className="grid grid--2">
            {employmentTrendSeries.map(({ metric, series }) => (
              <ComparableTrend
                key={metric}
                series={series}
                title={metricLabel(metric)}
                note="Вьетнам · годовой ряд"
                unit={unitRu(series.unit)}
              />
            ))}
          </div>
        ) : (
          <p className="section-lead">Для графика нужны минимум три сопоставимых годовых наблюдения. Доступные числа — ниже.</p>
        )}
        <div className="list">{employmentRows.map((stat, index) => <div className="list-row" key={`${stat.metric}-${stat.period}-${stat.source_url ?? 'без-источника'}-${index}`}><span className="list-main"><span>{metricLabel(stat.metric)}</span><StatSource s={stat} /></span><Val className="list-side" value={statText(stat) ?? '—'} /></div>)}</div>
        <ResultCount shown={employmentRows.length} total={employmentMatches.length} />
      </>}

      {!hasUnknownSelection && !selectedRegion && !detailMarket && view === 'entities' && <>
        <div className="list">{entityRows.map((entity) => <a className="list-row" key={entity.slug} href={`#/vietnam/entity/${entity.slug}`}><span className="list-main"><span>{entity.name_ru ?? entity.name ?? entity.slug}</span><span className="tag">{ENTITY_KIND[entity.kind ?? ''] ?? 'сущность'}</span></span></a>)}</div>
        <ResultCount shown={entityRows.length} total={entityMatches.length} />
      </>}

      {!hasUnknownSelection && !selectedRegion && !detailMarket && view === 'sweeps' && <>
        <div className="table-wrap"><table className="table"><thead><tr><th>Обход</th><th>Итог</th><th>Последний запуск</th></tr></thead><tbody>{sweepMatches.map((heartbeat) => <tr key={heartbeat.job}><td>{heartbeat.job}</td><td>{heartbeat.ok ? 'успех' : 'отказ'}{heartbeat.message ? ` · ${heartbeat.message}` : ''}</td><td>{heartbeat.last_run_at ? new Date(heartbeat.last_run_at).toLocaleString('ru-RU') : '—'}</td></tr>)}</tbody></table></div>
        <ResultCount shown={sweepMatches.length} total={sweepMatches.length} />
      </>}

      {!hasUnknownSelection && !selectedRegion && !detailMarket && ((view === 'search' && hits.length === 0) || (view === 'regions' && regions.length === 0) || (view === 'markets' && marketRows.length === 0) || (view === 'national' && nationalRows.length === 0) || (view === 'employment' && employmentRows.length === 0) || (view === 'entities' && entityRows.length === 0) || (view === 'sweeps' && sweepMatches.length === 0)) && <div className="empty">{view === 'search' && q.length < 2 ? 'Введите минимум два символа для поиска.' : 'В выбранной категории нет данных по этому запросу.'}</div>}
    </div>
  );
}

export default CompactVietnamDb;

// Тип источника в базе и метка доказательства в интерфейсе — один словарь.
// Незнакомое значение показывается как «без источника», а не прячется.
const EVIDENCE_KINDS: EvidenceKind[] = ['official', 'analyst', 'company', 'proxy', 'forecast'];
const asKind = (s: string | null | undefined): EvidenceKind | null =>
  s && (EVIDENCE_KINDS as string[]).includes(s) ? (s as EvidenceKind) : null;

// ─── Разбор строк базы ────────────────────────────────────────────────────────

const REGION_BY_SLUG = new Map(GEN_REGIONS.map((r) => [r.slug, r]));
/** Имя рынка по слагу: один рынок живёт строкой в десятках зон, имя у всех одно. */
const MARKET_NAME = new Map(GEN_MARKETS.map((m) => [m.slug, m.name_ru ?? m.slug]));
// В базе зона владельца названа «Дом · Đông Thanh, Nam Ban»: в атласе она
// показывается местом, а не домом. Экономику зоны (29 рынков) при этом не
// выбрасываем: личное тут только имя.
const depersonalize = (name: string) => name.replace(/^Дом\s*·\s*/, '').replace(/^Дом$/, 'Đông Thanh, Nam Ban');
const regionName = (slug: string) => {
  const region = REGION_BY_SLUG.get(slug);
  if (region) return depersonalize(region.name_ru ?? region.name_vi ?? slug);
  // Запасной путь графа для мест вне реестра Вьетнама: слаг с префиксом
  // `region:`. Например Харьков, откуда родом предшественник Vingroup.
  const outside = /^region:(.+)$/.exec(slug);
  return outside ? `${outside[1]} · вне реестра мест` : slug;
};

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

/** Дерево регионов сверху вниз: страна, её провинции, их районы и общины.
 *
 *  Скрытый узел не уносит с собой детей: они поднимаются на его место. Иначе
 *  двенадцать районов Lâm Đồng исчезали бы вместе со строкой старой провинции,
 *  под которой они в базе висят, - а это единственный слой с подвижностью. */
function regionTree(keep: (r: GenRegion) => boolean): { region: GenRegion; depth: number }[] {
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
      const shown = keep(region);
      if (shown) out.push({ region, depth });
      walk(region.id, shown ? depth + 1 : depth);
    }
  };
  walk(null, 0);
  // Сирота (родитель есть, но его строки в выгрузке нет) иначе исчезает молча.
  for (const r of GEN_REGIONS) {
    if (r.parent_id && !ids.has(r.parent_id) && keep(r)) out.push({ region: r, depth: 0 });
  }
  return out;
}

/** Строка старого деления. Такие провинции лежат в базе ДЕТЬМИ своих
 *  преемников после слияния 01.07.2025, и в дереве каждая провинция страны
 *  читалась дважды. По умолчанию показывается только актуальное деление. */
const isOldPerimeter = (r: GenRegion) => r.perimeter === 'pre-2025';

/** Сколько у региона показателей в выгрузке. */
const statCount = (slug: string) => (STATS_BY_REGION.get(slug) ?? []).length;

/** Провинции старых границ, из которых собрана нынешняя.
 *
 *  Это не формальность: госстатистика PxWeb печатает ряды по годам ТОЛЬКО в
 *  границах до 01.07.2025, а у новых провинций в базе лежат население и
 *  площадь. Спрятать старое деление и на этом закончить значило бы убрать из
 *  атласа всю историю. Поэтому карточка новой провинции показывает ряды её
 *  предшественниц отдельными линиями - складывать их нельзя, границы разные. */
const OLD_PARTS = new Map<string, GenRegion[]>();
{
  const byId = new Map(GEN_REGIONS.map((r) => [r.id, r]));
  for (const r of GEN_REGIONS) {
    if (!isOldPerimeter(r) || !r.parent_id) continue;
    const parent = byId.get(r.parent_id);
    if (!parent || isOldPerimeter(parent)) continue;
    const list = OLD_PARTS.get(parent.slug) ?? [];
    list.push(r);
    OLD_PARTS.set(parent.slug, list);
  }
}

const regionLevel = (slug: string) => REGION_BY_SLUG.get(slug)?.level ?? null;

// ─── Ряды для графиков ────────────────────────────────────────────────────────

/** Единица метрики словами. В подсказке графика код базы читать нечего. */
const UNIT_RU: Record<string, string> = {
  percent: '%',
  person: 'чел.',
  ton: 'т',
  ha: 'га',
  km2: 'км²',
  unit: 'шт.',
  USD: '$',
  VND: '₫',
  index: 'пунктов'
};
const unitRu = (u: string | null | undefined) => (u ? UNIT_RU[u] ?? u : undefined);

/** Ряд метрики по возрастанию периода: график читает порядок, а не сортировку
 *  списка. Точки без значения выброшены - дырка в линии честнее нуля. */
function historyOf(slug: string, metric: string): GenStat[] {
  return (STATS_BY_KEY.get(`${slug}|${metric}`) ?? [])
    .filter((s) => s.value !== null && s.value !== undefined && s.period)
    .slice()
    .sort((a, b) => (a.period ?? '').localeCompare(b.period ?? ''));
}

/** Сколько точек нужно, чтобы линия что-то показывала. Две точки это стрелка,
 *  а не тенденция, и рисовать её графиком - обман. */
const MIN_POINTS = 3;

/** Метрики, ради которых человек открывает карточку региона. Порядок тот же на
 *  экране; всё, чего в списке нет, уходит в таблицу под графиками. */
const KEY_TRENDS = [
  'population',
  'tourists_total',
  'tourists_intl',
  'tourist_revenue_vnd',
  'grdp_usd',
  'grdp_per_capita_usd',
  'gdp_usd',
  'gdp_per_capita_usd',
  'businesses_active',
  'businesses_registered_year',
  'employed_enterprises',
  'iip_index',
  'population_density',
  'retail_turnover_vnd',
  'unemployment_rate',
  'avg_income_vnd_month'
];

const EMPLOYMENT_TREND_ORDER = [
  'unemployment_rate',
  'employment_ratio_pct',
  'employed_total',
  'employed_enterprises'
];

function comparableRegionTrends(slug: string) {
  return KEY_TRENDS
    .map((metric) => ({ metric, series: selectComparableSeries(GEN_STATS, { regionSlug: slug, metric, frequency: 'annual' }) }))
    .filter(({ series }) => series.rows.length >= MIN_POINTS)
    .slice(0, 6);
}

function employmentTrends() {
  const sectorMetrics = [...new Set(
    GEN_STATS
      .filter((stat) => stat.region_slug === 'vn' && stat.metric.startsWith('employed:'))
      .map((stat) => stat.metric)
  )].sort();
  const metrics = [...sectorMetrics, ...EMPLOYMENT_TREND_ORDER]
    .filter((metric, index, all) => all.indexOf(metric) === index);
  return metrics
    .map((metric) => ({ metric, series: selectComparableSeries(GEN_STATS, { regionSlug: 'vn', metric, frequency: 'annual' }) }))
    .filter(({ series }) => series.rows.length >= MIN_POINTS)
    .slice(0, 4);
}

/** Ключевые числа в строке региона: первое попавшееся из каждой тройки.
 *  Провинции по стране заполнены неровно, жёсткий список дал бы пустые слоты. */
const KEY_NUMS: { label: string; metrics: string[] }[] = [
  { label: 'население', metrics: ['population', 'population_hrsl'] },
  { label: 'туристы', metrics: ['tourists_total', 'tourists_intl'] },
  { label: 'экономика', metrics: ['grdp_usd', 'gdp_usd', 'grdp_per_capita_usd', 'iip_index'] },
  { label: 'бизнес', metrics: ['businesses_active', 'businesses_registered_year'] }
];

/** Доли подвижности: четыре ряда, сумма которых равна ста процентам. Порядок
 *  фиксирован - слот палитры привязан к ряду, а не к его месту в сортировке. */
const MOBILITY_SERIES = [
  { key: 'mobility_home_share', label: 'дома' },
  { key: 'mobility_0_10km_share', label: 'до 10 км' },
  { key: 'mobility_10_100km_share', label: '10-100 км' },
  { key: 'mobility_100plus_share', label: 'свыше 100 км' }
];

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

/** Сущности графа по регионам: только настоящая экономика. */
// На карточке региона не показываем четыре вида узлов: market и region это
// зеркала своих таблиц, source это заголовки новостных лент (397 штук), event
// это зеркало календаря, который стоит отдельным блоком выше.
const GRAPH_NOISE = ['market', 'region', 'source', 'event'];
const ENTITIES_BY_REGION = new Map<string, GenEntity[]>();
for (const e of GEN_ENTITIES) {
  if (!e.region_slug || GRAPH_NOISE.includes(e.kind ?? '')) continue;
  const list = ENTITIES_BY_REGION.get(e.region_slug) ?? [];
  list.push(e);
  ENTITIES_BY_REGION.set(e.region_slug, list);
}

const ENTITY_KIND: Record<string, string> = {
  company: 'компании',
  person: 'люди',
  institution: 'институты',
  event: 'события',
  brand: 'бренды',
  product: 'продукты',
  place: 'места',
  sector: 'отрасли',
  technology: 'технологии'
};

/** «компании 12 · люди 3 · отрасли 2» плюс несколько имён для примера. */
function entityKindSummary(list: GenEntity[]): string {
  const byKind = new Map<string, number>();
  for (const e of list) {
    const k = ENTITY_KIND[e.kind ?? ''] ?? e.kind ?? 'прочее';
    byKind.set(k, (byKind.get(k) ?? 0) + 1);
  }
  const counts = [...byKind.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([k, n]) => `${k} ${n}`)
    .join(' · ');
  const names = list
    .filter((e) => e.kind === 'company' || e.kind === 'person' || e.kind === 'institution')
    .slice(0, 6)
    .map(entityName);
  return names.length ? `${counts}. Например: ${names.join(', ')}` : counts;
}

/** Ноль игроков при плотности разметки 1,1 и ноль при 62 это разные нули.
 *  Вердикт графа отделяет дыру от неразмеченной карты, и без него 52 строки со
 *  оценкой около пяти читались бы как найденная возможность. */
const isBlindSpot = (m: GenMarket) => (m.gap_status ?? '').startsWith('no_data');
const BLIND_SPOTS = GEN_MARKETS.filter(isBlindSpot).length;

/** Строки рынков, которые обход ни разу не пересчитал. */
const NEVER_COUNTED = GEN_MARKETS.filter((m) => !m.players_counted_at).length;

/** Сколько рынков получили оценку возможности. Остальным в базе стоит null, и
 *  это «не считали», а не ноль: у зоны неизвестно население. */
const SCORED = GEN_MARKETS.filter(
  (m) => m.opportunity_score !== null && m.opportunity_score !== undefined
).length;

/** Якоря блоков раздела. Тот же список назван агенту region-brief и в README.
 *  Он же строит оглавление: подпись живёт рядом с якорем, чтобы новый блок
 *  нельзя было завести, забыв про навигацию. */
const SECTIONS: { id: string; label: string }[] = [
  { id: 'search', label: 'Поиск' },
  { id: 'calendar', label: 'Календарь' },
  { id: 'regions', label: 'Регионы' },
  { id: 'employment', label: 'Занятость' },
  { id: 'mobility', label: 'Движение людей' },
  { id: 'markets', label: 'Рынки по зонам' },
  { id: 'national', label: 'Игроки поимённо' },
  { id: 'opportunity', label: 'Возможности' },
  { id: 'entities', label: 'Созвездие графа' },
  { id: 'sweeps', label: 'Обходы' }
];
const SECTION_IDS = SECTIONS.map((s) => s.id);

/** Оглавление раздела. Активный пункт считается наблюдателем пересечений:
 *  слушать scroll на странице высотой в двадцать экранов дороже и дёргается. */
function Toc() {
  const [active, setActive] = useState<string>(SECTION_IDS[0]);
  useEffect(() => {
    const seen = new Map<string, number>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) seen.set(e.target.id, e.intersectionRatio);
        // Активен самый верхний из видимых: так пункт не прыгает вниз, когда
        // в кадр попадают сразу два коротких блока.
        const visible = SECTION_IDS.map((id) => `vn-${id}`).filter((id) => (seen.get(id) ?? 0) > 0);
        if (visible[0]) setActive(visible[0].slice(3));
      },
      { rootMargin: '-96px 0px -60% 0px', threshold: [0, 0.01] }
    );
    for (const s of SECTION_IDS) {
      const el = document.getElementById(`vn-${s}`);
      if (el) io.observe(el);
    }
    return () => io.disconnect();
  }, []);

  return (
    <nav className="toc" aria-label="Блоки раздела">
      {SECTIONS.map((s) => (
        <button
          key={s.id}
          className="toc-link"
          aria-current={active === s.id ? 'true' : undefined}
          onClick={() => scrollToAnchor(`vn-${s.id}`)}
        >
          {s.label}
        </button>
      ))}
    </nav>
  );
}

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

/** Прокрутка к блоку с учётом липкой шапки. Высоту считаем по элементу, а не
 *  константой: на телефоне под шапкой стоит ещё и полоса оглавления, и
 *  фиксированные 96 px уводили заголовок под неё. */
function scrollToAnchor(id: string) {
  const el = document.getElementById(id);
  if (!el) return false;
  const header = document.querySelector('.header') as HTMLElement | null;
  const toc = window.innerWidth < 1024 ? (document.querySelector('.toc') as HTMLElement | null) : null;
  const offset = (header?.offsetHeight ?? 96) + (toc?.offsetHeight ?? 0) + 16;
  window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - offset, behavior: 'smooth' });
  return true;
}

const dayRu = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' }) : '';

/** Ключевые числа прямо в строке региона: населения, туристов и экономики
 *  хватает, чтобы понять масштаб места, не раскрывая карточку. */
function RegionKeyNums({ slug }: { slug: string }) {
  const nums = KEY_NUMS.map((group) => {
    const metric = group.metrics.find((m) => statOf(slug, m));
    if (!metric) return null;
    const stat = statOf(slug, metric)!;
    const text = statText(stat);
    return text ? { label: metricLabel(metric).toLowerCase(), text, stat } : null;
  })
    .filter((x): x is { label: string; text: string; stat: GenStat } => x !== null)
    // Три числа - потолок строки. Четвёртое переносило строку и делало список
    // регионов нечитаемым; остальное открывается карточкой.
    .slice(0, 3);

  if (nums.length === 0) {
    return <span className="stat-note">{slug} · показателей нет</span>;
  }
  return (
    <span className="keynums">
      {nums.map((n) => (
        <span className="keynum" key={n.label}>
          <Val value={n.text} />
          <span className="meta">{n.label}</span>
          {/* Метка стоит только там, где число НЕ госстатистика: четыре «ФАКТ»
              подряд ничего не сообщают, а «оценка» рядом с числом - сообщает. */}
          {asKind(n.stat.source_type) !== 'official' && <EvidenceTag kind={asKind(n.stat.source_type)} />}
        </span>
      ))}
    </span>
  );
}

/** Спарклайн населения в строке. Три точки и больше - иначе это стрелка. */
function RegionSpark({ slug }: { slug: string }) {
  const series = historyOf(slug, 'population');
  if (series.length < MIN_POINTS) return <span className="meta">{statText(statOf(slug, 'population')) ?? ''}</span>;
  return (
    <span className="row">
      <Sparkline values={series.map((s) => Number(s.value))} />
      <Val value={statText(series[series.length - 1]) ?? ''} />
    </span>
  );
}

/** Занятость по годам: до четырёх отраслей линиями на одной шкале процентов.
 *  Пятой отрасли в источниках нет, и если появится - уйдёт в «прочие»: рядов
 *  больше четырёх глаз не различает. */
function EmploymentTrend({ slug }: { slug: string }) {
  const sectors = [...new Set(
    (STATS_BY_REGION.get(slug) ?? []).filter((s) => s.metric.startsWith('employed:')).map((s) => s.metric)
  )];
  const series = sectors
    .map((metric) => ({ metric, rows: historyOf(slug, metric) }))
    .filter((x) => x.rows.length >= MIN_POINTS)
    .slice(0, 4);
  if (series.length === 0) {
    const rate = historyOf(slug, 'unemployment_rate');
    if (rate.length < MIN_POINTS) return null;
    return (
      <Trend
        data={rate.map((r) => ({ period: r.period ?? '', value: Number(r.value) }))}
        series={[{ key: 'value', label: 'Безработица' }]}
        unit="%"
        title="Безработица по годам"
        note={<EvidenceTag kind={asKind(rate[rate.length - 1].source_type)} />}
      />
    );
  }
  const periods = [...new Set(series.flatMap((x) => x.rows.map((r) => r.period ?? '')))].sort();
  const data = periods.map((period) => {
    const point: Point = { period };
    for (const x of series) {
      const hit = x.rows.find((r) => r.period === period);
      if (hit) point[x.metric] = Number(hit.value);
    }
    return point;
  });
  return (
    <Trend
      data={data}
      series={series.map((x) => ({
        key: x.metric,
        label: metricLabel(x.metric).replace('Занятость: ', '')
      }))}
      unit="%"
      title="Отрасли по годам"
      note="Доля занятых, одна шкала процентов на все ряды"
    />
  );
}

/** Карточка региона: графики по метрикам, у которых в базе есть ряд.
 *  Метрики без ряда остаются таблицей ниже - линия из одной точки врёт. */
function RegionCharts({ slug }: { slug: string }) {
  const parts = OLD_PARTS.get(slug) ?? [];

  const trends = KEY_TRENDS.map((metric) => {
    const own = historyOf(slug, metric);
    if (own.length >= MIN_POINTS) {
      return { metric, old: false, series: [{ label: metricLabel(metric), rows: own }] };
    }
    // Ряда в нынешних границах нет - берём ряды предшественниц. Больше четырёх
    // линий глаз не различает, поэтому длинные ряды идут первыми, остальные не
    // рисуются: врать «это весь регион» нельзя, а четыре линии уже читаются.
    const fromParts = parts
      .map((r) => ({ label: depersonalize(r.name_ru ?? r.name_vi ?? r.slug), rows: historyOf(r.slug, metric) }))
      .filter((x) => x.rows.length >= MIN_POINTS)
      .sort((a, b) => b.rows.length - a.rows.length)
      .slice(0, 4);
    return fromParts.length > 0 ? { metric, old: true, series: fromParts } : null;
  })
    .filter((t): t is { metric: string; old: boolean; series: { label: string; rows: GenStat[] }[] } => t !== null)
    .slice(0, 6);

  if (trends.length === 0) {
    return (
      <p className="section-lead">
        Рядов по годам у этого региона нет: каждая метрика снята один раз. График из одной точки
        ничего не показывает, поэтому числа стоят таблицей ниже.
      </p>
    );
  }

  return (
    <div className="grid grid--2">
      {trends.map(({ metric, old, series }) => {
        const periods = [...new Set(series.flatMap((x) => x.rows.map((r) => r.period ?? '')))].sort();
        const data: Point[] = periods.map((period) => {
          const point: Point = { period };
          for (const x of series) {
            const hit = x.rows.find((r) => r.period === period);
            if (hit) point[x.label] = Number(hit.value);
          }
          return point;
        });
        const sample = series[0].rows[series[0].rows.length - 1];
        const first = series[0].rows[0];
        const delta =
          !old && Number(first.value) ? (Number(sample.value) / Number(first.value) - 1) * 100 : null;
        return (
          <Trend
            key={metric}
            data={data}
            series={series.map((x) => ({ key: x.label, label: x.label }))}
            unit={unitRu(sample.unit)}
            height={210}
            title={metricLabel(metric)}
            note={
              <>
                <EvidenceTag kind={asKind(sample.source_type)} />{' '}
                {periods[0]} - {periods[periods.length - 1]}
                {old ? ' · ряды в границах до 01.07.2025, складывать их нельзя' : ''}
                {delta !== null && Number.isFinite(delta)
                  ? ` · ${delta >= 0 ? '+' : '-'}${Math.abs(delta).toFixed(1).replace('.', ',')} % за период`
                  : ''}
              </>
            }
          />
        );
      })}
    </div>
  );
}

// ─── Раздел ───────────────────────────────────────────────────────────────────

function LegacyVietnamDb({ initialScope = 'country' }: { initialScope?: 'lamdong' | 'country' } = {}) {
  const route = useHashRoute();
  const [query, setQuery] = useState('');
  const [level, setLevel] = useState<string>('all');
  const [openRegion, setOpenRegion] = useState<string | null>(null);
  const [openMarket, setOpenMarket] = useState<string | null>(null);
  // Охват дерева регионов и два переключателя шума.
  const [scope, setScope] = useState<'lamdong' | 'country'>(initialScope);
  const [oldPerimeter, setOldPerimeter] = useState(false);
  const [showEmpty, setShowEmpty] = useState(false);
  // Район, чей ряд подвижности развёрнут по датам.
  const [mobilityPick, setMobilityPick] = useState<string | null>(null);
  // Рынок, по которому сравниваются зоны столбиками.
  const [marketPick, setMarketPick] = useState<string | null>(null);

  // Маршрут раскрывает нужную строку и прокручивает к её блоку.
  useEffect(() => {
    if (!route || route.domain !== 'vietnam') return;
    const anchor =
      route.kind === 'region' ? `vn-region-${route.a}`
      : route.kind === 'market' ? `vn-market-${route.a}/${route.b}`
      : route.kind === 'entity' ? 'vn-entities'
      : `vn-${route.a}`;
    if (route.kind === 'region') setOpenRegion(route.a);
    if (route.kind === 'market') setOpenMarket(`${route.a}/${route.b}`);
    // Якорь региона это обёртка, внутри которой лежит и заголовок строки, и все
    // её раскрытые показатели: у Вьетнама их 116, и обёртка высотой в пять
    // экранов. Центрировать такую нельзя - block:'center' уводил заголовок на
    // 1 271 пиксель выше экрана. Выравниваем по верху, отступ под липкую шапку
    // задан scrollMarginTop на самой обёртке.
    // Строка появляется только после setOpenRegion, поэтому ждём кадр. Второй
    // проход с поправкой нужен при переходе по ссылке внутри уже открытой
    // страницы: прошлый регион схлопывается во время плавной прокрутки, вёрстка
    // над целью уезжает, и анимация приходит не туда.
    const fallback = route.kind === 'market' ? 'vn-markets' : 'vn-regions';
    // Считаем смещение сами вместо scrollIntoView. Строка рынка лежит в таблице
    // внутри .table-wrap с overflow-x, и scrollIntoView крутит ещё и этот
    // горизонтальный контейнер: Chromium из-за этого оставлял цель за четыре
    // экрана, WebKit доезжал. Ручной scrollTo ведёт себя одинаково в обоих.
    const scroll = () => scrollToAnchor(anchor) || scrollToAnchor(fallback);
    requestAnimationFrame(scroll);
    const fix = setTimeout(scroll, 700);
    return () => clearTimeout(fix);
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
    })
    // У шестидесяти провинций из PxWeb есть только «занятых на предприятиях»:
    // ни отраслей, ни безработицы, ни дохода. Такая строка рисовала заголовок
    // региона и под ним пустоту - это и есть строка-заглушка, которых быть не
    // должно. Показываем регион, только если есть что показать.
    .filter((r) => r.sectors.length > 0 || r.unemployment || r.income)
    .sort((a, b) => b.sectors.length - a.sectors.length);
  }, []);

  // Сравнение зон по одному рынку: столбики читаются за секунду, таблица из
  // 641 строки - нет. Переключатель показывает рынки, размеченные шире прочих.
  const topMarketSlugs = useMemo(() => {
    const bySlug = new Map<string, number>();
    for (const m of GEN_MARKETS) {
      if (!m.players_count) continue;
      bySlug.set(m.slug, (bySlug.get(m.slug) ?? 0) + 1);
    }
    return [...bySlug.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([slug]) => slug);
  }, []);

  const compareRows = useMemo(() => {
    const slug = marketPick ?? topMarketSlugs[0];
    if (!slug) return [];
    return GEN_MARKETS.filter((m) => m.slug === slug && m.players_count !== null)
      .map((m) => ({
        label: regionName(m.region_slug),
        value: Number(m.players_count),
        // Зона владельца подсвечена вторым слотом палитры: она и есть причина,
        // ради которой раздел читают.
        active: m.region_slug.startsWith('zone:')
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 14);
  }, [marketPick, topMarketSlugs]);

  // Движение людей: обход подвижности пишет четыре доли по каждому району
  // ежедневно. Сумма четырёх равна ста процентам, поэтому стек тут честен.
  const mobility = useMemo(() => {
    const rows = GEN_STATS.filter((s) => s.metric.startsWith('mobility_') && s.value !== null);
    const slugs = [...new Set(rows.map((s) => s.region_slug))];
    const periods = [...new Set(rows.map((s) => s.period ?? ''))].sort();
    const last = periods[periods.length - 1] ?? '';
    const latest = slugs
      .map((slug) => {
        const point: Point = { period: regionName(slug), slug };
        for (const m of MOBILITY_SERIES) {
          const hit = rows.find((s) => s.region_slug === slug && s.metric === m.key && s.period === last);
          if (hit) point[m.key] = Number(hit.value);
        }
        return point;
      })
      // Район без полного набора долей стек бы перекосил: показываем только те,
      // где обход отдал все четыре.
      .filter((p) => MOBILITY_SERIES.every((m) => typeof p[m.key] === 'number'))
      .sort((a, b) => Number(b['mobility_100plus_share']) - Number(a['mobility_100plus_share']));
    return { slugs, periods, last, latest };
  }, []);

  /** Ряд одного района по датам: четыре доли, четыре линии. */
  const mobilitySeries = useMemo(() => {
    const slug = mobilityPick ?? mobility.slugs[0];
    if (!slug) return [];
    return mobility.periods.map((period) => {
      const point: Point = { period };
      for (const m of MOBILITY_SERIES) {
        const hit = GEN_STATS.find((s) => s.region_slug === slug && s.metric === m.key && s.period === period);
        if (hit && hit.value !== null) point[m.key] = Number(hit.value);
      }
      return point;
    });
  }, [mobilityPick, mobility]);

  /** Ряд «поездки дальше 10 км» под осью таймлайна. Берём район с самой
   *  крупной зоной - Đà Lạt, там же живут рынки. */
  const mobilityRow = useMemo(() => {
    const slug = mobility.slugs.find((x) => x.endsWith('dalat')) ?? mobility.slugs[0];
    if (!slug) return [];
    return historyOf(slug, 'mobility_10_100km_share');
  }, [mobility]);
  const mobilityRegionName = regionName(
    mobility.slugs.find((x) => x.endsWith('dalat')) ?? mobility.slugs[0] ?? ''
  );

  // В базе 244 региона, и каждая провинция страны лежит в ней дважды: строка
  // актуального деления и строка деления до 01.07.2025, которая после слияния
  // висит ребёнком своего преемника. В дереве это читалось дублями, а часть
  // строк не несла ни одного показателя. Поэтому три переключателя вместо
  // одного: охват, старое деление и пустые строки. Регион из ссылки виден
  // всегда - иначе адрес ведёт в никуда.
  const visibleTree = useMemo(() => {
    const withMarkets = new Set(GEN_MARKETS.map((m) => m.region_slug));
    const lamdongTree = (r: GenRegion) =>
      r.slug.startsWith('vn-lamdong') || r.level === 'zone' || withMarkets.has(r.slug);
    return regionTree((r) => {
      if (r.slug === openRegion) return true;
      if (isOldPerimeter(r) && r.level === 'province' && !oldPerimeter) return false;
      if (!showEmpty && statCount(r.slug) === 0) return false;
      if (scope === 'lamdong' && r.level !== 'country' && !lamdongTree(r)) return false;
      return true;
    });
  }, [scope, oldPerimeter, showEmpty, openRegion]);

  /** Сколько строк прячут переключатели - число, а не слово «часть». */
  const hiddenCounts = useMemo(() => {
    const shown = new Set(visibleTree.map((v) => v.region.slug));
    return {
      old: GEN_REGIONS.filter((r) => isOldPerimeter(r) && r.level === 'province' && !shown.has(r.slug)).length,
      empty: GEN_REGIONS.filter((r) => statCount(r.slug) === 0 && !shown.has(r.slug)).length
    };
  }, [visibleTree]);

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
      GEN_MARKETS.filter(
        (m) => m.opportunity_score !== null && m.opportunity_score !== undefined && !isBlindSpot(m)
      )
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

      <div className="with-toc">
      <div className="vn-body">

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
              Государственные праздники, фестивали и учебный год на одной оси: полгода назад и
              полгода вперёд. Это сезонность рынков - в эти дни спрос на размещение, еду и услуги
              идёт не как в будни. Клик по точке открывает источник строки.
            </p>
          </div>
          <VietnamTimeline
            events={GEN_EVENTS}
            mobility={mobilityRow}
            mobilityRegion={mobilityRegionName}
          />

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
          <button className="seg-btn" aria-pressed={scope === 'lamdong'} onClick={() => setScope('lamdong')}>
            Lâm Đồng, районы и зоны
          </button>
          <button className="seg-btn" aria-pressed={scope === 'country'} onClick={() => setScope('country')}>
            Вся страна
          </button>
        </div>
        <div className="seg" role="group" aria-label="Что показывать дополнительно">
          <button className="seg-btn" aria-pressed={oldPerimeter} onClick={() => setOldPerimeter(!oldPerimeter)}>
            Старое деление до 01.07.2025{hiddenCounts.old ? ` · ${hiddenCounts.old}` : ''}
          </button>
          <button className="seg-btn" aria-pressed={showEmpty} onClick={() => setShowEmpty(!showEmpty)}>
            Показать пустые{hiddenCounts.empty ? ` · ${hiddenCounts.empty}` : ''}
          </button>
        </div>
      </div>
      {GEN_REGIONS.length === 0 ? (
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
              <div
                key={region.id}
                id={`vn-region-${region.slug}`}
              >
                <button
                  className="list-row"
                  aria-current={open ? 'true' : undefined}
                  aria-expanded={open}
                  onClick={() => setOpenRegion(open ? null : region.slug)}
                >
                  <span className="list-main" style={{ paddingLeft: depth * 16 }}>
                    <span>{depersonalize(region.name_ru ?? region.name_vi ?? region.slug)}</span>
                    <span className="tag">{LEVEL_LABEL[region.level] ?? region.level}</span>
                    {isOldPerimeter(region) && <span className="tag tag--muted">деление до 01.07.2025</span>}
                    <RegionKeyNums slug={region.slug} />
                  </span>
                  <span className="list-side">
                    <RegionSpark slug={region.slug} />
                  </span>
                </button>
                {open && (
                  <div className="stack stack--loose" style={{ padding: `var(--s4) 0 var(--s5) ${depth * 16}px` }}>
                    {stats.length === 0 ? (
                      <div className="empty">
                        <span className="empty-title">Показателей у региона нет</span>
                        <span>
                          Строка есть в реестре мест, чисел по ней обход ещё не собрал. Такие строки
                          по умолчанию скрыты переключателем «показать пустые».
                        </span>
                      </div>
                    ) : (
                      <RegionCharts slug={region.slug} />
                    )}
                    {(ENTITIES_BY_REGION.get(region.slug) ?? []).length > 0 && (
                      <div className="list">
                        <a className="list-row" href="#/vietnam/section/entities">
                          <span className="list-main">
                            <span>Сущности графа</span>
                            <span className="stat-note">
                              {entityKindSummary(ENTITIES_BY_REGION.get(region.slug) ?? [])}
                            </span>
                          </span>
                          <Val
                            className="list-side"
                            value={String((ENTITIES_BY_REGION.get(region.slug) ?? []).length)}
                            unit="шт."
                          />
                        </a>
                      </div>
                    )}
                    {stats.length > 0 && (
                      <details className="note">
                        <summary className="kicker">
                          Все показатели региона · <span className="num">{latestPerMetric(stats).length}</span>
                        </summary>
                        <div className="list">
                          {latestPerMetric(stats).map(({ last, history }) => (
                            <div className="list-row" key={last.metric}>
                              <span className="list-main">
                                <span>{metricLabel(last.metric)}</span>
                                <StatSource s={last} />
                                {history.length > 0 && (
                                  <span className="stat-note">
                                    раньше: {history.slice(0, 4).map((h) => `${h.period} ${statText(h)}`).join(' · ')}
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
                      </details>
                    )}
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
          Столбики показывают долю отрасли в занятости за последний год ряда. Стеком они не
          складываются намеренно: отраслевые ряды в источниках неполные и до целого не доходят,
          а стек из неполных долей врёт. График тенденции идёт рядом там, где у ряда три точки
          и больше.
        </p>
      </div>
      {employmentRows.length === 0 ? (
        <Gap
          what="Занятости и безработицы в базе пока нет"
          why="Метрик employed_total, employed:<отрасль>, unemployment_rate и avg_income_vnd_month нет ни у одного региона. Разведка 14.09.2026 этих чисел не нашла ни по стране, ни по провинции: их собирает следующий обход региона."
        />
      ) : (
        employmentRows.map((r) => (
          <div key={r.slug} className="stack stack--loose">
            <div className="row row--between row--wrap">
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
            <div className="grid grid--2">
              {r.sectors.length > 0 && (
                <Bars
                  rows={r.sectors.map(({ stat }) => ({
                    label: metricLabel(stat.metric).replace('Занятость: ', ''),
                    value: Number(stat.value ?? 0)
                  }))}
                  unit="%"
                  title={`Отрасли, ${r.sectors[0].stat.period ?? 'последний год'}`}
                  note={
                    <>
                      <EvidenceTag kind={asKind(r.sectors[0].stat.source_type)} /> доля занятых по отрасли
                    </>
                  }
                />
              )}
              <EmploymentTrend slug={r.slug} />
            </div>
          </div>
        ))
      )}

      <div className="hair" />

      {/* ── Движение людей ────────────────────────────────────────────────── */}
      {mobility.latest.length > 0 && (
        <>
          <div id="vn-mobility" className="section-head">
            <h2 className="section-title">Движение людей по районам</h2>
            <p className="section-lead">
              Куда люди уезжают от дома за день. Четыре доли складываются в сто процентов, поэтому
              стек тут честен и показывает состав, а не сумму разных вещей. Ряд снят моделью
              расселения по снимкам, а не переписью: это оценка, и метка источника это говорит.
              Последняя дата обхода - <span className="num">{mobility.last}</span>.
            </p>
          </div>
          <Shares
            data={mobility.latest}
            series={MOBILITY_SERIES}
            title="Состав поездок по районам"
            note="Районы отсортированы по доле дальних поездок: сверху те, откуда уезжают дальше всего."
          />

          <div className="toolbar">
            <div className="seg" role="group" aria-label="Район для ряда по датам">
              {mobility.slugs.map((slug) => (
                <button
                  key={slug}
                  className="seg-btn"
                  aria-pressed={(mobilityPick ?? mobility.slugs[0]) === slug}
                  onClick={() => setMobilityPick(slug)}
                >
                  {regionName(slug)}
                </button>
              ))}
            </div>
          </div>
          {/* Тот же стек, что и выше, только категория - дата. Четырьмя линиями
              это не читается: доли 58 и 0,3 процента на одной шкале дают две
              линии и два прижатых к нулю следа, а двух шкал не бывает. */}
          <Shares
            data={mobilitySeries}
            series={MOBILITY_SERIES}
            title={`Ряд по датам · ${regionName(mobilityPick ?? mobility.slugs[0])}`}
            note={`Состав поездок по дням, ${mobility.periods.length} дат обхода.`}
          />

          <div className="hair" />
        </>
      )}

      {/* ── Рынки ─────────────────────────────────────────────────────────── */}
      <div id="vn-markets" className="section-head">
        <h2 className="section-title">Рынки по зонам</h2>
        <p className="section-lead">
          Массаж, спа, отели, кофейни и прочее, что считается поимённо. Считаются точки на карте
          OpenStreetMap, а не реестр юрлиц.
        </p>
        {/* Четыре абзаца оговорок стояли стеной перед первым числом и занимали
            весь первый экран. Прочитать их надо один раз за жизнь раздела,
            поэтому они свёрнуты, а не выкинуты. */}
        <details className="note note--warn">
          <summary className="kicker">Как читать эти числа · четыре оговорки</summary>
          <div className="list">
            <div className="list-row">
              <span className="list-main">
                <span>Зоны складывать нельзя.</span>
                <span className="stat-note">
                  Зона это круг вокруг точки радиусом до 12 км, круги соседних зон пересекаются:
                  круг Đà Lạt накрывает Lạc Dương целиком, и их 1 598 и 1 575 точек это во многом
                  одни и те же заведения. Строка отвечает на вопрос «сколько точек в получасе езды
                  отсюда», а не «сколько точек в этом районе».
                </span>
              </span>
            </div>
            <div className="list-row">
              <span className="list-main">
                <span>Счёт точек это нижняя граница.</span>
                <span className="stat-note">
                  Карту рисуют волонтёры. Пять массажных на весь Đà Lạt при 20,7 млн визитов это
                  пять размеченных точек, а не рынок из пяти игроков. Число годится, чтобы
                  сравнивать зоны между собой, и не годится как размер рынка.
                </span>
              </span>
            </div>
            <div className="list-row">
              <span className="list-main">
                <span>Свежесть у каждой строки своя.</span>
                <span className="stat-note">
                  Обход рынков недельный. Если карта не ответит по одной зоне, её числа останутся
                  с прошлого раза, а пульс обхода останется зелёным: он краснеет, только когда не
                  прошла ни одна зона. Поэтому дата пересчёта стоит в каждой строке, а не одной
                  подписью на весь блок. «Точки не считаются» стоит у {NEVER_COUNTED} строк уровня
                  провинции: у них нет радиуса, и заведены они ради размера рынка в деньгах,
                  который статистика печатает только по провинции целиком.
                </span>
              </span>
            </div>
            <div className="list-row">
              <span className="list-main">
                <span>Прочерк в оценке значит «не считали».</span>
                <span className="stat-note">
                  Оценка возможности есть у {SCORED} строк из {GEN_MARKETS.length}. Зоны без
                  известного населения оценки не получают: ноль там не стоит, стоит прочерк.
                </span>
              </span>
            </div>
          </div>
        </details>
      </div>
      {compareRows.length > 0 && (
        <>
          <div className="toolbar">
            <div className="seg" role="group" aria-label="Рынок для сравнения зон">
              {topMarketSlugs.map((slug) => (
                <button
                  key={slug}
                  className="seg-btn"
                  aria-pressed={(marketPick ?? topMarketSlugs[0]) === slug}
                  onClick={() => setMarketPick(slug)}
                >
                  {MARKET_NAME.get(slug) ?? slug}
                </button>
              ))}
            </div>
          </div>
          <Bars
            rows={compareRows}
            unit="точек"
            title={`${MARKET_NAME.get(marketPick ?? topMarketSlugs[0]) ?? ''} по зонам`}
            note="Точки на карте OpenStreetMap в круге вокруг центра зоны. Круги соседних зон пересекаются, складывать столбики нельзя: это сравнение зон между собой, а не сумма рынка."
          />

          <div className="hair" />
        </>
      )}
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
                    <th scope="col" className="num">Точек на карте</th>
                    <th scope="col" className="num">Средний чек</th>
                    <th scope="col" className="num">Размер в год</th>
                    <th scope="col" className="num">Возможность</th>
                    <th scope="col" className="num">Пересчитано</th>
                    <th scope="col">Чем подкреплено</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((m) => {
                    const key = `${m.region_slug}/${m.slug}`;
                    const open = openMarket === key;
                    return (
                      <tr
                        key={m.id}
                        id={`vn-market-${key}`}
                        aria-current={open ? 'true' : undefined}
                      >
                        <td>
                          <button className="link" onClick={() => setOpenMarket(open ? null : key)}>
                            {m.name_ru ?? m.slug}
                          </button>
                          {open && (
                            <span className="stat-note">
                              {m.players.join(' · ') ||
                                `${fmtInt(m.players_count ?? 0)} точек на карте, ни одна не подписана именем`}
                            </span>
                          )}
                        </td>
                        <td className="num">
                          {m.players_count ?? '—'}
                          {m.players_rolled !== null &&
                            m.players_rolled !== undefined &&
                            m.players_rolled !== m.players_count && (
                              <span className="stat-note">
                                во всём районе {fmtInt(m.players_rolled)}
                              </span>
                            )}
                        </td>
                        <td className="num">
                          {m.avg_price_vnd ? <Val value={fmtInt(m.avg_price_vnd)} unit="VND" /> : '—'}
                        </td>
                        <td className="num">
                          {m.size_vnd_year ? (
                            <Val value={statText({ value: m.size_vnd_year, unit: 'VND' } as GenStat) ?? ''} />
                          ) : '—'}
                        </td>
                        <td className="num">
                          {isBlindSpot(m) ? (
                            <span className="tag tag--warn">карта редкая</span>
                          ) : m.opportunity_score === null || m.opportunity_score === undefined ? (
                            '—'
                          ) : (
                            fmt1(Number(m.opportunity_score))
                          )}
                        </td>
                        <td className="num">
                          {/* Свежесть по строке, а не одной подписью на блок:
                              обход недельный, и если Overpass отдаст зоне отказ,
                              её числа останутся с прошлого раза, а пульс обхода
                              будет зелёным - он краснеет, только когда не прошла
                              ни одна зона.
                              «Точки не считаются» это не сбой: у строки уровня
                              провинции нет радиуса, круг Overpass вокруг точки
                              провинции диаметром 200 км бессмыслен. Такие строки
                              заведены ради размера рынка в деньгах, который
                              статистика печатает только по провинции целиком. */}
                          {m.players_counted_at
                            ? dayRu(m.players_counted_at)
                            : m.players_count === null || m.players_count === undefined
                              ? 'точки не считаются'
                              : 'не считалось'}
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

      {/* ── Национальные и отраслевые рынки ───────────────────────────────── */}
      {GEN_NAMED_MARKETS.length > 0 && (
        <>
          <div id="vn-national" className="section-head">
            <h2 className="section-title">Рынки, где игроки названы поимённо</h2>
            <p className="section-lead">
              Национальные и отраслевые рынки живут только в графе: игроков там не считает карта,
              их перечисляют связи с компаниями. Счёт здесь качественнее, чем по зонам, потому что
              это компании с именами, а не точки OpenStreetMap. Складывать с зонами нельзя: это
              другой периметр и другая единица.
            </p>
          </div>
          <div className="list">
            {GEN_NAMED_MARKETS.map((m) => (
              <div className="list-row" key={m.slug}>
                <span className="list-main">
                  <span>{m.name_ru}</span>
                  {m.region_slug && <span className="meta"> · {regionName(m.region_slug)}</span>}
                  <span className="stat-note">{m.players.map((p) => p.name).join(' · ')}</span>
                </span>
                <Val className="list-side" value={String(m.players.length)} unit="игроков" />
              </div>
            ))}
          </div>

          <div className="hair" />
        </>
      )}

      {/* ── Возможности ───────────────────────────────────────────────────── */}
      <div id="vn-opportunity" className="section-head">
        <h2 className="section-title">Возможности по зонам</h2>
        <p className="section-lead">
          Оценка возможности считается обходом рынков и живёт в базе строкой. Это не прогноз выручки,
          а порядок «где меньше всего занято при том же спросе»: население зоны делится на число
          размеченных точек и сравнивается с медианой по региону. Посчитана у {SCORED} строк из{' '}
          {GEN_MARKETS.length}; {GEN_MARKETS.length - SCORED} остались без оценки, потому что
          населения их зоны база не знает. Пояснение под каждой строкой - это числа, из которых
          оценка собрана, вместе с поправкой на редко размеченную карту.
        </p>
        <details className="note note--warn">
          <summary className="kicker">Чего в этом списке нет</summary>
          <p className="section-lead">
            {BLIND_SPOTS} строк сюда не попали, хотя оценка у них около пяти: граф пометил их как{' '}
            <span className="code">no_data:osm_sparse</span>. Ноль заведений при плотности разметки
            1,1 точки на 10 тысяч жителей и ноль при 62 это разные нули: в первом случае найдена не
            дыра на рынке, а неразмеченный кусок карты. В таблице выше такие строки помечены
            «карта редкая».
          </p>
        </details>
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
        <h2 className="section-title">Созвездие: кто с кем связан</h2>
        <p className="section-lead">
          Граф из таблиц entities, edges и entity_metrics. В центре счёт узлов, кольцом - группы по
          видам, лента между группами толщиной в число связей. Клик по группе раскрывает её состав,
          клик по узлу показывает его связи и показатели. Связей в графе {generatedCounts.edges},
          на экран из них едут только те, где оба конца не заголовок новостной ленты.
        </p>
      </div>
      {GEN_ENTITIES.length === 0 ? (
        <Gap
          what="Графа сущностей в выгрузке нет"
          why={`Таблиц ${['entities', 'edges', 'entity_metrics'].filter((t) => missingTables.includes(t)).join(', ') || 'entities, edges, entity_metrics'} в базе ещё нет: их заводит миграция 0004. Маршрут #/vietnam/entity/<slug> уже работает и честно говорит, что сущности нет.`}
        />
      ) : (
        <VietnamGraph
          routeSlug={route?.domain === 'vietnam' && route.kind === 'entity' ? route.a : null}
          regionName={regionName}
          regionLevel={regionLevel}
        />
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

      </div>
      <Toc />
      </div>
    </>
  );
}
