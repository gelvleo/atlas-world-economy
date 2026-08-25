import { useCallback, useMemo, useState } from 'react';
import type { ComponentType } from 'react';
import type { SectionId } from './types';
import { ALL_NODES, NODE_MAP } from './data/nodes';
import Overview from './sections/Overview';
import Flows from './sections/Flows';
import Chains from './sections/Chains';
import Timeline from './sections/Timeline';
import AiImpact from './sections/AiImpact';
import Market from './sections/Market';
import NodePanel from './components/NodePanel';
import {
  IconOverview,
  IconFlows,
  IconChains,
  IconTimeline,
  IconAi,
  IconMarket,
  IconSearch,
  NodeGlyph
} from './ui/icons';
import { KIND_LABEL } from './ui/glyphs';

const SECTIONS: { id: SectionId; label: string; Icon: ComponentType<{ size?: 18 | 20 }> }[] = [
  { id: 'overview', label: 'Обзор', Icon: IconOverview },
  { id: 'flows', label: 'Потоки денег', Icon: IconFlows },
  { id: 'chains', label: 'Цепочки зависимостей', Icon: IconChains },
  { id: 'timeline', label: 'Динамика услуг', Icon: IconTimeline },
  { id: 'ai', label: 'Влияние ИИ', Icon: IconAi },
  // Рублёвый домен ru-edtech: отдельный периметр, в мировые агрегаты не входит.
  { id: 'market', label: 'Рынок EdTech', Icon: IconMarket }
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

  const query = search.trim().toLowerCase();

  const searchResults = useMemo(() => {
    if (query.length < 2) return [];
    return ALL_NODES.filter(
      (n) =>
        n.name.toLowerCase().includes(query) ||
        n.description.toLowerCase().includes(query) ||
        (n.tags ?? []).some((t) => t.includes(query))
    ).slice(0, 8);
  }, [query]);

  // выпадающий список показываем, как только в поле что-то есть:
  // при коротком запросе объясняем, при пустой выдаче — говорим прямо
  const showResults = query.length > 0;

  return (
    <div className="app">
      {/* шапка и лента разделов — один липкий блок */}
      <div className="header">
        <header className="topbar">
          <button className="brand" onClick={() => goTo('overview')}>
            <span className="brand-mark">
              <IconOverview size={20} />
            </span>
            <span className="brand-name">Atlas</span>
            <span className="brand-sub">мировая экономика · оценки 2026</span>
          </button>

          <div className="search-wrap">
            <span className="search-icon">
              <IconSearch size={18} />
            </span>
            <input
              className="field"
              type="search"
              aria-label="Поиск по узлам"
              placeholder="Чипы, энергия, услуги…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {showResults && (
              <div className="search-results panel" role="listbox">
                {query.length < 2 && <div className="empty meta">Введите два символа или больше.</div>}
                {query.length >= 2 && searchResults.length === 0 && (
                  <div className="empty">
                    <span className="empty-title">Ничего не найдено</span>
                    <span className="meta">Проверьте написание или попробуйте общее слово: «чипы», «облака», «энергия».</span>
                    <button className="btn btn--ghost" onClick={() => setSearch('')}>
                      Очистить запрос
                    </button>
                  </div>
                )}
                {searchResults.map((n) => (
                  <button
                    key={n.id}
                    className="search-hit"
                    role="option"
                    aria-selected={false}
                    onClick={() => {
                      openNode(n.id);
                      setSearch('');
                    }}
                  >
                    <NodeGlyph node={n} />
                    <span className="search-hit-name">{n.name}</span>
                    <span className="search-hit-kind">{KIND_LABEL[n.kind]}</span>
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
              <s.Icon size={18} />
              <span>{s.label}</span>
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
        {section === 'market' && <Market openNode={openNode} goTo={goTo} />}
      </main>

      <footer className="footer">
        <div className="footer-inner">
          <p>
            Карта для понимания, а не статистический справочник: цифры — ориентировочные оценки
            на 2026 год по открытым источникам, важен порядок величины и связь. Прогнозы помечены.
          </p>
          <p>
            Мировой периметр считается в долларах, рынок EdTech — в рублях. Домены не складываются.
          </p>
        </div>
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
