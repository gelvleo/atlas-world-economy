import { useState } from 'react';
import type { SectionId } from '../types';
import { NODE_MAP } from '../data/nodes';
import { CHAINS, DEPENDENCY_LINKS } from '../data/chains';
import { IconNext, IconPrev, NodeGlyph } from '../ui/icons';
import { KIND_LABEL } from '../ui/glyphs';
import Val from '../ui/num';
import { ORPHAN_NODES } from '../components/NodePanel';
import './mindmap.css';

interface Props {
  openNode: (id: string) => void;
  goTo: (s: SectionId) => void;
}

// Сила связи — словом в метке, а не цветной заливкой строки.
const STRENGTH_LABEL: Record<string, string> = {
  critical: 'критичная',
  strong: 'сильная',
  moderate: 'умеренная'
};

const STRENGTH_ORDER = ['critical', 'strong', 'moderate'];

export default function Chains({ openNode, goTo }: Props) {
  const [activeChain, setActiveChain] = useState<string>(CHAINS[0].id);
  const chain = CHAINS.find((c) => c.id === activeChain)!;
  const links = [...DEPENDENCY_LINKS].sort(
    (a, b) => STRENGTH_ORDER.indexOf(a.strength) - STRENGTH_ORDER.indexOf(b.strength)
  );

  return (
    <div className="section">
      <div className="section-head">
        <p className="kicker">Цепочки</p>
        <h1 className="section-title">Цепочки зависимостей</h1>
        <p className="section-lead">
          Экономика держится на неочевидных связях: цена газа определяет цену еды, доступность
          чипов — скорость ИИ. Выбери цепочку и открой любое звено.
        </p>
      </div>

      <div className="toolbar" role="tablist" aria-label="Сквозные цепочки">
        {CHAINS.map((c) => (
          <button
            key={c.id}
            role="tab"
            aria-selected={activeChain === c.id}
            className={activeChain === c.id ? 'btn btn--ghost active' : 'btn btn--ghost'}
            onClick={() => setActiveChain(c.id)}
          >
            {c.title.split(' → ')[0]}
          </button>
        ))}
      </div>

      <div className="grid grid--73">
        <div className="stack stack--loose">
          <div className="stack stack--tight">
            <p className="kicker">Маршрут · {chain.nodes.length} звена</p>
            <h2 className="h2">{chain.title}</h2>
          </div>

          {/* Маршрут: шаги в строку со стрелками, на телефоне — колонкой */}
          <ol className="route">
            {chain.nodes.map((id, i) => {
              const n = NODE_MAP[id];
              if (!n) return null;
              return (
                <li className="route-step" key={id}>
                  <button className="route-node" onClick={() => openNode(id)}>
                    <span className="route-node-head">
                      <NodeGlyph node={n} />
                      <span className="route-node-name">{n.name}</span>
                    </span>
                    {n.value && <Val className="route-node-value" value={n.value} />}
                  </button>
                  {i < chain.nodes.length - 1 && (
                    <span className="route-arrow" aria-hidden="true" />
                  )}
                </li>
              );
            })}
          </ol>
        </div>

        <aside className="stack stack--loose">
          <div className="stack stack--tight">
            <p className="kicker">Суть цепочки</p>
            <p>{chain.summary}</p>
          </div>
          <hr className="hair" />
          <div className="stack stack--tight">
            <p className="kicker">Где узкое место</p>
            <p>{chain.insight}</p>
          </div>
          {chain.aiImpact && (
            <>
              <hr className="hair" />
              <div className="stack stack--tight">
                <p className="kicker">Роль ИИ</p>
                <p>{chain.aiImpact}</p>
                <div>
                  <button className="btn btn--ghost" onClick={() => goTo('ai')}>
                    Больше про влияние ИИ <IconNext />
                  </button>
                </div>
              </div>
            </>
          )}
        </aside>
      </div>

      <hr className="hair" />

      <div className="section-head">
        <p className="kicker">Парные зависимости</p>
        <h2 className="h2">Кто на кого влияет</h2>
        <p className="section-lead">
          Сила связи показывает, насколько поломка одного звена бьёт по другому. Клик по узлу
          открывает его карточку.
        </p>
      </div>

      <div className="list">
        {links.map((d) => {
          const from = NODE_MAP[d.from];
          const to = NODE_MAP[d.to];
          if (!from || !to) return null;
          return (
            <div className="list-row dep-row" key={d.id}>
              <div className="list-main stack stack--tight">
                <span className="dep-route">
                  <button className="dep-node" onClick={() => openNode(d.from)}>
                    <NodeGlyph node={from} />
                    <span>{from.name}</span>
                  </button>
                  <span className="route-arrow route-arrow--inline" aria-hidden="true" />
                  <button className="dep-node" onClick={() => openNode(d.to)}>
                    <NodeGlyph node={to} />
                    <span>{to.name}</span>
                  </button>
                </span>
                <span className="meta">
                  <b className="dep-label">{d.label}.</b> {d.description}
                </span>
              </div>
              <span className={d.strength === 'critical' ? 'tag tag--down' : 'tag'}>
                {STRENGTH_LABEL[d.strength]}
              </span>
            </div>
          );
        })}
      </div>

      {/* Узлы, которых нет ни в одном потоке, цепочке, зависимости и эффекте ИИ.
          Список считается из данных: пусто — блока нет. */}
      {ORPHAN_NODES.length > 0 && (
        <>
          <hr className="hair" />

          <div className="section-head">
            <p className="kicker">Дыры в данных</p>
            <h2 className="h2">Узлы без потоков и цепочек</h2>
            <p className="section-lead">
              Таких узлов <span className="num">{ORPHAN_NODES.length}</span>: они не участвуют ни
              в одном денежном потоке, ни в цепочке, ни в парной зависимости, ни в эффекте ИИ.
              Держатся только на смежных связях — число справа показывает, сколько их записано.
            </p>
          </div>

          <div className="list">
            {ORPHAN_NODES.map((n) => (
              <div className="list-row" key={n.id}>
                <span className="list-main row row--wrap">
                  <button className="dep-node" onClick={() => openNode(n.id)}>
                    <NodeGlyph node={n} />
                    <span>{n.name}</span>
                  </button>
                  <span className="tag">{KIND_LABEL[n.kind]}</span>
                  {n.domain === 'ru-edtech' && <span className="tag tag--muted">рынок EdTech</span>}
                </span>
                <span className="list-side">
                  <span className="num">{n.related.length}</span> смежных
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="crossnav">
        <button className="btn btn--ghost" onClick={() => goTo('flows')}>
          <IconPrev /> Потоки денег
        </button>
        <button className="btn btn--ghost" onClick={() => goTo('timeline')}>
          Динамика услуг <IconNext />
        </button>
      </div>
    </div>
  );
}
