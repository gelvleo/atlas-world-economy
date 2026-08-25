import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { EcoNode, EvidenceKind, NodeKind, SectionId } from '../types';
import { ALL_NODES, NODE_MAP } from '../data/nodes';
import { FLOWS } from '../data/flows';
import { CHAINS, DEPENDENCY_LINKS } from '../data/chains';
import { EDTECH_FLOWS, EDTECH_CHAINS, EDTECH_LINKS } from '../data/edtech';
import { SERVICE_ERAS } from '../data/timeline';
import { AI_IMPACTS } from '../data/ai';
import { KIND_LABEL } from '../ui/glyphs';
import Val from '../ui/num';
import { IconClose, IconDown, IconNext, IconTransform, IconUp, NodeGlyph } from '../ui/icons';
import '../sections/mindmap.css';

interface Props {
  nodeId: string;
  onClose: () => void;
  openNode: (id: string) => void;
  goTo: (s: SectionId) => void;
  currentSection: SectionId;
}

const EVIDENCE_LABEL: Record<EvidenceKind, string> = {
  official: 'официальный',
  company: 'компания',
  analyst: 'аналитика',
  forecast: 'прогноз',
  proxy: 'прокси'
};

// Прогноз и прокси — не факт: помечаем меткой предупреждения.
const EVIDENCE_TAG: Record<EvidenceKind, string> = {
  official: 'tag tag--accent',
  company: 'tag',
  analyst: 'tag',
  forecast: 'tag tag--warn',
  proxy: 'tag tag--warn'
};

const ERA_LABEL: Record<string, string> = {
  e2010: '2010-е',
  e2020: '2020-23',
  e2026: 'сейчас',
  e2030: '2030'
};

/* ─── Вес узла ───────────────────────────────────────────────────────
   Связность считается один раз из самих данных: сколько потоков входит и
   выходит, в скольких цепочках узел состоит, сколько парных зависимостей его
   касается, есть ли эффект ИИ. Ни одно число не вписано руками.
   Периметры (мировой и рублёвый) не складываются в деньгах, но связь узла —
   это связь: она считается по всем таблицам, где узел записан. */

export interface NodeWeight {
  inflow: number;
  outflow: number;
  chains: number;
  deps: number;
  ai: number;
  total: number;
}

const ALL_FLOWS = [...FLOWS, ...EDTECH_FLOWS];
const ALL_CHAINS = [...CHAINS, ...EDTECH_CHAINS];
const ALL_LINKS = [...DEPENDENCY_LINKS, ...EDTECH_LINKS];

const EMPTY_WEIGHT: NodeWeight = { inflow: 0, outflow: 0, chains: 0, deps: 0, ai: 0, total: 0 };

const WEIGHTS: Record<string, NodeWeight> = (() => {
  const map: Record<string, NodeWeight> = {};
  const at = (id: string): NodeWeight => {
    if (!map[id]) map[id] = { ...EMPTY_WEIGHT };
    return map[id];
  };
  ALL_NODES.forEach((n) => at(n.id));
  ALL_FLOWS.forEach((f) => {
    at(f.to).inflow += 1;
    at(f.from).outflow += 1;
  });
  // Узел может встретиться в маршруте цепочки дважды — считаем цепочки, не шаги.
  ALL_CHAINS.forEach((c) => new Set(c.nodes).forEach((id) => (at(id).chains += 1)));
  ALL_LINKS.forEach((d) => {
    at(d.from).deps += 1;
    at(d.to).deps += 1;
  });
  AI_IMPACTS.forEach((a) => (at(a.targetId).ai += 1));
  Object.values(map).forEach((w) => {
    w.total = w.inflow + w.outflow + w.chains + w.deps + w.ai;
  });
  return map;
})();

export function nodeWeight(id: string): NodeWeight {
  return WEIGHTS[id] ?? EMPTY_WEIGHT;
}

