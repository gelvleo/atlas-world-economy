import { useEffect, useMemo, useState } from 'react';
import type { EvidenceKind } from '../types';
import { EvidenceTag } from './Overview';
import Val from '../ui/num';
import {
  AI_MARKET_BACKLINKS,
  AI_MARKET_CHILDREN,
  AI_MARKET_EVIDENCE,
  AI_MARKET_MAP,
  AI_MARKET_NODES,
  AI_MARKET_ROOTS,
  AI_MARKET_STATS,
  aiMarketDescendants,
  aiMarketTrail
} from '../data/ai-market';
import { AI_MARKET_KIND_LABEL, AI_MARKET_LAYERS } from '../data/ai-market.types';
import type { AiMarketKind, AiMarketLayer, AiMarketNode } from '../data/ai-market.types';
import { useHashRoute } from '../ui/hashRoute';
import './ai-market.css';

// Проводник по карте рынка. Адрес узла живёт в хэше (#/ai/node/<id>, #/ai/layer/<id>),
// поэтому любая строка карты это ссылка, которую можно отдать человеку.

interface Props {
  openNode: (id: string) => void;
}

const goLayer = (layer: AiMarketLayer) => {
  window.location.hash = `#/ai/layer/${layer}`;
};
const goNode = (id: string) => {
  window.location.hash = `#/ai/node/${id}`;
};

// Порядок групп детей внутри узла: сначала структура, потом слова людей.
const KIND_ORDER: AiMarketKind[] = [
  'principle', 'segment', 'industry', 'usecase', 'service', 'subservice', 'niche',
  'player', 'price', 'channel', 'failure', 'metric', 'pain', 'question', 'insight'
];

function evidenceKindOf(n: AiMarketNode): EvidenceKind | null {
  const ids = [...(n.evidence ?? []), ...(n.numbers ?? []).map((x) => x.evidence)];
  const kinds = ids.map((id) => AI_MARKET_EVIDENCE[id]?.kind).filter(Boolean) as EvidenceKind[];
  const rank: EvidenceKind[] = ['official', 'company', 'analyst', 'forecast', 'proxy'];
  const best = rank.find((k) => kinds.includes(k));
  if (best) return best;
  // Цитата с url это тоже источник: слова человека, не оценка.
  return n.quotes?.length ? 'proxy' : null;
}

function Row({ n, showTrail }: { n: AiMarketNode; showTrail?: boolean }) {
  const kids = AI_MARKET_CHILDREN[n.id]?.length ?? 0;
  const deep = kids ? aiMarketDescendants(n.id).length : 0;
  const trail = showTrail ? aiMarketTrail(n.id).slice(0, -1) : [];
  return (
    <button className="list-row" onClick={() => goNode(n.id)}>
      <span className="aim-row">
        <span className="aim-row-title">
          {n.title}
          <span className="tag tag--muted">{AI_MARKET_KIND_LABEL[n.kind]}</span>
        </span>
        <span className="aim-row-side">
          {/* Длинная вилка в строке списка отжимает заголовок: показываем только короткую, полная в карточке. */}
          {n.priceRu && n.priceRu.length <= 28 && <Val className="num" value={n.priceRu} />}
          {deep > 0 && (
            <span>
              внутри <span className="num">{deep}</span>
            </span>
          )}
        </span>
        <span className="aim-row-sum">
          {trail.length > 0 && <span className="muted">{trail.map((t) => t.title).join(' · ')} · </span>}
          {n.summary}
        </span>
      </span>
    </button>
  );
}

function Group({ kind, items }: { kind: AiMarketKind; items: AiMarketNode[] }) {
  return (
    <>
      <div className="aim-group-head">
        {AI_MARKET_KIND_LABEL[kind]} <span className="num">{items.length}</span>
      </div>
      <div className="list">
        {items.map((c) => (
          <Row key={c.id} n={c} />
        ))}
      </div>
    </>
  );
}

