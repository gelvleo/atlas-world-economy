import { useMemo, useState } from 'react';
import type { AtlasRoute } from '../ui/hashRoute';
import type { SectionId } from '../types';
import Val from '../ui/num';
import { Bars, Shares, type Point } from '../ui/charts';
import { ComparableTrend } from '../ui/ComparableTrend';
import { NODE_MAP } from '../data/nodes';
import { VIETNAM_CHAINS, VIETNAM_FLOWS } from '../data/vietnam';
import {
  GEN_EVENTS,
  GEN_REGIONS,
  GEN_STATS,
  type GenRegion,
  type GenStat
} from '../data/vietnam.generated';
import {
  comparableRegionRows,
  regionsForPerimeter,
  selectComparableSeries
} from '../ui/vietnamSelectors';
import VietnamDb from './VietnamDb';
import VietnamGraph from './VietnamGraph';
import VietnamTimeline from './VietnamTimeline';

type WorkspaceTab = 'overview' | 'hypotheses' | 'regions' | 'connections' | 'calendar' | 'data';

const TABS: { id: WorkspaceTab; label: string }[] = [
  { id: 'overview', label: 'Картина рынка' },
  { id: 'hypotheses', label: 'Гипотезы' },
  { id: 'regions', label: 'Регионы' },
  { id: 'connections', label: 'Связи' },
  { id: 'calendar', label: 'Календарь' },
  { id: 'data', label: 'Данные' }
];

interface Props {
  openNode: (id: string) => void;
  goTo: (s: SectionId) => void;
  route: AtlasRoute | null;
}

const countryStat = (metric: string, period?: string) =>
  GEN_STATS.find(
    (row) => row.region_slug === 'vn' && row.metric === metric && row.value !== null && Number.isFinite(Number(row.value)) && (!period || row.period === period)
  );

const fmt = (value: number | null | undefined, unit?: string | null) => {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) return 'нет данных';
  if (unit === 'percent') return Number(value).toFixed(2).replace('.', ',');
  return Math.round(Number(value)).toLocaleString('ru-RU');
};

const fmtShort = (value: number) => {
  const abs = Math.abs(value);
  if (abs >= 1e12) return `${(value / 1e12).toFixed(1).replace('.', ',')} трлн`;
  if (abs >= 1e9) return `${(value / 1e9).toFixed(1).replace('.', ',')} млрд`;
  if (abs >= 1e6) return `${(value / 1e6).toFixed(1).replace('.', ',')} млн`;
  return Math.round(value).toLocaleString('ru-RU');
};

type SourceData = Pick<GenStat, 'period' | 'source_note' | 'source_url'>;

function Source({ stat }: { stat?: SourceData }) {
  if (!stat) return <span className="meta">Источник не найден</span>;
  return (
    <span className="meta">
      {stat.period ?? 'без периода'} · {stat.source_note ?? 'источник снимка'}{' '}
      {stat.source_url && (
        <a href={stat.source_url} target="_blank" rel="noreferrer">
          Открыть источник
        </a>
      )}
    </span>
  );
}

