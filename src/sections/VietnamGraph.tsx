// Созвездие графа региона.
//
// Механика взята с экрана /admin/brain-flow платформы Comuni
// (components/brain-flow/BrainCanvas.tsx, lib/brain-flow/rings.ts): ядро в
// центре, вокруг кольцо ГРУПП по видам сущностей, клик по группе раскрывает её
// состав, клик по узлу показывает его связи. Перенесены геометрия и подача,
// зависимости донора (Next.js, lucide, shadcn) не переносились.
//
// Отличия от донора по делу:
//   · цвета вида здесь нет. В доноре у каждого вида свой тон, у нас видов
//     одиннадцать, а контракт атласа держит одну акцентную краску. Группу
//     называет подпись рядом с пузырём, а не оттенок: одиннадцать различимых
//     тонов всё равно не существует, это правило скилла dataviz.
//   · раскладка чистая и детерминированная, симуляции нет: узлов 1 087.
//   · граф грузится по требованию из public/data/vietnam-graph.json, а не
//     лежит в бандле: 1,1 МБ в модуле оплачивал бы каждый, кто открыл атлас.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GEN_ENTITIES, GEN_ENTITY_METRICS } from '../data/vietnam.generated';
import { Bars } from '../ui/charts';
import Val from '../ui/num';
import {
  nationalMarketNodes,
  isBusinessEdge,
  searchGraphNodes,
  validateGraphData,
  type GraphEdge,
  type GraphFile,
  type GraphNode
} from './vietnam-graph.helpers';
import './vietnam-graph.css';

// ─── Данные ───────────────────────────────────────────────────────────────────

export type { GraphEdge, GraphFile, GraphNode } from './vietnam-graph.helpers';

const KIND_LABEL: Record<string, string> = {
  company: 'компании',
  brand: 'бренды',
  person: 'люди',
  market: 'рынки',
  region: 'места',
  sector: 'отрасли',
  product: 'продукты',
  event: 'события',
  institution: 'институты',
  place: 'объекты',
  technology: 'технологии'
};
const KIND_ONE: Record<string, string> = {
  company: 'компания',
  brand: 'бренд',
  person: 'человек',
  market: 'рынок',
  region: 'место',
  sector: 'отрасль',
  product: 'продукт',
  event: 'событие',
  institution: 'институт',
  place: 'объект',
  technology: 'технология'
};
const kindLabel = (k: string | null) => KIND_LABEL[k ?? ''] ?? k ?? 'прочее';
const kindOne = (k: string | null) => KIND_ONE[k ?? ''] ?? kindLabel(k);

const RELATION_LABEL: Record<string, string> = {
  located_in: 'находится в',
  co_mentioned_with: 'упоминается рядом с',
  operates_market: 'работает на рынке',
  sells_in: 'продаёт в',
  competes_with: 'конкурирует с',
  subsidiary_of: 'дочерняя компания',
  owns: 'владеет',
  regulated_by: 'регулируется',
  affected_by: 'зависит от',
  founded_by: 'основана',
  produces: 'производит',
  supplies: 'поставляет',
  serves_segment: 'обслуживает сегмент',
  employed_by: 'работает в',
  partnered_with: 'партнёр',
  acquired: 'купила',
  invested_in: 'вложилась в',
  precedes: 'предшествует',
  member_of: 'входит в'
};
const relationLabel = (r: string | null) => RELATION_LABEL[r ?? ''] ?? r ?? 'связь';

// ─── Геометрия колец (порт lib/brain-flow/rings.ts) ───────────────────────────

const r4 = (v: number) => Math.round(v * 1e4) / 1e4;
const onEllipse = (cx: number, cy: number, rx: number, ry: number, a: number) => ({
  x: r4(cx + Math.cos(a) * rx),
  y: r4(cy + Math.sin(a) * ry)
});
/** n равных углов, первый сверху, дальше по часовой. */
const evenAngles = (n: number, start = -Math.PI / 2) =>
  n <= 0 ? [] : Array.from({ length: n }, (_, i) => r4(start + (i / n) * 2 * Math.PI));
/** Куда цеплять подпись, чтобы она уходила от центра, а не на него. */
const anchorFor = (dx: number): 'start' | 'middle' | 'end' =>
  dx > 0.25 ? 'start' : dx < -0.25 ? 'end' : 'middle';
/** Радиус пузыря: по корню из числа узлов - площадь пропорциональна счёту. */
const bubbleR = (n: number, max: number, min: number, top: number) =>
  max <= 0 ? min : r4(min + (top - min) * Math.sqrt(Math.max(0, n) / max));

const trim = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