/** Узлы, которых нет ни в одном потоке, цепочке, парной зависимости и эффекте ИИ. */
export const ORPHAN_NODES: EcoNode[] = ALL_NODES.filter((n) => nodeWeight(n.id).total === 0);

const plural = (n: number, one: string, few: string, many: string) => {
  const d10 = n % 10;
  const d100 = n % 100;
  if (d10 === 1 && d100 !== 11) return one;
  if (d10 >= 2 && d10 <= 4 && (d100 < 12 || d100 > 14)) return few;
  return many;
};

interface WeightPart {
  n: number | null;
  text: string;
}

function weightParts(w: NodeWeight): WeightPart[] {
  const parts: WeightPart[] = [];
  const flows = w.inflow + w.outflow;
  if (flows > 0) parts.push({ n: flows, text: plural(flows, 'поток', 'потока', 'потоков') });
  if (w.chains > 0)
    parts.push({ n: w.chains, text: plural(w.chains, 'цепочка', 'цепочки', 'цепочек') });
  if (w.deps > 0)
    parts.push({
      n: w.deps,
      text: plural(w.deps, 'зависимость', 'зависимости', 'зависимостей')
    });
  if (w.ai > 0) parts.push({ n: null, text: 'эффект ИИ' });
  return parts;
}

/** Строка веса: «4 потока · 2 цепочки · эффект ИИ». Числа — моноширинным. */
export function WeightLine({ id, className = 'meta' }: { id: string; className?: string }) {
  const parts = weightParts(nodeWeight(id));
  if (parts.length === 0)
    return <span className={className + ' np-weight'}>ни потоков, ни цепочек</span>;
  return (
    <span className={className + ' np-weight'}>
      {parts.map((p) => (
        <span className="np-w-part" key={p.text}>
          {p.n !== null && <span className="num np-w-num">{p.n}</span>}
          {p.text}
        </span>
      ))}
    </span>
  );
}

/* ─── Сравнение двух узлов ───────────────────────────────────────── */

const KIND_ORDER: NodeKind[] = ['country', 'sector', 'product', 'service', 'tech'];

const cmpNum = (n: number) => <span className="num np-cmp-num">{n}</span>;

function cmpValue(node: EcoNode) {
  if (!node.value) return <span className="np-cmp-none">не записано</span>;
  return <Val className="np-cmp-num" value={node.value} />;
}

function cmpEvidence(node: EcoNode) {
  const ev = node.evidence ?? [];
  if (ev.length === 0) return <span className="np-cmp-none">нет</span>;
  const byKind = new Map<EvidenceKind, number>();
  ev.forEach((e) => byKind.set(e.kind, (byKind.get(e.kind) ?? 0) + 1));
  return (
    <>
      {cmpNum(ev.length)}
      <span className="np-cmp-note">
        {[...byKind].map(([k, c]) => `${EVIDENCE_LABEL[k]}: ${c}`).join(' · ')}
      </span>
    </>
  );
}

function CompareGrid({ a, b }: { a: EcoNode; b: EcoNode }) {
  const wa = nodeWeight(a.id);
  const wb = nodeWeight(b.id);
  const rows: { key: string; a: ReactNode; b: ReactNode }[] = [
    { key: 'вид', a: <>{KIND_LABEL[a.kind]}</>, b: <>{KIND_LABEL[b.kind]}</> },
    { key: 'число', a: cmpValue(a), b: cmpValue(b) },
    { key: 'потоков приходит', a: cmpNum(wa.inflow), b: cmpNum(wb.inflow) },
    { key: 'потоков уходит', a: cmpNum(wa.outflow), b: cmpNum(wb.outflow) },
    { key: 'цепочек', a: cmpNum(wa.chains), b: cmpNum(wb.chains) },
    { key: 'зависимостей', a: cmpNum(wa.deps), b: cmpNum(wb.deps) },
    { key: 'эффектов ИИ', a: cmpNum(wa.ai), b: cmpNum(wb.ai) },
    { key: 'связей всего', a: cmpNum(wa.total), b: cmpNum(wb.total) },
    { key: 'источников', a: cmpEvidence(a), b: cmpEvidence(b) }
  ];
  return (
    <div className="np-cmp">
      <span className="np-cmp-key" />
      <span className="np-cmp-head">
        <NodeGlyph node={a} />
        {a.name}
      </span>
      <span className="np-cmp-head">
        <NodeGlyph node={b} />
        {b.name}
      </span>
      {rows.map((r) => (
        <Fragment key={r.key}>
          <span className="np-cmp-key np-cmp-line">{r.key}</span>
          <span className="np-cmp-val np-cmp-line">{r.a}</span>
          <span className="np-cmp-val np-cmp-line">{r.b}</span>
        </Fragment>
      ))}
    </div>
  );
}