function WorkspaceNav({ active, onChange }: { active: WorkspaceTab; onChange: (tab: WorkspaceTab) => void }) {
  return (
    <nav className="vn-tabs" aria-label="Рабочее пространство Вьетнама">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          className="vn-tab"
          aria-current={active === tab.id ? 'page' : undefined}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}

function LegacyVietnamLayer({ openNode }: { openNode: (id: string) => void }) {
  return (
    <details className="note vn-legacy-layer">
      <summary className="kicker">Сохранённый слой потоков и цепочек</summary>
      <p className="section-lead">Вьетнамские связи остаются доступны как контекст: здесь показаны все цепочки и потоки этого домена.</p>
      <div className="list">
        {VIETNAM_CHAINS.map((chain) => (
          <div className="list-row" key={chain.id}>
            <span className="list-main">
              <span>{chain.title}</span>
              <span className="stat-note">{chain.insight}</span>
              <span className="row row--wrap">
                {chain.nodes.map((id) => <button className="link" key={id} onClick={() => openNode(id)}>{NODE_MAP[id]?.name ?? id}</button>)}
              </span>
            </span>
          </div>
        ))}
        {VIETNAM_FLOWS.map((flow) => {
          return (
            <div className="list-row" key={flow.id}>
              <span className="list-main">
                <span>{flow.label}</span>
                <span className="stat-note">
                  <button className="link" onClick={() => openNode(flow.from)}>{NODE_MAP[flow.from]?.name ?? flow.from}</button>
                  {' → '}
                  <button className="link" onClick={() => openNode(flow.to)}>{NODE_MAP[flow.to]?.name ?? flow.to}</button>
                  {' · '}{flow.description}
                </span>
                <span className="meta">Источники участников — в карточках; источник самого потока отдельно не указан.</span>
              </span>
              <Val className="list-side" value={flow.value} />
            </div>
          );
        })}
      </div>
    </details>
  );
}

function Overview({ openNode, goTo }: { openNode: (id: string) => void; goTo: (s: SectionId) => void }) {
  const activeBusinesses = selectComparableSeries(GEN_STATS, {
    regionSlug: 'vn', metric: 'businesses_active', unit: 'unit',
    sourceUrl: 'https://pxweb.nso.gov.vn/api/v1/vi/Doanh%20nghi%E1%BB%87p/V05.04.px', frequency: 'annual'
  });
  const registeredBusinesses = selectComparableSeries(GEN_STATS, {
    regionSlug: 'vn', metric: 'businesses_registered_year', unit: 'unit',
    sourceUrl: 'https://pxweb.nso.gov.vn/api/v1/vi/Doanh%20nghi%E1%BB%87p/V05.02.px', frequency: 'annual'
  });
  const shareRows = ['share_agriculture_pct', 'share_industry_pct', 'share_services_pct']
    .map((metric) => countryStat(metric, '2025'));
  const shares: Point[] = shareRows.every(
    (row) => row?.value !== null && row?.value !== undefined && Number.isFinite(Number(row.value))
  )
    ? [{
        period: '2025', agriculture: Number(shareRows[0]!.value),
        industry: Number(shareRows[1]!.value), services: Number(shareRows[2]!.value)
      }]
    : [];
  const kpis = [
    { label: 'ВВП', value: countryStat('gdp_usd', '2025'), unit: 'USD', note: 'текущие доллары, 2025' },
    { label: 'Рост ВВП', value: countryStat('gdp_growth_pct', '2025'), unit: '%', note: 'годовой рост, 2025' },
    { label: 'Экспорт товаров', value: countryStat('exports_goods_usd', '2025'), unit: 'USD', note: 'только товары, 2025' },
    { label: 'Цифровая экономика', value: countryStat('digital_economy_gmv_usd', '2025'), unit: 'USD', note: 'оценка GMV, 2025' }
  ];
  return (
    <div className="vn-screen">
      <div className="section-head">
        <div className="kicker">Национальный периметр · Вьетнам</div>
        <h1 className="section-title">Картина рынка</h1>
        <p className="section-lead">Сигналы страны собраны в одном периметре. Период, единица и источник видны рядом с каждым числом.</p>
      </div>
      <div className="stats vn-kpis">
        {kpis.map((item) => (
          <div className="stat" key={item.label}>
            <span className="stat-label">{item.label}</span>
            <span className="stat-num">
              {item.value ? (item.unit === '%' ? fmt(item.value.value, item.value.unit) : fmtShort(Number(item.value.value))) : 'нет данных'}
              <span className="stat-unit">{item.value ? item.unit : ''}</span>
            </span>
            <span className="stat-note">{item.note} · {item.value?.source_type === 'analyst' ? 'оценка' : 'официальный ряд'}</span>
            <Source stat={item.value} />
          </div>
        ))}
      </div>
      <div className="grid grid--2 vn-chart-grid">
        <ComparableTrend series={activeBusinesses} title="Действующие предприятия" note="NSO V05.04 · запас организаций" unit="шт." />
        <ComparableTrend series={registeredBusinesses} title="Новые регистрации" note="NSO V05.02 · поток за год" unit="шт." />
      </div>
      <div className="grid grid--55 vn-chart-grid">
        {shares.length ? <Shares data={shares} series={[{ key: 'agriculture', label: 'сельское хозяйство' }, { key: 'industry', label: 'промышленность' }, { key: 'services', label: 'услуги' }]} title="Структура добавленной стоимости" note={<><span>Источники: </span>{shareRows.map((row, index) => <span key={row?.metric ?? index}><Source stat={row} />{index < shareRows.length - 1 ? ' · ' : ''}</span>)}<span> · доли не дают 100 %: остаток — налоги за вычетом субсидий</span></>} /> : <div className="empty">Структура добавленной стоимости не покрыта одним полным срезом.</div>}
        <div className="vn-evidence-panel"><div className="kicker">Как читать сигналы</div><h2 className="section-title">Размер страны задаёт проверку, а не ответ</h2><p className="section-lead">Доля цифровой экономики и число предприятий показывают масштаб. Платёжеспособный спрос нужно проверить через плательщика, конкретную боль и короткий эксперимент.</p><a className="btn btn--ghost" href="#/vietnam/section/hypotheses">Перейти к гипотезам</a></div>
      </div>
      <LegacyVietnamLayer openNode={openNode} />
    </div>
  );
}

const HYPOTHESES = [
  {
    title: 'Языковая практика для сервисных работников', payer: 'Отель, кафе или клиника',
    problem: 'Сотруднику сложно обслуживать иностранного клиента в живом сценарии.',
    metric: 'tourists_intl', period: '2025', evidence: 'Международные прибытия',
    node: 'sector:tourism', nodeLabel: 'Туризм',
    unknown: 'Кто платит за обучение и какое улучшение сервиса замечает руководитель.',
    test: 'Две недели практики для одной смены; измерить долю диалогов без переключения языка.',
    keep: 'Продолжать, если растёт доля завершённых диалогов и руководитель продлевает тест.'
  },
  {
    title: 'Мультиязычная работа с клиентами', payer: 'Небольшая сеть туризма или retail',
    problem: 'Перевод есть, но менеджеру трудно быстро ответить и не потерять контекст заказа.',
    metric: 'tourists_intl', period: '2025', evidence: 'Международные прибытия',
    node: 'sector:retail', nodeLabel: 'Розница',
    unknown: 'Готовность платить за рабочий процесс, а не за сам факт перевода.',
    test: 'Подключить 10 обращений в день к одной точке; сравнить время ответа и завершённые заказы.',
    keep: 'Продолжать, если время ответа снижается без падения завершённых заказов.'
  },
  {
    title: 'Операционная координация малого бизнеса', payer: 'Владелец компании с повторяющимися задачами',
    problem: 'Задачи, заявки и смены распадаются по чатам и таблицам.',
    metric: 'businesses_active', period: '2024', evidence: 'Действующие предприятия',
    node: 'sector:retail', nodeLabel: 'Розница',
    unknown: 'Какая операция повторяется достаточно часто, чтобы окупить внедрение.',
    test: 'Разобрать один процесс за 7 дней; считать часы владельца и пропущенные заявки до и после.',
    keep: 'Продолжать, если экономия времени подтверждена и владелец готов платить за следующий процесс.'
  }
];

function HypothesisCard({ item }: { item: (typeof HYPOTHESES)[number] }) {
  const stat = countryStat(item.metric, item.period);
  return <article className="vn-hypothesis"><div className="kicker">Гипотеза</div><h2>{item.title}</h2><dl>
    <div><dt>Плательщик</dt><dd>{item.payer}</dd></div>
    <div><dt>Проблема</dt><dd>{item.problem}</dd></div>
    <div><dt>Что уже видно</dt><dd>{item.evidence}: {fmt(stat?.value, stat?.unit)} {unitLabel(stat?.unit)} · <Source stat={stat} /></dd></div>
    <div><dt>Узел для проверки</dt><dd><a href={`#/vietnam/entity/${item.node}`}>Открыть узел «{item.nodeLabel}»</a></dd></div>
    <div><dt>Неизвестно</dt><dd>{item.unknown}</dd></div>
    <div><dt>Тест</dt><dd>{item.test}</dd></div>
    <div><dt>Критерий продолжения</dt><dd>{item.keep}</dd></div>
  </dl></article>;
}

function Hypotheses() {
  return <div className="vn-screen"><div className="section-head"><div className="kicker">Редакционная рабочая гипотеза</div><h1 className="section-title">Гипотезы для дешёвого эксперимента</h1><p className="section-lead">Это направления проверки, не обнаруженные рыночные факты и не гарантии прибыли. Сначала плательщик и наблюдаемая боль, затем тест.</p></div><div className="vn-hypotheses">{HYPOTHESES.map((item) => <HypothesisCard key={item.title} item={item} />)}</div></div>;
}

function regionLabel(region: GenRegion) { return region.name_ru ?? region.name_vi ?? region.slug; }
function unitLabel(unit: string | null | undefined) { return unit === 'person' ? 'чел.' : unit === 'km2' ? 'км²' : unit === 'unit' ? 'шт.' : unit ?? ''; }

function Regions() {
  const [perimeter, setPerimeter] = useState<'post-2025' | 'pre-2025'>('post-2025');
  const [metric, setMetric] = useState('population');
  const [period, setPeriod] = useState('2025');
  const provinces = useMemo(() => regionsForPerimeter(GEN_REGIONS, perimeter), [perimeter]);
  const availableMetrics = useMemo(() => [...new Set(GEN_STATS.filter((stat) => provinces.some((region) => region.slug === stat.region_slug) && stat.value !== null).map((stat) => stat.metric))].filter((item) => ['population', 'area_km2', 'businesses_active', 'businesses_registered_year'].includes(item)), [provinces]);
  const actualMetric = availableMetrics.includes(metric) ? metric : availableMetrics[0] ?? 'population';
  const periods = useMemo(() => [...new Set(GEN_STATS.filter((stat) => provinces.some((region) => region.slug === stat.region_slug) && stat.metric === actualMetric && stat.value !== null).map((stat) => stat.period).filter(Boolean) as string[])].sort().reverse(), [provinces, actualMetric]);
  const actualPeriod = periods.includes(period) ? period : periods[0] ?? '';
  const unit = actualMetric === 'population' ? 'person' : actualMetric === 'area_km2' ? 'km2' : 'unit';
  const result = comparableRegionRows(GEN_STATS, GEN_REGIONS, { perimeter, metric: actualMetric, period: actualPeriod, unit });
  const bars = result.rows.filter((row) => row.stat).map((row) => ({ label: regionLabel(row.region), value: Number(row.stat!.value) })).sort((a, b) => b.value - a.value).slice(0, 12);
  const metricLabel = actualMetric === 'population' ? 'Население' : actualMetric === 'area_km2' ? 'Площадь' : actualMetric === 'businesses_active' ? 'Действующие предприятия' : 'Новые предприятия за год';
  return <div className="vn-screen"><div className="section-head"><div className="kicker">Единый срез провинций</div><h1 className="section-title">Регионы</h1><p className="section-lead">Сравнение держит одинаковые административные границы, метрику, период и единицу. Пропуск означает отсутствие наблюдения, а не ноль.</p></div><div className="vn-controls" role="group" aria-label="Параметры сравнения"><label>Границы<select className="field" value={perimeter} onChange={(event) => { setPerimeter(event.target.value as typeof perimeter); setPeriod('2025'); }}><option value="post-2025">После объединения 2025 · 34 провинции</option><option value="pre-2025">До объединения 2025 · 63 провинции</option></select></label><label>Показатель<select className="field" value={actualMetric} onChange={(event) => { setMetric(event.target.value); setPeriod('2025'); }}>{availableMetrics.map((item) => <option key={item} value={item}>{item === 'population' ? 'Население' : item === 'area_km2' ? 'Площадь' : item === 'businesses_active' ? 'Действующие предприятия' : 'Новые предприятия за год'}</option>)}</select></label><label>Период<select className="field" value={actualPeriod} onChange={(event) => setPeriod(event.target.value)}>{periods.map((item) => <option key={item}>{item}</option>)}</select></label></div><div className="vn-coverage"><strong>{result.covered}</strong> из {result.rows.length} провинций покрыты · {result.missing} без наблюдения{result.conflicts ? ` · ${result.conflicts} с конфликтом` : ''} · {unitLabel(unit)}</div>{bars.length > 1 && <Bars rows={bars} unit={unitLabel(unit)} title="Крупнейшие покрытые провинции" note={`${metricLabel} · ${actualPeriod} · показаны только покрытые строки`} />}<div className="table-wrap"><table className="table"><thead><tr><th>Провинция</th><th>Периметр</th><th className="num">Значение</th><th>Источник</th></tr></thead><tbody>{result.rows.map(({ region, stat, conflict }) => <tr key={region.slug}><td><a href={`#/vietnam/region/${region.slug}`}>{regionLabel(region)}</a><span className="meta"> · {region.name_vi ?? region.slug}</span></td><td>{perimeter}</td><td className="num">{conflict ? <span className="tag tag--warn">конфликт</span> : stat ? <Val value={fmt(Number(stat.value), stat.unit)} unit={unitLabel(stat.unit)} /> : '—'}</td><td>{conflict ? <a href={`#/vietnam/region/${region.slug}`}>Сравнить спорные источники</a> : stat ? <Source stat={stat} /> : <span className="meta">нет строки за этот период</span>}</td></tr>)}</tbody></table></div><p className="stat-note">Старые и новые провинции нельзя суммировать в одну страновую оценку. Периметр и ссылка на источник остаются свойствами каждой строки.</p></div>;
}

function Connections({ route }: { route: AtlasRoute | null }) {
  const routeSlug = route?.domain === 'vietnam' && route.kind === 'entity' ? route.a : null;
  const names = new Map(GEN_REGIONS.map((region) => [region.slug, region.name_ru ?? region.name_vi ?? region.slug]));
  const levels = new Map(GEN_REGIONS.map((region) => [region.slug, region.level]));
  return <div className="vn-screen"><div className="section-head"><h1 className="section-title">Связи рынка</h1></div><VietnamGraph routeSlug={routeSlug} regionName={(slug) => names.get(slug) ?? slug} regionLevel={(slug) => levels.get(slug) ?? null} /></div>;
}

function Calendar() { return <div className="vn-screen"><div className="section-head"><h1 className="section-title">Календарь спроса</h1></div><VietnamTimeline events={GEN_EVENTS} mobility={[]} mobilityRegion="" /></div>; }

function DataCatalog({ route }: { route: AtlasRoute | null }) {
  const local = route?.a === 'vn-lamdong-ductrong-lienkhuong';
  return <div className="vn-screen"><div className="section-head"><div className="kicker">Подробный каталог</div><h1 className="section-title">Данные</h1><p className="section-lead">{local ? 'Локальный срез открыт явно по ссылке. Его строки относятся к выбранной территории и не подменяют национальный ряд.' : 'По умолчанию каталог начинается со всей страны. Локальный срез выбирается явно в блоке регионов.'}</p><a className="btn btn--ghost" href="#/vietnam/region/vn-lamdong-ductrong-lienkhuong">Открыть срез рядом с DLI · Liên Khương</a></div><VietnamDb initialScope={local ? 'lamdong' : 'country'} /></div>;
}

export default function VietnamWorkspace({ route, goTo, openNode }: Props) {
  const aliases: Record<string, WorkspaceTab> = { search: 'data', calendar: 'calendar', regions: 'regions', employment: 'data', markets: 'data', national: 'data', opportunity: 'hypotheses', entities: 'connections', sweeps: 'data', mobility: 'calendar' };
  const requested = route?.domain === 'vietnam' && route.kind === 'section' ? aliases[route.a] ?? route.a as WorkspaceTab : route?.kind === 'entity' ? 'connections' : route?.kind === 'region' || route?.kind === 'market' ? 'data' : 'overview';
  const active = TABS.some((tab) => tab.id === requested) ? requested : 'overview';
  const changeTab = (tab: WorkspaceTab) => { window.location.hash = `#/vietnam/section/${tab}`; };
  return <div className="vn-workspace"><WorkspaceNav active={active} onChange={changeTab} /><div className="vn-screen-wrap">{active === 'overview' && <Overview goTo={goTo} openNode={openNode} />}{active === 'hypotheses' && <Hypotheses />}{active === 'regions' && <Regions />}{active === 'connections' && <Connections route={route} />}{active === 'calendar' && <Calendar />}{active === 'data' && <DataCatalog route={route} />}</div></div>;
}

export { HYPOTHESES };