interface Geom {
  W: number; H: number; cx: number; cy: number; core: number;
  kindRx: number; kindRy: number; bubMin: number; bubMax: number;
  ringRx: number; ringRy: number; fs: number; pad: number;
}
const WIDE: Geom = { W: 940, H: 600, cx: 470, cy: 296, core: 60, kindRx: 172, kindRy: 168, bubMin: 12, bubMax: 32, ringRx: 330, ringRy: 244, fs: 1, pad: 72 };
// Узкий экран: полотно вытянуто по вертикали, подписи крупнее - после сжатия
// до 358 px кегль 11 превращается в нечитаемые 6 px.
const NARROW: Geom = { W: 520, H: 760, cx: 260, cy: 380, core: 74, kindRx: 156, kindRy: 250, bubMin: 18, bubMax: 40, ringRx: 132, ringRy: 330, fs: 1.7, pad: 24 };

const ACCENT = '#14568C';
const ACCENT_INK = '#0F4272';
const INK = '#18181B';
const INK_3 = '#8A8A93';
const HAIR = '#E7E7EA';
const SURFACE = '#FFFFFF';

const RING_CAP = 20;
const RING_CAP_NARROW = 10;

// ─── Раздел ───────────────────────────────────────────────────────────────────

const LEVEL_LABEL: Record<string, string> = {
  country: 'страна',
  province: 'провинция',
  district: 'район',
  commune: 'община',
  zone: 'зона'
};

interface Props {
  /** Слаг узла из маршрута #/vietnam/entity/<slug>: созвездие открывается на нём. */
  routeSlug: string | null;
  /** Имя региона по слагу - словарь живёт в разделе, дублировать его незачем. */
  regionName: (slug: string) => string;
  /** Уровень региона по слагу: нужен режиму «Слои». */
  regionLevel: (slug: string) => string | null;
}