function Children({ id }: { id: string }) {
  const kids = AI_MARKET_CHILDREN[id] ?? [];
  if (!kids.length) return null;
  const groups = KIND_ORDER.map((k) => [k, kids.filter((c) => c.kind === k)] as const).filter(([, v]) => v.length);
  return (
    <div className="aim-block">
      <div className="kicker">
        Внутри · <span className="num">{aiMarketDescendants(id).length}</span>
      </div>
      {groups.map(([k, items]) => (
        <Group key={k} kind={k} items={items} />
      ))}
    </div>
  );
}

function Chips({ title, ids }: { title: string; ids: string[] }) {
  const items = ids.map((id) => AI_MARKET_MAP[id]).filter(Boolean);
  if (!items.length) return null;
  return (
    <div className="aim-block">
      <div className="kicker">{title}</div>
      <div className="aim-chips">
        {items.map((r) => (
          <button key={r.id} className="btn btn--ghost aim-chip" onClick={() => goNode(r.id)}>
            {r.title}
          </button>
        ))}
      </div>
    </div>
  );
}

function Detail({ n, openNode }: { n: AiMarketNode; openNode: (id: string) => void }) {
  const trail = aiMarketTrail(n.id);
  const layer = AI_MARKET_LAYERS.find((l) => l.id === n.layer)!;
  const evidenceIds = Array.from(
    new Set([...(n.evidence ?? []), ...(n.numbers ?? []).map((x) => x.evidence)])
  );
  const backlinks = (AI_MARKET_BACKLINKS[n.id] ?? []).filter((b) => !(n.related ?? []).includes(b.id)).map((b) => b.id);
  return (
    <div className="aim-detail">
      <div className="aim-crumbs">
        <button className="link" onClick={() => goLayer(n.layer)}>
          {layer.label}
        </button>
        {trail.slice(0, -1).map((t) => (
          <span key={t.id}>
            <span className="sep">/</span>{' '}
            <button className="link" onClick={() => goNode(t.id)}>
              {t.title}
            </button>
          </span>
        ))}
      </div>

      <div className="aim-detail-head">
        <div className="row row--wrap">
          <span className="tag">{AI_MARKET_KIND_LABEL[n.kind]}</span>
          <EvidenceTag kind={evidenceKindOf(n)} />
          {(n.tags ?? []).map((t) => (
            <span key={t} className="tag tag--muted">
              {t}
            </span>
          ))}
        </div>
        <h2>{n.title}</h2>
        <p className="section-lead">{n.summary}</p>
        {(n.priceRu || n.priceEn || n.time) && (
          <div className="aim-meta">
            {n.priceRu && (
              <span>
                <span className="unit">РФ</span> <Val value={n.priceRu} />
              </span>
            )}
            {n.priceEn && (
              <span>
                <span className="unit">запад</span> <Val value={n.priceEn} />
              </span>
            )}
            {n.time && (
              <span>
                <span className="unit">срок</span> <b>{n.time}</b>
              </span>
            )}
          </div>
        )}
      </div>

      {n.numbers && n.numbers.length > 0 && (
        <div className="aim-block">
          <div className="kicker">Цифры</div>
          <div className="aim-nums">
            {n.numbers.map((x, i) => {
              const ev = AI_MARKET_EVIDENCE[x.evidence];
              return (
                <div key={i} className="stat">
                  <span className="stat-num stat-num--m">
                    {x.value}
                    {x.unit && <span className="stat-unit">{x.unit}</span>}
                  </span>
                  <span className="stat-label">{x.label}</span>
                  <span className="stat-note">
                    <EvidenceTag kind={ev?.kind ?? null} />{' '}
                    {ev?.url ? (
                      <a href={ev.url} target="_blank" rel="noreferrer">
                        {ev.label}
                      </a>
                    ) : (
                      ev?.label
                    )}
                    {ev?.date ? ` · ${ev.date}` : ''}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {n.facts && n.facts.length > 0 && (
        <div className="aim-block">
          <div className="kicker">Факты</div>
          <ul>
            {n.facts.map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>
        </div>
      )}

      {n.quotes && n.quotes.length > 0 && (
        <div className="aim-block">
          <div className="kicker">
            Слова людей · <span className="num">{n.quotes.length}</span>
          </div>
          {n.quotes.map((q, i) => (
            <blockquote key={i} className="aim-quote">
              <p>«{q.text}»</p>
              <span className="meta">
                {q.who ? `${q.who}, ` : ''}
                <a href={q.url} target="_blank" rel="noreferrer">
                  {q.where ?? 'источник'}
                </a>
                {q.date ? ` · ${q.date}` : ''}
              </span>
            </blockquote>
          ))}
        </div>
      )}

      {n.questions && n.questions.length > 0 && (
        <div className="aim-block">
          <div className="kicker">Что спрашивают</div>
          <ul>
            {n.questions.map((q, i) => (
              <li key={i}>{q}</li>
            ))}
          </ul>
        </div>
      )}

      {n.pains && n.pains.length > 0 && (
        <div className="aim-block">
          <div className="kicker">Что болит</div>
          <ul>
            {n.pains.map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ul>
        </div>
      )}

      {(n.acceptance || n.risk || (n.whoSells && n.whoSells.length > 0)) && (
        <div className="grid grid--2">
          {n.acceptance && (
            <div className="aim-block">
              <div className="kicker">Чем мерить, что сделано</div>
              <p>{n.acceptance}</p>
            </div>
          )}
          {n.risk && (
            <div className="aim-block">
              <div className="kicker">Как ломается</div>
              <p>{n.risk}</p>
            </div>
          )}
          {n.whoSells && n.whoSells.length > 0 && (
            <div className="aim-block">
              <div className="kicker">Кто продаёт</div>
              <p>{n.whoSells.join(' · ')}</p>
            </div>
          )}
        </div>
      )}

      <Children id={n.id} />

      <Chips title="Связано" ids={n.related ?? []} />
      <Chips title="Сюда ссылаются" ids={backlinks} />

      {evidenceIds.length > 0 && (
        <div className="aim-block">
          <div className="kicker">
            Источники · <span className="num">{evidenceIds.length}</span>
          </div>
          <div className="aim-src">
            {evidenceIds.map((id) => {
              const ev = AI_MARKET_EVIDENCE[id];
              if (!ev) return null;
              return (
                <div key={id}>
                  <EvidenceTag kind={ev.kind} />{' '}
                  {ev.url ? (
                    <a href={ev.url} target="_blank" rel="noreferrer">
                      {ev.label}
                    </a>
                  ) : (
                    ev.label
                  )}
                  <span className="meta">
                    {ev.date ? ` · ${ev.date}` : ''}
                    {ev.metric ? ` · ${ev.metric}` : ''}
                    {ev.scope ? ` · периметр: ${ev.scope}` : ''}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {n.nodeId && (
        <div className="crossnav">
          <button className="btn btn--ghost" onClick={() => openNode(n.nodeId!)}>
            Карточка в атласе
          </button>
        </div>
      )}
    </div>
  );
}

function LayerView({ layer }: { layer: AiMarketLayer }) {
  const meta = AI_MARKET_LAYERS.find((l) => l.id === layer)!;
  const roots = AI_MARKET_ROOTS[layer] ?? [];
  // Слой «вопросы» и «спрос» делим по виду корней, чтобы отрасли не смешивались с сегментами.
  const groups = KIND_ORDER.map((k) => [k, roots.filter((r) => r.kind === k)] as const).filter(([, v]) => v.length);
  return (
    <div className="aim-detail">
      <div className="aim-detail-head">
        <h2>{meta.label}</h2>
        <p className="section-lead">{meta.lead}</p>
      </div>
      {groups.length > 1
        ? groups.map(([k, items]) => <Group key={k} kind={k} items={items} />)
        : (
          <div className="list">
            {roots.map((r) => (
              <Row key={r.id} n={r} />
            ))}
          </div>
        )}
    </div>
  );
}

const norm = (s: string) => s.toLowerCase().replace(/ё/g, 'е');

function search(q: string): AiMarketNode[] {
  const needle = norm(q);
  const score = (n: AiMarketNode) => {
    let s = 0;
    if (norm(n.title).includes(needle)) s += 10;
    if (norm(n.summary).includes(needle)) s += 4;
    if ((n.questions ?? []).some((x) => norm(x).includes(needle))) s += 5;
    if ((n.pains ?? []).some((x) => norm(x).includes(needle))) s += 4;
    if ((n.quotes ?? []).some((x) => norm(x.text).includes(needle))) s += 5;
    if ((n.facts ?? []).some((x) => norm(x).includes(needle))) s += 2;
    if ((n.whoSells ?? []).some((x) => norm(x).includes(needle))) s += 3;
    return s;
  };
  return AI_MARKET_NODES.map((n) => [n, score(n)] as const)
    .filter(([, s]) => s > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 40)
    .map(([n]) => n);
}

export default function AiMarketExplorer({ openNode }: Props) {
  const route = useHashRoute();
  const [q, setQ] = useState('');

  const selected = route?.domain === 'ai' && route.kind === 'node' ? AI_MARKET_MAP[route.a] : undefined;
  const layer: AiMarketLayer =
    selected?.layer ??
    (route?.domain === 'ai' && route.kind === 'layer' && AI_MARKET_LAYERS.some((l) => l.id === route.a)
      ? (route.a as AiMarketLayer)
      : 'principles');

  // Переход по узлу: экран к началу проводника, чтобы карточка не открывалась ниже сгиба.
  useEffect(() => {
    if (!route || route.domain !== 'ai') return;
    document.getElementById('aim')?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }, [route?.kind, route?.a]);

  const hits = useMemo(() => (q.trim().length >= 2 ? search(q.trim()) : []), [q]);
  const counts = useMemo(() => {
    const m = {} as Record<AiMarketLayer, number>;
    for (const n of AI_MARKET_NODES) m[n.layer] = (m[n.layer] ?? 0) + 1;
    return m;
  }, []);

  return (
    <div id="aim" className="stack stack--loose">
      <div className="aim-stamp">
        <span>
          узлов <b>{AI_MARKET_STATS.nodes}</b>
        </span>
        <span>
          вопросов людей <b>{AI_MARKET_STATS.questions}</b>
        </span>
        <span>
          цитат дословно <b>{AI_MARKET_STATS.quotes}</b>
        </span>
        <span>
          источников с ссылкой <b>{AI_MARKET_STATS.withUrl}</b>
        </span>
      </div>

      <div className="aim-search">
        <input
          className="field"
          type="search"
          aria-label="Поиск по карте рынка"
          placeholder="Найти: клиника, 1С, сколько стоит, галлюцинации, Kwork…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        {q && (
          <button className="btn btn--ghost" onClick={() => setQ('')}>
            Очистить
          </button>
        )}
      </div>

      <div className="aim">
        <div className="aim-main">
          {hits.length > 0 ? (
            <div className="aim-detail">
              <div className="aim-detail-head">
                <h2>
                  Найдено <span className="num">{hits.length}</span>
                </h2>
              </div>
              <div className="list">
                {hits.map((n) => (
                  <Row key={n.id} n={n} showTrail />
                ))}
              </div>
            </div>
          ) : q.trim().length >= 2 ? (
            <div className="empty">
              <span className="empty-title">Ничего не найдено</span>
              <span className="meta">Попробуй короче: «клиник», «1С», «аудит».</span>
            </div>
          ) : selected ? (
            <Detail n={selected} openNode={openNode} />
          ) : (
            <LayerView layer={layer} />
          )}
        </div>

        <nav className="aim-layers" aria-label="Слои карты">
          {AI_MARKET_LAYERS.map((l) => (
            <button
              key={l.id}
              className="aim-layer"
              aria-current={l.id === layer && !hits.length ? 'true' : undefined}
              onClick={() => goLayer(l.id)}
            >
              <span>{l.label}</span>
              <span className="num">{counts[l.id] ?? 0}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
