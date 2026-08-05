import { useState } from 'react';
import type { SectionId } from '../types';
import { NODE_MAP } from '../data/nodes';
import { CHAINS, DEPENDENCY_LINKS } from '../data/chains';

interface Props {
  openNode: (id: string) => void;
  goTo: (s: SectionId) => void;
}

const STRENGTH_LABEL = {
  critical: '🔴 критичная',
  strong: '🟠 сильная',
  moderate: '🟡 умеренная'
};

export default function Chains({ openNode, goTo }: Props) {
  const [activeChain, setActiveChain] = useState<string>(CHAINS[0].id);
  const chain = CHAINS.find((c) => c.id === activeChain)!;

  return (
    <div className="section">
      <div className="section-head">
        <h1>🔗 Цепочки зависимостей</h1>
        <p>
          Экономика держится на неочевидных связях: цена газа определяет цену еды, а доступность
          чипов — скорость ИИ-прогресса. Выбери цепочку и кликай по звеньям — каждое раскрывается в
          карточку.
        </p>
      </div>

      <div className="chain-tabs">
        {CHAINS.map((c) => (
          <button
            key={c.id}
            className={activeChain === c.id ? 'chain-tab active' : 'chain-tab'}
            onClick={() => setActiveChain(c.id)}
          >
            {c.title}
          </button>
        ))}
      </div>

      <div className="chain-visual">
        {chain.nodes.map((id, i) => {
          const n = NODE_MAP[id];
          if (!n) return null;
          return (
            <div key={id} className="chain-step">
              <button className="chain-node" style={{ borderColor: n.color }} onClick={() => openNode(id)}>
                <span className="chain-node-emoji">{n.emoji}</span>
                <span className="chain-node-name">{n.name}</span>
                {n.value && <span className="chain-node-value">{n.value}</span>}
              </button>
              {i < chain.nodes.length - 1 && <div className="chain-link">⬇︎ тянет за собой</div>}
            </div>
          );
        })}
      </div>

      <div className="chain-insight">
        <div className="insight-card">
          <h3>💡 Суть цепочки</h3>
          <p>{chain.insight}</p>
        </div>
        {chain.aiImpact && (
          <div className="insight-card ai">
            <h3>🤖 Роль ИИ</h3>
            <p>{chain.aiImpact}</p>
            <button className="ghost-btn" onClick={() => goTo('ai')}>
              Больше про влияние ИИ →
            </button>
          </div>
        )}
      </div>

      <div className="block">
        <h2>Граф зависимостей: кто на кого влияет</h2>
        <p className="muted">
          Клик по любому узлу — его карточка. Сила связи показывает, насколько поломка одного звена
          бьёт по другому.
        </p>
        <div className="dep-grid">
          {DEPENDENCY_LINKS.map((d) => {
            const from = NODE_MAP[d.from];
            const to = NODE_MAP[d.to];
            if (!from || !to) return null;
            return (
              <div key={d.id} className="dep-card">
                <div className="dep-route">
                  <button className="dep-node" onClick={() => openNode(d.from)}>
                    {from.emoji} {from.name}
                  </button>
                  <span className="dep-arrow">→</span>
                  <button className="dep-node" onClick={() => openNode(d.to)}>
                    {to.emoji} {to.name}
                  </button>
                </div>
                <div className="dep-meta">
                  <span className="dep-strength">{STRENGTH_LABEL[d.strength]}</span>
                  <span className="dep-label">{d.label}</span>
                </div>
                <p className="dep-desc">{d.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="crossnav">
        <button className="ghost-btn" onClick={() => goTo('flows')}>← Потоки денег</button>
        <button className="ghost-btn" onClick={() => goTo('timeline')}>Динамика услуг →</button>
      </div>
    </div>
  );
}