export default function NodePanel({ nodeId, onClose, openNode, goTo }: Props) {
  const node = NODE_MAP[nodeId];

  // Периметры не смешиваем: рублёвый домен ru-edtech живёт своими потоками и
  // цепочками. Мировая диаграмма по-прежнему читает только FLOWS.
  const allFlows = useMemo(() => [...FLOWS, ...EDTECH_FLOWS], []);
  const allChains = useMemo(() => [...CHAINS, ...EDTECH_CHAINS], []);
  const flowsIn = useMemo(() => allFlows.filter((f) => f.to === nodeId), [allFlows, nodeId]);
  const flowsOut = useMemo(() => allFlows.filter((f) => f.from === nodeId), [allFlows, nodeId]);
  const chainsHere = useMemo(
    () => allChains.filter((c) => c.nodes.includes(nodeId)),
    [allChains, nodeId]
  );
  const timelineHere = useMemo(() => SERVICE_ERAS.filter((s) => s.serviceId === nodeId), [nodeId]);
  const aiHere = useMemo(() => AI_IMPACTS.filter((a) => a.targetId === nodeId), [nodeId]);

  // Сравнение живёт здесь же: глобального хранилища для него не заводим.
  const [compareId, setCompareId] = useState<string | null>(null);
  const [comparing, setComparing] = useState(false);

  // История переходов: до пяти шагов назад. Возврат по клику обрезает хвост,
  // иначе прыжки туда-обратно наматывают цепочку из одних и тех же имён.
  const [trail, setTrail] = useState<string[]>([]);
  const prevId = useRef(nodeId);
  useEffect(() => {
    if (prevId.current === nodeId) return;
    const from = prevId.current;
    prevId.current = nodeId;
    setTrail((t) => {
      const back = t.indexOf(nodeId);
      return back >= 0 ? t.slice(0, back) : [...t, from].slice(-5);
    });
    setComparing(false);
    setCompareId(null);
  }, [nodeId]);

  // Escape закрывает панель, фокус возвращается на элемент, который её открыл.
  // onClose приходит новой ссылкой на каждый рендер — держим его в ref, иначе
  // эффект перезапустится и запомнит вместо кнопки-открывателя саму панель.
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const openerRef = useRef<HTMLElement | null>(null);
  const asideRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    openerRef.current = document.activeElement as HTMLElement | null;
    // Фокус уводим в саму панель. Без этого он оставался в поле поиска: с
    // клавиатуры панель открывалась, но Tab продолжал ходить по странице ПОД
    // ней, а читалка не объявляла диалог. Ставим на контейнер с tabIndex={-1},
    // а не на первую кнопку внутри, — иначе чтение начиналось бы с середины.
    asideRef.current?.focus?.();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeRef.current();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      // Открыватель может исчезнуть, пока панель открыта: focus() по
      // отсоединённому узлу молча роняет фокус на body. Поиск свой случай
      // закрыл сам (1b5e245), проверка остаётся общей страховкой.
      const opener = openerRef.current;
      if (opener?.isConnected) opener.focus?.();
    };
  }, []);

  if (!node) return null;

  const related = node.related.map((id) => NODE_MAP[id]).filter(Boolean);
  const weight = nodeWeight(nodeId);
  const other = compareId ? NODE_MAP[compareId] : null;

  return (
    <div className="np-overlay" onClick={onClose}>
      <aside
        ref={asideRef}
        tabIndex={-1}
        className="np panel"
        role="dialog"
        aria-modal="true"
        aria-label={node.name}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="np-head">
          <div className="np-head-main">
            <div className="row row--wrap">
              <NodeGlyph node={node} />
              <span className="tag">{KIND_LABEL[node.kind]}</span>
              {weight.total === 0 && (
                <span className="tag tag--warn">без потоков и цепочек</span>
              )}
            </div>
            <h2 className="h2">{node.name}</h2>
            {node.value && <Val className="np-value" value={node.value} />}
            {/* вес узла: числа посчитаны из потоков, цепочек, зависимостей и эффектов ИИ */}
            <WeightLine id={nodeId} />
          </div>
          <div className="np-head-side">
            <button
              className={comparing ? 'btn btn--ghost active' : 'btn btn--ghost'}
              aria-pressed={comparing}
              onClick={() => {
                setComparing((v) => !v);
                if (comparing) setCompareId(null);
              }}
            >
              Сравнить
            </button>
            <button className="btn--icon" onClick={onClose} aria-label="Закрыть карточку узла">
              <IconClose />
            </button>
          </div>
        </header>

        <div className="np-body">
          {trail.length > 0 && (
            <nav className="np-trail" aria-label="История переходов">
              <span className="kicker">Путь</span>
              {trail.map((id) => (
                <Fragment key={id}>
                  <button className="np-trail-step" onClick={() => openNode(id)}>
                    {NODE_MAP[id]?.name ?? id}
                  </button>
                  <span className="route-arrow route-arrow--inline" aria-hidden="true" />
                </Fragment>
              ))}
              <span className="np-trail-now">{node.name}</span>
            </nav>
          )}

          {comparing && (
            <div className="stack stack--tight">
              <p className="kicker">Сравнение узлов</p>
              <select
                className="field"
                aria-label="Второй узел для сравнения"
                value={compareId ?? ''}
                onChange={(e) => setCompareId(e.target.value || null)}
              >
                <option value="">Выберите второй узел</option>
                {KIND_ORDER.map((k) => (
                  <optgroup key={k} label={KIND_LABEL[k]}>
                    {ALL_NODES.filter((n) => n.kind === k && n.id !== nodeId)
                      .slice()
                      .sort((x, y) => x.name.localeCompare(y.name, 'ru'))
                      .map((n) => (
                        <option key={n.id} value={n.id}>
                          {n.name}
                        </option>
                      ))}
                  </optgroup>
                ))}
              </select>
              {other ? (
                <CompareGrid a={node} b={other} />
              ) : (
                <p className="meta">Выберите второй узел — покажем оба рядом.</p>
              )}
            </div>
          )}

          <p>{node.description}</p>

          <div className="stack stack--tight">
            <p className="kicker">Факты и ориентиры</p>
            <div className="list">
              {node.facts.map((f, i) => (
                <div className="list-row" key={i}>
                  <span className="list-main">{f}</span>
                </div>
              ))}
            </div>
          </div>

          {node.evidence && node.evidence.length > 0 && (
            <div className="stack stack--tight">
              <p className="kicker">Источники и периметр</p>
              <div className="list">
                {node.evidence.map((source) => (
                  <div className="list-row np-source" key={source.id}>
                    <div className="list-main stack stack--tight">
                      <div className="row row--wrap">
                        {source.url ? (
                          <a href={source.url} target="_blank" rel="noreferrer">
                            {source.label}
                          </a>
                        ) : (
                          <span className="np-source-noref">{source.label}</span>
                        )}
                        <span className={EVIDENCE_TAG[source.kind]}>
                          {EVIDENCE_LABEL[source.kind]}
                        </span>
                        {!source.url && <span className="tag tag--muted">названо словами</span>}
                      </div>
                      {source.metric && <span className="meta">{source.metric}</span>}
                      {source.scope && <span className="meta">Периметр: {source.scope}</span>}
                    </div>
                    <span className="list-side np-date">{source.date}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(flowsIn.length > 0 || flowsOut.length > 0) && (
            <div className="stack stack--tight">
              <p className="kicker">
                Потоки денег · приходит <span className="num">{flowsIn.length}</span> · уходит{' '}
                <span className="num">{flowsOut.length}</span>
              </p>
              <div className="list">
                {flowsOut.map((f) => (
                  <button key={f.id} className="list-row" onClick={() => goTo('flows')}>
                    <span className="np-dir np-dir--out" aria-hidden="true" />
                    <span className="list-main stack stack--tight">
                      <b>уходит в {NODE_MAP[f.to]?.name ?? f.to}</b>
                      <span className="meta">{f.description}</span>
                    </span>
                    <Val className="list-side np-flow-side" value={f.value} />
                  </button>
                ))}
                {flowsIn.map((f) => (
                  <button key={f.id} className="list-row" onClick={() => goTo('flows')}>
                    <span className="np-dir np-dir--in" aria-hidden="true" />
                    <span className="list-main stack stack--tight">
                      <b>приходит из {NODE_MAP[f.from]?.name ?? f.from}</b>
                      <span className="meta">{f.description}</span>
                    </span>
                    <Val className="list-side np-flow-side" value={f.value} />
                  </button>
                ))}
              </div>
            </div>
          )}

          {chainsHere.length > 0 && (
            <div className="stack stack--tight">
              <p className="kicker">Входит в цепочки</p>
              <div className="list">
                {chainsHere.map((c) => (
                  <button key={c.id} className="list-row" onClick={() => goTo('chains')}>
                    <span className="list-main stack stack--tight">
                      <b>{c.title}</b>
                      <span className="meta">{c.summary}</span>
                    </span>
                    <IconNext />
                  </button>
                ))}
              </div>
            </div>
          )}

          {timelineHere.length > 0 && (
            <div className="stack stack--tight">
              <p className="kicker">Динамика спроса</p>
              <div className="list">
                {timelineHere.map((s) => (
                  <div className="list-row np-era" key={s.era}>
                    <span className="np-era-label meta">{ERA_LABEL[s.era] ?? s.era}</span>
                    <span className="bar np-era-bar">
                      <span className="bar-fill" style={{ width: `${s.demand}%` }} />
                    </span>
                    <span className="list-side">{s.demand}</span>
                  </div>
                ))}
              </div>
              <div>
                <button className="btn btn--ghost" onClick={() => goTo('timeline')}>
                  Открыть динамику услуг <IconNext />
                </button>
              </div>
            </div>
          )}

          {aiHere.length > 0 && (
            <div className="stack stack--tight">
              <p className="kicker">Влияние ИИ</p>
              <div className="list">
                {aiHere.map((a) => (
                  <button key={a.id} className="list-row" onClick={() => goTo('ai')}>
                    <span className="np-dir" aria-hidden="true">
                      {a.direction === 'up' ? (
                        <IconUp />
                      ) : a.direction === 'down' ? (
                        <IconDown />
                      ) : (
                        <IconTransform />
                      )}
                    </span>
                    <span className="list-main">
                      <b>{a.title}</b>
                    </span>
                    <span className="tag">{a.magnitude}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {related.length > 0 && (
            <div className="stack stack--tight">
              <p className="kicker">Связанные узлы</p>
              <div className="np-related">
                {related.map((r) => (
                  <button key={r.id} className="np-chip" onClick={() => openNode(r.id)}>
                    <NodeGlyph node={r} />
                    <span>{r.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
