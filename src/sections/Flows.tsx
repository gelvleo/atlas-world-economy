import { useMemo, useState } from 'react';
import type { SectionId } from '../types';
import { NODE_MAP } from '../data/nodes';
import { FLOWS, FLOW_ERA_FILTER } from '../data/flows';

interface Props {
  openNode: (id: string) => void;
  goTo: (s: SectionId) => void;
}

export default function Flows({ openNode, goTo }: Props) {
  const [era, setEra] = useState<string>('all');
  const [activeFlow, setActiveFlow] = useState<string | null>(null);
  const [hoverNode, setHoverNode] = useState<string | null>(null);

  const flows = useMemo(
    () => FLOWS.filter((f) => era === 'all' || (f.era ?? 'e2026') === era),
    [era]
  );

  // Уникальные узлы-участники отфильтрованных потоков
  const nodeIds = useMemo(() => {
    const ids = new Set<string>();
    flows.forEach((f) => {
      ids.add(f.from);
      ids.add(f.to);
    });
    return [...ids];
  }, [flows]);

  const isRelated = (nodeId: string) => {
    if (activeFlow) {
      const f = FLOWS.find((x) => x.id === activeFlow);
      return f ? f.from === nodeId || f.to === nodeId : false;
    }
    if (hoverNode) {
      return flows.some((f) => (f.from === hoverNode || f.to === hoverNode) && (f.from === nodeId || f.to === nodeId));
    }
    return true;
  };

  const W = 900;
  const H = Math.max(520, nodeIds.length * 56);
  const leftIds = nodeIds.filter((_, i) => i % 2 === 0);
  const rightIds = nodeIds.filter((_, i) => i % 2 === 1);

  const pos = (id: string): { x: number; y: number } => {
    const li = leftIds.indexOf(id);
    if (li >= 0) return { x: 130, y: 70 + (li * (H - 140)) / Math.max(1, leftIds.length - 1) };
    const ri = rightIds.indexOf(id);
    return { x: W - 130, y: 70 + (ri * (H - 140)) / Math.max(1, rightIds.length - 1) };
  };

  const flowOpacity = (id: string) => {
    if (activeFlow) return activeFlow === id ? 0.95 : 0.12;
    if (hoverNode) {
      const f = FLOWS.find((x) => x.id === id);
      return f && (f.from === hoverNode || f.to === hoverNode) ? 0.95 : 0.15;
    }
    return 0.55;
  };

  return (
    <div className="section">
      <div className="section-head">
        <h1>💸 Потоки денег</h1>
        <p>
          Кто кому платит и за что. Ширина линии — порядок объёма (оценка). Кликни по потоку, чтобы
          прочитать его историю; клик по узлу откроет карточку со всеми его связями.
        </p>
      </div>

      <div className="filter-row">
        {FLOW_ERA_FILTER.map((f) => (
          <button
            key={f.key}
            className={era === f.key ? 'filter-btn active' : 'filter-btn'}
            onClick={() => {
              setEra(f.key);
              setActiveFlow(null);
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="flow-wrap">
        <div className="flow-svg-wrap">
          <svg viewBox={`0 0 ${W} ${H}`} className="flow-svg">
            {flows.map((f) => {
              const a = pos(f.from);
              const b = pos(f.to);
              const mx = W / 2;
              const w = Math.max(2, Math.min(14, (f.valueNum ?? 20) / 40));
              const active = activeFlow === f.id;
              return (
                <g key={f.id}>
                  <path
                    d={`M ${a.x} ${a.y} C ${mx} ${a.y}, ${mx} ${b.y}, ${b.x} ${b.y}`}
                    fill="none"
                    stroke={active ? '#69f0ae' : '#5b7fb8'}
                    strokeWidth={w}
                    strokeOpacity={flowOpacity(f.id)}
                    className="flow-path"
                    style={{ cursor: 'pointer' }}
                    onClick={() => setActiveFlow(active ? null : f.id)}
                  />
                  <circle
                    cx={b.x}
                    cy={b.y}
                    r={4}
                    fill="#69f0ae"
                    fillOpacity={flowOpacity(f.id)}
                  />
                </g>
              );
            })}
            {nodeIds.map((id) => {
              const n = NODE_MAP[id];
              if (!n) return null;
              const p = pos(id);
              const dim = !isRelated(id);
              const onLeft = leftIds.includes(id);
              return (
                <g
                  key={id}
                  className="flow-node"
                  style={{ cursor: 'pointer', opacity: dim ? 0.35 : 1 }}
                  onClick={() => openNode(id)}
                  onMouseEnter={() => setHoverNode(id)}
                  onMouseLeave={() => setHoverNode(null)}
                >
                  <rect
                    x={onLeft ? p.x - 120 : p.x - 40}
                    y={p.y - 26}
                    width={160}
                    height={52}
                    rx={12}
                    fill="#131c2e"
                    stroke={n.color}
                    strokeWidth={1.5}
                  />
                  <text
                    x={onLeft ? p.x - 40 : p.x + 40}
                    y={p.y - 4}
                    textAnchor="middle"
                    className="flow-node-emoji"
                  >
                    {n.emoji}
                  </text>
                  <text
                    x={onLeft ? p.x - 40 : p.x + 40}
                    y={p.y + 16}
                    textAnchor="middle"
                    className="flow-node-name"
                  >
                    {n.name.length > 20 ? n.name.slice(0, 19) + '…' : n.name}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        <div className="flow-list">
          <h3>{activeFlow ? 'Выбранный поток' : 'Все потоки'}</h3>
          {(activeFlow ? flows.filter((f) => f.id === activeFlow) : flows).map((f) => {
            const from = NODE_MAP[f.from];
            const to = NODE_MAP[f.to];
            return (
              <button
                key={f.id}
                className={activeFlow === f.id ? 'flow-card active' : 'flow-card'}
                onClick={() => setActiveFlow(activeFlow === f.id ? null : f.id)}
              >
                <div className="flow-card-head">
                  <span className="flow-route">
                    <em onClick={(e) => { e.stopPropagation(); openNode(f.from); }}>{from?.emoji} {from?.name}</em>
                    <span className="flow-arrow">⟶</span>
                    <em onClick={(e) => { e.stopPropagation(); openNode(f.to); }}>{to?.emoji} {to?.name}</em>
                  </span>
                  <span className="flow-value">{f.value}</span>
                </div>
                <div className="flow-label">{f.label}</div>
                {activeFlow === f.id && <p className="flow-desc">{f.description}</p>}
              </button>
            );
          })}
          <button className="ghost-btn" onClick={() => goTo('chains')}>
            Смотреть цепочки зависимостей →
          </button>
        </div>
      </div>
    </div>
  );
}
