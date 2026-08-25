import { useMemo, useState, type CSSProperties } from 'react';
import type { SectionId } from '../types';
import { NODES, KIND_COLOR, KIND_LABEL } from '../data/nodes';
import { FLOWS } from '../data/flows';
import { AI_STATS } from '../data/ai';
import { ERAS } from '../data/timeline';

interface Props {
  openNode: (id: string) => void;
  goTo: (s: SectionId) => void;
}

const KIND_FILTERS = [
  { key: 'all', label: 'Всё' },
  { key: 'country', label: 'Страны' },
  { key: 'sector', label: 'Сектора' },
  { key: 'product', label: 'Продукты' },
  { key: 'service', label: 'Услуги' },
  { key: 'tech', label: 'Технологии' }
];

export default function Overview({ openNode, goTo }: Props) {
  const [filter, setFilter] = useState('all');

  const nodes = useMemo(
    () => (filter === 'all' ? NODES : NODES.filter((n) => n.kind === filter)),
    [filter]
  );

  return (
    <div className="section">
      <div className="hero">
        <h1>Мировая экономика — как система</h1>
        <p>
          Не таблица цифр, а живая карта: куда текут деньги, что от чего зависит, как меняется
          спрос на услуги и что делает с этим ИИ. Кликай по любому узлу — каждый связан со всеми
          остальными.
        </p>
        <div className="hero-stats">
          {AI_STATS.map((s) => (
            <button key={s.label} className="stat-card" onClick={() => goTo('ai')}>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
              <div className="stat-hint">{s.hint}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="quicknav">
        <button className="quick-card" onClick={() => goTo('flows')}>
          <span className="quick-icon">💸</span>
          <strong>Потоки денег</strong>
          <small>{FLOWS.length} потоков между странами и секторами — кто кому платит и за что</small>
        </button>
        <button className="quick-card" onClick={() => goTo('chains')}>
          <span className="quick-icon">🔗</span>
          <strong>Цепочки зависимостей</strong>
          <small>Чипы → дата-центры → энергия и другие связи, где ломается всё</small>
        </button>
        <button className="quick-card" onClick={() => goTo('timeline')}>
          <span className="quick-icon">📈</span>
          <strong>Динамика услуг</strong>
          <small>Что было популярно в 2010-х, что сейчас — и почему спрос переехал</small>
        </button>
        <button className="quick-card" onClick={() => goTo('ai')}>
          <span className="quick-icon">🤖</span>
          <strong>Влияние ИИ</strong>
          <small>Где ИИ разгоняет спрос, где обесценивает, а где переписывает правила</small>
        </button>
      </div>

      <div className="block">
        <div className="block-head">
          <h2>Карта узлов экономики</h2>
          <div className="filter-row">
            {KIND_FILTERS.map((f) => (
              <button
                key={f.key}
                className={filter === f.key ? 'filter-btn active' : 'filter-btn'}
                onClick={() => setFilter(f.key)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
        <div className="node-grid">
          {nodes.map((n) => (
            <button
              key={n.id}
              className="node-card"
              style={{ '--k': n.color ?? KIND_COLOR[n.kind] } as CSSProperties}
              onClick={() => openNode(n.id)}
            >
              <div className="node-top">
                <span className="node-emoji" aria-hidden="true">{n.emoji}</span>
                <span className="kind-badge">{KIND_LABEL[n.kind]}</span>
              </div>
              <div className="node-name">{n.name}</div>
              {n.value && <div className="node-value">{n.value}</div>}
            </button>
          ))}
        </div>
      </div>

      <div className="block eras-preview">
        <h2>Четыре эпохи спроса</h2>
        <div className="eras-row">
          {ERAS.map((e, i) => (
            <button key={e.key} className="era-card" onClick={() => goTo('timeline')}>
              <div className="era-num">{i + 1}</div>
              <div className="era-label">{e.label}</div>
              <div className="era-title">{e.title}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
