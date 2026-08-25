import { useCallback, useMemo, useState } from 'react';
import type { SectionId } from './types';
import { NODE_MAP, NODES } from './data/nodes';
import Overview from './sections/Overview';
import Flows from './sections/Flows';
import Chains from './sections/Chains';
import Timeline from './sections/Timeline';
import AiImpact from './sections/AiImpact';
import NodePanel from './components/NodePanel';

const SECTIONS: { id: SectionId; label: string; icon: string }[] = [
  { id: 'overview', label: 'Обзор', icon: '🌍' },
  { id: 'flows', label: 'Потоки денег', icon: '💸' },
  { id: 'chains', label: 'Цепочки зависимостей', icon: '🔗' },
  { id: 'timeline', label: 'Динамика услуг', icon: '📈' },
  { id: 'ai', label: 'Влияние ИИ', icon: '🤖' }
];

export default function App() {
  const [section, setSection] = useState<SectionId>('overview');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const openNode = useCallback((id: string) => {
    if (NODE_MAP[id]) setSelectedNodeId(id);
  }, []);

  const goTo = useCallback((s: SectionId) => {
    setSection(s);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const searchResults = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (q.length < 2) return [];
    return NODES.filter(
      (n) =>
        n.name.toLowerCase().includes(q) ||
        n.description.toLowerCase().includes(q) ||
        (n.tags ?? []).some((t) => t.includes(q))
    ).slice(0, 8);
  }, [search]);

  return (
    <div className="app">
      {/* шапка и лента разделов — один липкий блок */}
      <div className="header">
      <header className="topbar">
        <button className="brand" onClick={() => goTo('overview')}>
          <span className="brand-globe">🌐</span>
          <span className="brand-text">
            ATLAS
            <small>понимание мировой экономики · оценки 2026</small>
          </span>
        </button>
        <div className="search-wrap">
          <input
            className="search"
            placeholder="Поиск: чипы, энергия, услуги…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {searchResults.length > 0 && (
            <div className="search-results">
              {searchResults.map((n) => (
                <button
                  key={n.id}
                  onClick={() => {
                    openNode(n.id);
                    setSearch('');
                  }}
                >
                  <span>{n.emoji}</span> {n.name}
                  <em>{n.kind === 'country' ? 'страна' : n.kind === 'sector' ? 'сектор' : n.kind === 'product' ? 'продукт' : n.kind === 'service' ? 'услуга' : 'технология'}</em>
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      <nav className="nav" aria-label="Разделы">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            className={section === s.id ? 'nav-btn active' : 'nav-btn'}
            aria-current={section === s.id ? 'page' : undefined}
            onClick={() => goTo(s.id)}
          >
            <span className="nav-icon" aria-hidden="true">{s.icon}</span>
            <span className="nav-label">{s.label}</span>
          </button>
        ))}
      </nav>
      </div>

      <main className="main">
        {section === 'overview' && <Overview openNode={openNode} goTo={goTo} />}
        {section === 'flows' && <Flows openNode={openNode} goTo={goTo} />}
        {section === 'chains' && <Chains openNode={openNode} goTo={goTo} />}
        {section === 'timeline' && <Timeline openNode={openNode} goTo={goTo} />}
        {section === 'ai' && <AiImpact openNode={openNode} goTo={goTo} />}
      </main>

      <footer className="footer">
        <p>
          <strong>ATLAS</strong> — карта для понимания, а не статистический справочник. Все цифры —
          ориентировочные оценки на 2026 год по открытым источникам: порядок величин и связи важнее
          точных значений. Прогнозы помечены отдельно.
        </p>
        <p className="footer-note">
          Источники ориентиров: МВФ и Всемирный банк (ВВП), отраслевые оценки полупроводникового
          рынка, отчёты гиперскейлеров о capex, открытые обзоры по ИИ. Данные не обновляются
          автоматически.
        </p>
      </footer>

      {selectedNodeId && (
        <NodePanel
          nodeId={selectedNodeId}
          onClose={() => setSelectedNodeId(null)}
          openNode={openNode}
          goTo={goTo}
          currentSection={section}
        />
      )}
    </div>
  );
}
