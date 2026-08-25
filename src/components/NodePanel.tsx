import { useEffect, useMemo, useRef } from 'react';
import type { EvidenceKind, SectionId } from '../types';
import { NODE_MAP } from '../data/nodes';
import { FLOWS } from '../data/flows';
import { CHAINS } from '../data/chains';
import { EDTECH_FLOWS, EDTECH_CHAINS } from '../data/edtech';
import { SERVICE_ERAS } from '../data/timeline';
import { AI_IMPACTS } from '../data/ai';
import { KIND_LABEL } from '../ui/glyphs';
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

  // Escape закрывает панель, фокус возвращается на элемент, который её открыл.
  // onClose приходит новой ссылкой на каждый рендер — держим его в ref, иначе
  // эффект перезапустится и запомнит вместо кнопки-открывателя саму панель.
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const openerRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    openerRef.current = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeRef.current();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      openerRef.current?.focus?.();
    };
  }, []);

  if (!node) return null;

  const related = node.related.map((id) => NODE_MAP[id]).filter(Boolean);

  return (
    <div className="np-overlay" onClick={onClose}>
      <aside
        className="np panel"
        role="dialog"
        aria-modal="true"
        aria-label={node.name}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="np-head">
          <div className="np-head-main">
            <div className="row">
              <NodeGlyph node={node} />
              <span className="tag">{KIND_LABEL[node.kind]}</span>
            </div>
            <h2 className="h2">{node.name}</h2>
            {node.value && <div className="np-value">{node.value}</div>}
          </div>
          <button className="btn--icon" onClick={onClose} aria-label="Закрыть карточку узла">
            <IconClose />
          </button>
        </header>

        <div className="np-body">
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
              <p className="kicker">Потоки денег</p>
              <div className="list">
                {flowsOut.map((f) => (
                  <button key={f.id} className="list-row" onClick={() => goTo('flows')}>
                    <span className="np-dir" aria-hidden="true">
                      →
                    </span>
                    <span className="list-main">
                      <b>{f.label}</b>{' '}
                      <span className="meta">в {NODE_MAP[f.to]?.name ?? f.to}</span>
                    </span>
                    <span className="list-side">{f.value}</span>
                  </button>
                ))}
                {flowsIn.map((f) => (
                  <button key={f.id} className="list-row" onClick={() => goTo('flows')}>
                    <span className="np-dir" aria-hidden="true">
                      ←
                    </span>
                    <span className="list-main">
                      <b>{f.label}</b>{' '}
                      <span className="meta">из {NODE_MAP[f.from]?.name ?? f.from}</span>
                    </span>
                    <span className="list-side">{f.value}</span>
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
