import { useMemo, type CSSProperties } from 'react';
import type { SectionId } from '../types';
import { NODE_MAP, KIND_LABEL, KIND_COLOR } from '../data/nodes';
import { FLOWS } from '../data/flows';
import { CHAINS } from '../data/chains';
import { SERVICE_ERAS } from '../data/timeline';
import { AI_IMPACTS } from '../data/ai';

interface Props {
  nodeId: string;
  onClose: () => void;
  openNode: (id: string) => void;
  goTo: (s: SectionId) => void;
  currentSection: SectionId;
}

export default function NodePanel({ nodeId, onClose, openNode, goTo }: Props) {
  const node = NODE_MAP[nodeId];

  const flowsIn = useMemo(() => FLOWS.filter((f) => f.to === nodeId), [nodeId]);
  const flowsOut = useMemo(() => FLOWS.filter((f) => f.from === nodeId), [nodeId]);
  const chainsHere = useMemo(
    () => CHAINS.filter((c) => c.nodes.includes(nodeId)),
    [nodeId]
  );
  const timelineHere = useMemo(
    () => SERVICE_ERAS.filter((s) => s.serviceId === nodeId),
    [nodeId]
  );
  const aiHere = useMemo(() => AI_IMPACTS.filter((a) => a.targetId === nodeId), [nodeId]);

  if (!node) return null;

  const related = node.related
    .map((id) => NODE_MAP[id])
    .filter(Boolean);

  return (
    <div className="panel-overlay" onClick={onClose}>
      <aside className="panel" onClick={(e) => e.stopPropagation()}>
        <button className="panel-close" onClick={onClose} aria-label="Закрыть">✕</button>
        <div className="panel-head">
          <span className="panel-emoji">{node.emoji}</span>
          <div>
            <span
              className="kind-badge"
              style={{ '--k': node.color ?? KIND_COLOR[node.kind] } as CSSProperties}
            >
              {KIND_LABEL[node.kind]}
            </span>
            <h2>{node.name}</h2>
            {node.value && <div className="panel-value">{node.value}</div>}
          </div>
        </div>

        <p className="panel-desc">{node.description}</p>

        <div className="panel-block">
          <h3>Факты и ориентиры</h3>
          <ul>
            {node.facts.map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>
        </div>

        {node.evidence && node.evidence.length > 0 && (
          <div className="panel-block evidence-block">
            <h3>Источники и периметр</h3>
            <div className="evidence-list">
              {node.evidence.map((source) => (
                <div className="evidence-card" key={source.id}>
                  <div className="evidence-head">
                    <a href={source.url} target="_blank" rel="noreferrer">{source.label} ↗</a>
                    <span className={`evidence-kind ${source.kind}`}>{source.kind}</span>
                  </div>
                  <div className="evidence-date">{source.date}</div>
                  {source.metric && <div className="evidence-metric">{source.metric}</div>}
                  {source.scope && <div className="evidence-scope">Периметр: {source.scope}</div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {(flowsIn.length > 0 || flowsOut.length > 0) && (
          <div className="panel-block">
            <h3>Потоки денег</h3>
            {flowsOut.map((f) => (
              <button key={f.id} className="link-row" onClick={() => goTo('flows')}>
                <span className="arrow out">→</span>
                <span><strong>{f.label}</strong> в {NODE_MAP[f.to]?.name ?? f.to} · {f.value}</span>
              </button>
            ))}
            {flowsIn.map((f) => (
              <button key={f.id} className="link-row" onClick={() => goTo('flows')}>
                <span className="arrow in">←</span>
                <span><strong>{f.label}</strong> из {NODE_MAP[f.from]?.name ?? f.from} · {f.value}</span>
              </button>
            ))}
          </div>
        )}

        {chainsHere.length > 0 && (
          <div className="panel-block">
            <h3>Входит в цепочки</h3>
            {chainsHere.map((c) => (
              <button key={c.id} className="link-row" onClick={() => goTo('chains')}>
                <span className="arrow">🔗</span>
                <span>
                  <strong>{c.title}</strong>
                  <br />
                  <small>{c.summary}</small>
                </span>
              </button>
            ))}
          </div>
        )}

        {timelineHere.length > 0 && (
          <div className="panel-block">
            <h3>Динамика спроса</h3>
            <div className="mini-chart">
              {timelineHere.map((s) => (
                <div key={s.era} className="mini-bar-row">
                  <span className="mini-era">{s.era === 'e2010' ? '2010-е' : s.era === 'e2020' ? '2020-23' : s.era === 'e2026' ? 'сейчас' : '2030'}</span>
                  <div className="mini-bar-track">
                    <div className="mini-bar-fill" style={{ width: `${s.demand}%` }} />
                  </div>
                  <span className="mini-num">{s.demand}</span>
                </div>
              ))}
            </div>
            <button className="ghost-btn" onClick={() => goTo('timeline')}>Открыть динамику услуг →</button>
          </div>
        )}

        {aiHere.length > 0 && (
          <div className="panel-block">
            <h3>Влияние ИИ</h3>
            {aiHere.map((a) => (
              <button key={a.id} className="link-row" onClick={() => goTo('ai')}>
                <span className="arrow">{a.direction === 'up' ? '📈' : a.direction === 'down' ? '📉' : '🔄'}</span>
                <span><strong>{a.title}</strong> · влияние {a.magnitude}</span>
              </button>
            ))}
          </div>
        )}

        {related.length > 0 && (
          <div className="panel-block">
            <h3>Связанные узлы</h3>
            <div className="chip-row">
              {related.map((r) => (
                <button
                  key={r.id}
                  className="chip"
                  style={{ '--k': r.color ?? KIND_COLOR[r.kind] } as CSSProperties}
                  onClick={() => openNode(r.id)}
                >
                  {r.emoji} {r.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