export default function VietnamGraph({ routeSlug, regionName, regionLevel }: Props) {
  const [graph, setGraph] = useState<GraphFile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [mode, setMode] = useState<'constellation' | 'layers'>('constellation');
  const [edgeLens, setEdgeLens] = useState<'business' | 'all'>('business');
  const [openKind, setOpenKind] = useState<string | null>(null);
  const [focus, setFocus] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [narrow, setNarrow] = useState(() => window.innerWidth < 768);
  const box = useRef<HTMLDivElement>(null);

  // Ширину слушаем сами: геометрия кольца на телефоне другая, а не сжатая.
  useEffect(() => {
    const onResize = () => setNarrow(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Валидируем снимок до построения индексов: частичный JSON не должен
  // превращаться в пустой граф и выглядеть как отсутствие связей.
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    setGraph(null);
    fetch(`${import.meta.env.BASE_URL}data/vietnam-graph.json`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((d: unknown) => {
        const checked = validateGraphData(d);
        if (!checked.ok) throw new Error(checked.error);
        if (alive) setGraph(checked.value);
      })
      .catch((e: unknown) => alive && setError(e instanceof Error ? e.message : 'неизвестная ошибка'))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [loadAttempt]);

  // Маршрут на сущность открывает её в созвездии.
  useEffect(() => {
    if (routeSlug) { setFocus(routeSlug); setOpenKind(null); setMode('constellation'); }
    else setFocus(null);
  }, [routeSlug]);

  const nodeBySlug = useMemo(
    () => new Map((graph?.nodes ?? []).map((n) => [n.slug, n])),
    [graph]
  );

  const pickNode = useCallback((id: string) => {
    if (!nodeBySlug.has(id)) return;
    setFocus(id);
    setOpenKind(null);
    setMode('constellation');
    setQuery('');
    const hash = `#/vietnam/entity/${encodeURIComponent(id)}`;
    if (window.location.hash !== hash) window.location.hash = hash;
  }, [nodeBySlug]);

  const leaveEntityRoute = useCallback(() => {
    if (window.location.hash.startsWith('#/vietnam/entity/')) window.location.hash = '#/vietnam/section/entities';
  }, []);

  const visibleEdges = useMemo(
    () => (graph?.edges ?? []).filter((edge) => edgeLens === 'all' || isBusinessEdge(edge)),
    [graph, edgeLens]
  );

  const visibleDegreeByNode = useMemo(() => {
    const degrees = new Map<string, number>();
    for (const edge of visibleEdges) {
      degrees.set(edge.src, (degrees.get(edge.src) ?? 0) + 1);
      degrees.set(edge.dst, (degrees.get(edge.dst) ?? 0) + 1);
    }
    return degrees;
  }, [visibleEdges]);

  const renderedNodes = useMemo(
    () => edgeLens === 'business'
      ? (graph?.nodes ?? []).filter((node) => visibleDegreeByNode.has(node.slug))
      : (graph?.nodes ?? []),
    [graph, edgeLens, visibleDegreeByNode]
  );

  // Связи по узлу: индекс строится один раз на выгрузку, перебирать 5 020 рёбер
  // на каждый клик незачем.
  const edgesByNode = useMemo(() => {
    const map = new Map<string, GraphEdge[]>();
    for (const e of visibleEdges) {
      (map.get(e.src) ?? map.set(e.src, []).get(e.src)!).push(e);
      (map.get(e.dst) ?? map.set(e.dst, []).get(e.dst)!).push(e);
    }
    return map;
  }, [visibleEdges]);

  /** Группы по видам: счёт узлов и сумма их связей. Порядок по числу узлов. */
  const kinds = useMemo(() => {
    const map = new Map<string, { kind: string; n: number; links: number }>();
    for (const n of renderedNodes) {
      const k = n.kind ?? 'прочее';
      const row = map.get(k) ?? { kind: k, n: 0, links: 0 };
      row.n += 1;
      row.links += visibleDegreeByNode.get(n.slug) ?? 0;
      map.set(k, row);
    }
    return [...map.values()].sort((a, b) => b.n - a.n);
  }, [renderedNodes, visibleDegreeByNode]);

  /** Ленты «вид ↔ вид»: сколько рёбер связывает пару групп. Десяток самых
   *  толстых, иначе на экране 60 линий и читать нечего. */
  const pairs = useMemo(() => {
    const map = new Map<string, { a: string; b: string; n: number }>();
    for (const e of visibleEdges) {
      const ka = nodeBySlug.get(e.src)?.kind ?? '';
      const kb = nodeBySlug.get(e.dst)?.kind ?? '';
      if (!ka || !kb || ka === kb) continue;
      const [a, b] = ka < kb ? [ka, kb] : [kb, ka];
      const key = `${a}|${b}`;
      const row = map.get(key) ?? { a, b, n: 0 };
      row.n += 1;
      map.set(key, row);
    }
    return [...map.values()].sort((x, y) => y.n - x.n).slice(0, 12);
  }, [visibleEdges, nodeBySlug]);

  const focusNode = focus ? nodeBySlug.get(focus) ?? null : null;
  const focusEdges = useMemo(() => {
    if (!focus) return [];
    return (edgesByNode.get(focus) ?? [])
      .slice()
      .sort((a, b) => (a.relation ?? '').localeCompare(b.relation ?? '') || a.dst.localeCompare(b.dst));
  }, [focus, edgesByNode]);
  const focusAllEdges = useMemo(
    () => (focus ? (graph?.edges ?? []).filter((edge) => edge.src === focus || edge.dst === focus) : []),
    [focus, graph]
  );

  const focusMetrics = useMemo(
    () => (focus ? GEN_ENTITY_METRICS.filter((m) => m.entity_slug === focus) : []),
    [focus]
  );

  const hits = useMemo(() => {
    return searchGraphNodes(graph?.nodes ?? [], query, GEN_ENTITIES);
  }, [query, graph]);

  const nationalMarkets = useMemo(
    () => nationalMarketNodes(graph?.nodes ?? []),
    [graph]
  );

  // Режим «Слои»: сколько сущностей графа привязано к каждому уровню регионов.
  const layers = useMemo(() => {
    if (!graph) return [];
    const map = new Map<string, number>();
    for (const n of graph.nodes) {
      const level = n.region_slug ? regionLevel(n.region_slug) : null;
      const key = level ? LEVEL_LABEL[level] ?? level : n.region_slug ? 'вне реестра мест' : 'без привязки к месту';
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return [...map.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
  }, [graph, regionLevel]);

  if (error) {
    return (
      <div className="empty graph-state">
        <span className="empty-title">Граф не загрузился</span>
        <span>
          Файл <span className="code">public/data/vietnam-graph.json</span> не отдался: {error}. Его пишет{' '}
          <span className="code">npm run pull</span> вместе с остальной выгрузкой.
        </span>
        <button className="btn btn--ghost" type="button" onClick={() => setLoadAttempt((attempt) => attempt + 1)}>
          Повторить загрузку
        </button>
      </div>
    );
  }
  if (loading || !graph) {
    return (
      <div className="stack graph-state" aria-busy="true">
        <div className="skeleton" style={{ height: 24, width: 220 }} />
        <div className="skeleton" style={{ height: 360 }} />
      </div>
    );
  }
  if (graph.nodes.length === 0) {
    return (
      <div className="empty graph-state">
        <span className="empty-title">В снимке нет узлов</span>
        <span>Проверьте выгрузку графа: пустой список не означает отсутствие бизнеса.</span>
        <button className="btn btn--ghost" type="button" onClick={() => setLoadAttempt((attempt) => attempt + 1)}>
          Повторить загрузку
        </button>
      </div>
    );
  }
  if (routeSlug && !focusNode) {
    return (
      <div className="empty graph-state">
        <span className="empty-title">Узел не найден в снимке</span>
        <span>Сущность «{routeSlug}» отсутствует в текущей выгрузке графа.</span>
        <button className="btn btn--ghost" type="button" onClick={() => { setFocus(null); leaveEntityRoute(); }}>
          Открыть весь граф
        </button>
      </div>
    );
  }

  const g = narrow ? NARROW : WIDE;
  const cap = narrow ? RING_CAP_NARROW : RING_CAP;
  const ringHidden = narrow && !openKind && !focus;
  const maxKind = Math.max(1, ...kinds.map((k) => k.n));
  const angles = evenAngles(kinds.length);
  const bubbles = kinds.map((k, i) => ({
    ...k,
    ...onEllipse(g.cx, g.cy, g.kindRx, g.kindRy, angles[i]),
    r: bubbleR(k.n, maxKind, g.bubMin, g.bubMax)
  }));
  const bubbleOf = new Map(bubbles.map((b) => [b.kind, b]));

  // Кольцо узлов: соседи выбранного → состав раскрытой группы → верхушка графа.
  const ringSource: { slug: string; kind: string | null; name: string; degree: number; via: string | null }[] =
    focusNode
      ? (() => {
          const seen = new Set<string>();
          const out: { slug: string; kind: string | null; name: string; degree: number; via: string | null }[] = [];
          for (const e of focusEdges) {
            const other = e.src === focus ? e.dst : e.src;
            if (seen.has(other)) continue;
            seen.add(other);
            const n = nodeBySlug.get(other);
            if (n) out.push({ ...n, degree: visibleDegreeByNode.get(n.slug) ?? 0, via: e.relation });
          }
          return out.slice(0, cap);
        })()
      : (openKind
          ? renderedNodes.filter((n) => (n.kind ?? 'прочее') === openKind)
          // По умолчанию кольцо показывает настоящую экономику, а не зеркала.
          // Узлы места и рынка почти всегда самые связанные (у Lâm Đồng 251
          // связь), и верхушка графа получалась списком из двенадцати мест, где
          // половина - Ханой и Дананг по два раза: место живёт в базе и в
          // старых границах, и в новых. Свои блоки у мест и рынков стоят выше,
          // а группы «места» и «рынки» на кольце раскрываются кликом.
          : renderedNodes.filter((n) => n.kind !== 'region' && n.kind !== 'market')
        )
          .slice(0, cap)
          .map((n) => ({ ...n, degree: visibleDegreeByNode.get(n.slug) ?? 0, via: null }));

  // Углы кольца: узлы одной группы идут подряд, поэтому каждый оказывается в
  // секторе своей группы и выноска до её пузыря получается короткой.
  const kindOrder = new Map(bubbles.map((b, i) => [b.kind, i]));
  const ordered = focusNode || openKind
    ? ringSource
    : ringSource.slice().sort(
        (a, b) =>
          (kindOrder.get(a.kind ?? 'прочее') ?? 99) - (kindOrder.get(b.kind ?? 'прочее') ?? 99) ||
          b.degree - a.degree
      );
  const ringAngles = evenAngles(ordered.length);
  const ring = ordered.map((n, i) => {
    const a = ringAngles[i];
    const p = onEllipse(g.cx, g.cy, g.ringRx, g.ringRy, a);
    const anchor = anchorFor(Math.cos(a));
    // Через одну подпись отодвигаем дальше: сверху и снизу шаг кольца по
    // горизонтали минимальный, и соседи наезжают друг на друга.
    const pad = (i % 2 ? 24 : 10) * g.fs;
    return {
      ...n,
      ...p,
      anchor,
      lx: r4(p.x + (anchor === 'start' ? pad : anchor === 'end' ? -pad : 0)),
      ly: r4(p.y + (anchor === 'middle' ? (Math.sin(a) > 0 ? pad + 12 : -pad - 4) : 4 * g.fs))
    };
  });

  const totalNodes = renderedNodes.length;
  const allNodes = graph.nodes.length;
  const businessEdgeCount = graph.edges.filter(isBusinessEdge).length;
  const selectedEntity = focus ? GEN_ENTITIES.find((entity) => entity.slug === focus) : undefined;
  const selectedAliases = focusNode
    ? [...new Set([selectedEntity?.name_vi, selectedEntity?.name_ru].filter(
        (alias): alias is string => Boolean(alias) && alias !== focusNode.name
      ))]
    : [];
  const reset = () => {
    setFocus(null);
    setOpenKind(null);
    leaveEntityRoute();
  };

  return (
    <div className="stack stack--loose vietnam-graph">
      <div className="graph-intro">
        <div className="graph-intro-line">
          <span className="kicker">Граф связей</span>
          <span className="h2">Поиск участника и решения</span>
          <span className="meta">Источник → отношение → цель</span>
        </div>
        <div className="graph-counts" aria-label="Размер снимка графа">
            <span><strong>{totalNodes}</strong> узлов слоя / {allNodes} всего</span>
          <span><strong>{businessEdgeCount}</strong> деловых связей</span>
          <span><strong>{graph.edges.length}</strong> всего рёбер</span>
        </div>
      </div>

      <details className="graph-markets">
        <summary className="graph-markets-summary">
          <span><span className="kicker">Точки входа</span> <span className="h2">Национальные рынки</span></span>
          <span className="meta">{nationalMarkets.length} узлов · открыть список</span>
        </summary>
        {nationalMarkets.length > 0 ? (
          <div className="graph-market-list">
            {nationalMarkets.map((market) => (
              <button
                className="graph-market"
                type="button"
                key={market.slug}
                onClick={() => pickNode(market.slug)}
              >
                <span className="graph-market-name">{market.name}</span>
                <span className="graph-market-meta">национальный рынок · {market.degree} связей</span>
              </button>
            ))}
          </div>
        ) : (
          <p className="meta">В текущем снимке нет узлов рынка с национальным охватом.</p>
        )}
      </details>

      <div className="toolbar graph-toolbar">
        <div className="seg" role="group" aria-label="Проекция графа">
          <button className="seg-btn" aria-pressed={mode === 'constellation'} onClick={() => setMode('constellation')}>
            Созвездие
          </button>
          <button className="seg-btn" aria-pressed={mode === 'layers'} onClick={() => setMode('layers')}>
            Слои мест
          </button>
        </div>
        {mode === 'constellation' && (
          <label className="field graph-search">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Vingroup, кофе, Далат"
              aria-label="Поиск узла графа"
            />
          </label>
        )}
        <div className="seg" role="group" aria-label="Состав связей">
          <button className="seg-btn" aria-pressed={edgeLens === 'business'} onClick={() => setEdgeLens('business')}>
            Деловые связи
          </button>
          <button className="seg-btn" aria-pressed={edgeLens === 'all'} onClick={() => setEdgeLens('all')}>
            Все связи
          </button>
        </div>
        {(focus || openKind) && (
          <button className="btn btn--ghost" onClick={reset}>
            Показать весь граф
          </button>
        )}
      </div>

      {mode === 'constellation' && query.trim().length >= 2 && hits.length > 0 && (
        <div className="list graph-search-results" aria-label="Результаты поиска">
          <p className="meta graph-search-summary">Найдено узлов: {hits.length}. Точный и близкий результат выше; список прокручивается.</p>
          {hits.map((n) => (
            <button
              type="button"
              className="list-row"
              key={n.slug}
              onClick={() => pickNode(n.slug)}
            >
              <span className="list-main">
                <span>{n.name}</span>
                <span className="tag">{kindOne(n.kind)}</span>
                {n.region_slug && <span className="stat-note">{regionName(n.region_slug)}</span>}
              </span>
              <Val className="list-side" value={String(n.degree)} unit="связей" />
            </button>
          ))}
        </div>
      )}
      {mode === 'constellation' && query.trim().length >= 2 && hits.length === 0 && (
        <div className="empty graph-search-empty">
          <span className="empty-title">Узел не найден</span>
          <span>Проверьте название, slug или попробуйте вариант без диакритики.</span>
          <button className="btn btn--ghost" type="button" onClick={() => setQuery('')}>Очистить поиск</button>
        </div>
      )}

      <p className="meta graph-lens-note">
        {edgeLens === 'business'
          ? `Деловой слой: ${businessEdgeCount} рёбер. Совместные упоминания и привязка к месту скрыты из рабочей выборки.`
          : `Полный слой: ${graph.edges.length} рёбер. Совместное упоминание не означает причинность или партнёрство.`}
        {' '}Источник связи пока не передан; источники доступны только для метрик узла.
      </p>

      {mode === 'layers' ? (
        <>
          <Bars
            rows={layers}
            unit="сущностей"
            title="Где живут сущности графа"
            note="Уровень места, к которому привязан узел. «Без привязки» это отрасли, технологии и национальные рынки: у них места нет и не должно быть."
          />
          <p className="section-lead">
            Узлов в графе <span className="num">{allNodes}</span>, связей между ними{' '}
            <span className="num">{graph.edges.length}</span>. Заголовки новостных лент
            (<span className="code">kind=source</span>) в граф не едут: это 511 узлов и половина всех
            рёбер, на экране они дают шум, а не смысл.
          </p>
        </>
      ) : (
        <div className="graph-workspace">
        <div className="constellation" ref={box}>
          <svg
            viewBox={`${-g.pad} 0 ${g.W + g.pad * 2} ${g.H}`}
            role="img"
            aria-label={`Созвездие графа региона: ${kinds.length} групп сущностей, ${totalNodes} узлов, ${visibleEdges.length} связей в выбранном слое`}
          >
            {/* Направляющая кольца групп - чтобы кольцо читалось кольцом */}
            <ellipse
              cx={g.cx} cy={g.cy} rx={g.kindRx} ry={g.kindRy}
              fill="none" stroke={HAIR} strokeWidth="1" strokeDasharray="3 6"
            />

            {/* Ленты «вид ↔ вид»: толщина это число связей между группами */}
            {!openKind && !focus && (
              <g>
                {pairs.map((p) => {
                  const a = bubbleOf.get(p.a);
                  const b = bubbleOf.get(p.b);
                  if (!a || !b) return null;
                  const max = Math.max(1, ...pairs.map((x) => x.n));
                  return (
                    <path
                      key={`${p.a}-${p.b}`}
                      d={`M ${a.x} ${a.y} Q ${r4(g.cx + (a.x + b.x - 2 * g.cx) * 0.22)} ${r4(g.cy + (a.y + b.y - 2 * g.cy) * 0.22)} ${b.x} ${b.y}`}
                      fill="none"
                      stroke={ACCENT}
                      strokeWidth={r4(1.5 + (p.n / max) * 10)}
                      opacity="0.14"
                      strokeLinecap="round"
                    >
                      <title>{`${kindLabel(p.a)} и ${kindLabel(p.b)}: ${p.n} связей. Толщина ленты - это число.`}</title>
                    </path>
                  );
                })}
              </g>
            )}

            {/* Выноски от узлов кольца к их группе или к ядру */}
            <g className={ringHidden ? 'con-hidden' : undefined}>
              {ring.map((n) => {
                const b = focus || openKind ? null : bubbleOf.get(n.kind ?? 'прочее');
                return (
                  <line
                    key={`l-${n.slug}`}
                    x1={n.x} y1={n.y} x2={b ? b.x : g.cx} y2={b ? b.y : g.cy}
                    stroke={ACCENT} strokeWidth="1" opacity="0.22"
                  />
                );
              })}
            </g>

            {/* Кольцо групп */}
            <g>
              {bubbles.map((b) => {
                const off = (openKind && openKind !== b.kind) || Boolean(focus);
                return (
                  <g
                    key={b.kind}
                    className="con-hit"
                    opacity={off ? 0.3 : 1}
                    role="button"
                    tabIndex={0}
                    onClick={() => { setFocus(null); setOpenKind(openKind === b.kind ? null : b.kind); leaveEntityRoute(); }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setFocus(null);
                        setOpenKind(openKind === b.kind ? null : b.kind);
                        leaveEntityRoute();
                      }
                    }}
                  >
                    <circle cx={b.x} cy={b.y} r={b.r} fill={SURFACE} stroke={ACCENT} strokeWidth={openKind === b.kind ? 3 : 1.5} />
                    <circle cx={b.x} cy={b.y} r={b.r} fill={ACCENT} opacity="0.1" />
                    <text
                      x={b.x} y={r4(b.y + 4 * g.fs)} textAnchor="middle"
                      style={{ fontSize: 11 * g.fs, fill: ACCENT_INK, fontWeight: 600, fontFamily: 'var(--font-mono)' }}
                    >
                      {b.n}
                    </text>
                    {(!narrow || !off) && (
                      <text
                        x={b.x} y={r4(b.y + b.r + 13 * g.fs)} textAnchor="middle"
                        style={{ fontSize: 11.5 * g.fs, fill: INK, fontWeight: 500 }}
                      >
                        {trim(kindLabel(b.kind), narrow ? 12 : 16)}
                      </text>
                    )}
                    <title>
                      {`${kindLabel(b.kind)}: ${b.n} узлов, ${b.links} связей у них суммарно. ` +
                        (openKind === b.kind ? 'Клик - свернуть группу.' : 'Клик - раскрыть состав группы.')}
                    </title>
                  </g>
                );
              })}
            </g>

            {/* Ядро: смысл зависит от состояния и всегда подписан */}
            <g>
              <circle cx={g.cx} cy={g.cy} r={g.core} fill={SURFACE} stroke={ACCENT} strokeWidth="1.5" />
              {focusNode ? (
                <>
                  <text x={g.cx} y={r4(g.cy - 2 * g.fs)} textAnchor="middle" style={{ fontSize: 11.5 * g.fs, fill: INK, fontWeight: 600 }}>
                    {trim(focusNode.name, narrow ? 11 : 15)}
                  </text>
                  <text x={g.cx} y={r4(g.cy + 14 * g.fs)} textAnchor="middle" style={{ fontSize: 10.5 * g.fs, fill: INK_3 }}>
                    {ring.length} из {focusEdges.length} связей
                  </text>
                </>
              ) : openKind ? (
                <>
                  <text x={g.cx} y={r4(g.cy - 2 * g.fs)} textAnchor="middle" style={{ fontSize: 12 * g.fs, fill: INK, fontWeight: 600 }}>
                    {trim(kindLabel(openKind), narrow ? 11 : 15)}
                  </text>
                  <text x={g.cx} y={r4(g.cy + 15 * g.fs)} textAnchor="middle" style={{ fontSize: 10.5 * g.fs, fill: INK_3 }}>
                    {ring.length} из {bubbleOf.get(openKind)?.n ?? 0}
                  </text>
                </>
              ) : (
                <>
                  <text x={g.cx} y={r4(g.cy - 4 * g.fs)} textAnchor="middle" style={{ fontSize: 20 * g.fs, fill: INK, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                    {totalNodes}
                  </text>
                  <text x={g.cx} y={r4(g.cy + 12 * g.fs)} textAnchor="middle" style={{ fontSize: 10 * g.fs, fill: INK_3 }}>
                    узлов графа
                  </text>
                  <text x={g.cx} y={r4(g.cy + 26 * g.fs)} textAnchor="middle" style={{ fontSize: 10 * g.fs, fill: INK_3 }}>
                    {visibleEdges.length} связей в слое
                  </text>
                </>
              )}
              {(openKind || focus) && (
                <circle cx={g.cx} cy={g.cy} r={g.core} fill="transparent" className="con-hit" onClick={reset}>
                  <title>Клик по ядру - вернуться ко всем группам.</title>
                </circle>
              )}
            </g>

            {/* Кольцо узлов. На телефоне в общем виде его нет: двадцать точек с
                подписями на полотне 520 единиц наезжают на пузыри групп и друг
                на друга. Оно появляется, когда человек раскрыл группу или выбрал
                узел, то есть когда на экране один слой, а не два. */}
            <g className={narrow && !openKind && !focus ? 'con-hidden' : undefined}>
              {ring.map((n, i) => {
                const rr = r4((focus || openKind ? 6 : 5 + Math.min(4, Math.sqrt(n.degree))) * (narrow ? 1.4 : 1));
                return (
                  <g
                    key={n.slug}
                    className="con-hit"
                    role="button"
                    tabIndex={0}
                    aria-label={`Открыть узел ${n.name}`}
                    onClick={() => pickNode(n.slug)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        pickNode(n.slug);
                      }
                    }}
                  >
                    <circle cx={n.x} cy={n.y} r={rr + 9} fill="transparent" />
                    <circle cx={n.x} cy={n.y} r={rr} fill={ACCENT} stroke={SURFACE} strokeWidth="2" />
                    <text
                      x={n.lx} y={n.ly} textAnchor={n.anchor}
                      style={{ fontSize: 10.5 * g.fs, fill: INK, opacity: 0.92 }}
                    >
                      {trim(n.name, narrow ? 12 : i % 2 ? 18 : 22)}
                    </text>
                    <title>
                      {`${kindOne(n.kind)}: ${n.name}. ` +
                        (n.via ? `Связь «${relationLabel(n.via)}» с выбранным узлом. ` : `Связей у узла: ${n.degree}. `) +
                        'Клик - показать только его связи.'}
                    </title>
                  </g>
                );
              })}
            </g>

            {ring.length === 0 && (openKind || focus) && (
              <text x={g.cx} y={r4(g.cy + g.kindRy + 40)} textAnchor="middle" style={{ fontSize: 12 * g.fs, fill: INK_3 }}>
                связанных узлов не нашлось
              </text>
            )}
          </svg>
        </div>

      {mode === 'constellation' && ringHidden && (
        <p className="meta">
          На узком экране кольцо узлов открывается по клику: нажми на группу, чтобы увидеть её
          состав, или найди узел поиском выше.
        </p>
      )}

      {mode === 'constellation' && focusNode && (
        <aside className="stack graph-selection" aria-labelledby="graph-selected-title">
          <div className="row row--between row--wrap">
            <span id="graph-selected-title" className="h2">{focusNode.name}</span>
            <span className="row row--wrap">
              <span className="tag">{kindOne(focusNode.kind)}</span>
              {focusNode.region_slug && <span className="tag tag--muted">{regionName(focusNode.region_slug)}</span>}
              <Val value={String(focusEdges.length)} unit="связей" />
            </span>
          </div>

          <div className="graph-scope">
            <span className="kicker">Выбранный узел</span>
            <span className="graph-scope-value">{kindOne(focusNode.kind)} · {focusNode.region_slug ? regionName(focusNode.region_slug) : 'охват не указан'}</span>
            {selectedAliases.length > 0 && <span className="meta">Также встречается: {selectedAliases.join(', ')}</span>}
          </div>

          {focusMetrics.length > 0 ? (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th scope="col">Показатель узла</th>
                    <th scope="col">Период</th>
                    <th scope="col" className="num">Значение</th>
                    <th scope="col">Источник</th>
                  </tr>
                </thead>
                <tbody>
                  {focusMetrics.map((m, i) => (
                    <tr key={`${m.metric}-${m.period}-${i}`}>
                      <td>{m.metric}</td>
                      <td>{m.period ?? '—'}</td>
                      <td className="num">
                        {m.value === null || m.value === undefined
                          ? '—'
                          : Number(m.value).toLocaleString('ru-RU')}
                        {m.unit && <span className="unit">{m.unit}</span>}
                      </td>
                      <td>
                        {m.source_url ? (
                          <a href={m.source_url} target="_blank" rel="noreferrer">
                            {m.source_type ?? 'источник'}
                          </a>
                        ) : (
                          m.source_type ?? '—'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="meta">Для этого узла в снимке нет отдельной метрики с источником.</p>
          )}

          {focusEdges.length === 0 ? (
            <div className="empty graph-edge-empty">
              <span className="empty-title">В выбранном слое рёбер нет</span>
              <span>{edgeLens === 'business' && focusAllEdges.length > 0
                ? `У узла есть ${focusAllEdges.length} контекстных рёбер, но они не являются деловыми связями.`
                : 'Узел пока не связан с другими сущностями в этом снимке.'}</span>
              {edgeLens === 'business' && focusAllEdges.length > 0 && (
                <button className="btn btn--ghost" type="button" onClick={() => setEdgeLens('all')}>Показать все связи узла</button>
              )}
            </div>
          ) : <div className="list graph-edge-list">
            {focusEdges.slice(0, 40).map((e, i) => {
              const source = nodeBySlug.get(e.src);
              const target = nodeBySlug.get(e.dst);
              const otherSlug = e.src === focus ? e.dst : e.src;
              return (
                <button
                  type="button"
                  className="list-row"
                  key={`${e.src}-${e.dst}-${e.relation}-${i}`}
                  onClick={() => pickNode(otherSlug)}
                >
                  <span className="list-main">
                    <span className="graph-edge-route" aria-label={`${source?.name ?? e.src} → ${relationLabel(e.relation)} → ${target?.name ?? e.dst}`}>
                      <span className="graph-edge-node">{source?.name ?? e.src}</span>
                      <span className="graph-edge-arrow" aria-hidden="true">→</span>
                      <span className="tag">{relationLabel(e.relation)}</span>
                      <span className="graph-edge-arrow" aria-hidden="true">→</span>
                      <span className="graph-edge-node">{target?.name ?? e.dst}</span>
                    </span>
                    {e.note && <span className="stat-note">{e.note}</span>}
                    <span className="meta">
                      {e.relation === 'co_mentioned_with'
                        ? 'Совместное упоминание; причинность или партнёрство не доказаны.'
                        : 'Источник связи пока не передан.'}
                    </span>
                  </span>
                  {e.weight !== null && e.weight !== undefined && (
                    <span className="graph-edge-weight">raw weight: {e.weight} · единица не задана</span>
                  )}
                </button>
              );
            })}
          </div>}
          {focusEdges.length > 40 && (
            <p className="meta">
              Показаны первые <span className="num">40</span> связей из{' '}
              <span className="num">{focusEdges.length}</span>: дальше список читать невозможно.
            </p>
          )}
        </aside>
      )}
      {mode === 'constellation' && !focusNode && (
        <aside className="stack graph-selection graph-guide" aria-labelledby="graph-guide-title">
          <span className="kicker">Как читать</span>
          <h3 id="graph-guide-title" className="h2">Сигнал → проверка</h3>
          <p className="meta">Нажмите на группу или точку, чтобы открыть узел. В списке справа направление всегда задано от источника к цели.</p>
          <div className="graph-guide-lines">
            <span><b>Деловые связи</b> — компании, рынки и зависимости.</span>
            <span><b>Все связи</b> — добавляет контекстные упоминания и места.</span>
            <span><b>Метрики узла</b> — отдельные показатели с доступным источником.</span>
          </div>
          <div className="graph-guide-markets">
            <span className="kicker">Быстрый вход</span>
            {nationalMarkets.slice(0, 4).map((market) => (
              <button key={market.slug} type="button" className="graph-guide-market" onClick={() => pickNode(market.slug)}>
                {market.name}
              </button>
            ))}
          </div>
        </aside>
      )}
        </div>
      )}
    </div>
  );
}
