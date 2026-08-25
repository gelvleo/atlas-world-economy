import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type MouseEvent as ReactMouseEvent,
} from 'react';
import {
  Background,
  BackgroundVariant,
  Controls,
  Handle,
  MarkerType,
  MiniMap,
  Panel,
  Position,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesInitialized,
  useNodesState,
  useReactFlow,
  type Edge,
  type Node,
  type NodeProps,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import './mindmap.css';
import type { NodeKind, SectionId } from '../types';
import { KIND_COLOR, KIND_LABEL, NODES, NODE_MAP } from '../data/nodes';
import { FLOWS, FLOW_ERA_FILTER } from '../data/flows';

interface Props {
  openNode: (id: string) => void;
  goTo: (s: SectionId) => void;
}

const KIND_ORDER: NodeKind[] = ['country', 'sector', 'product', 'service', 'tech'];

const GROUP_LABEL: Record<NodeKind, string> = {
  country: 'Страны',
  sector: 'Сектора',
  product: 'Продукты',
  service: 'Услуги',
  tech: 'Технологии',
};

const GROUP_EMOJI: Record<NodeKind, string> = {
  country: '🌍',
  sector: '🏭',
  product: '📦',
  service: '🤝',
  tech: '⚡',
};

const GROUP_X = 400;
const LEAF_X = 740;
const LEAF_STEP = 84;
const GROUP_GAP = 56;

interface MindData {
  nid?: string;
  label: string;
  emoji?: string;
  color: string;
  kind?: NodeKind;
  value?: string;
  description?: string;
  count?: number;
  collapsed?: boolean;
  subtitle?: string;
  tipBelow?: boolean;
}

const asData = (d: unknown): MindData => (d ?? {}) as MindData;

interface MindCtxValue {
  hover: string | null;
  hoverKind?: NodeKind;
  matches: Set<string> | null;
  matchKinds: Set<NodeKind>;
  neighbors: Map<string, Set<string>>;
}

const MindCtx = createContext<MindCtxValue>({
  hover: null,
  matches: null,
  matchKinds: new Set(),
  neighbors: new Map(),
});

function LeafNode({ data, selected }: NodeProps) {
  const d = asData(data);
  const { hover, matches, neighbors } = useContext(MindCtx);
  const nid = d.nid ?? '';

  let cls = 'mm-leaf';
  if (selected) cls += ' is-selected';
  if (matches) {
    cls += matches.has(nid) ? ' is-match' : ' is-dim';
  } else if (hover) {
    if (hover === nid) cls += ' is-focus';
    else if (!neighbors.get(hover)?.has(nid)) cls += ' is-dim';
  }

  return (
    <div className={cls} style={{ borderLeftColor: d.color }}>
      <Handle type="target" position={Position.Left} className="mm-handle" />
      <span className="mm-emoji" aria-hidden="true">{d.emoji}</span>
      <span className="mm-body">
        <span className="mm-name">{d.label}</span>
        {d.value && <span className="mm-val">{d.value}</span>}
      </span>
      <Handle type="source" position={Position.Right} className="mm-handle" />
      {hover === nid && (
        <div className={'mm-tip' + (d.tipBelow ? ' mm-tip-below' : '')}>
          <b>
            {d.emoji} {d.label}
          </b>
          {d.value && <em>{d.value}</em>}
          <p>{d.description}</p>
          <span className="mm-tip-foot">
            {d.kind ? KIND_LABEL[d.kind] : 'узел'} · клик откроет карточку
          </span>
        </div>
      )}
    </div>
  );
}

function GroupNode({ data, selected }: NodeProps) {
  const d = asData(data);
  const { hover, hoverKind, matches, matchKinds } = useContext(MindCtx);

  let cls = 'mm-group' + (selected ? ' is-selected' : '') + (d.collapsed ? ' is-collapsed' : '');
  if (matches) {
    if (!d.kind || !matchKinds.has(d.kind)) cls += ' is-dim';
  } else if (hover && d.kind && hoverKind !== d.kind) {
    cls += ' is-dim';
  }

  return (
    <div className={cls} style={{ borderLeftColor: d.color }}>
      <Handle type="target" position={Position.Left} className="mm-handle" />
      <span className="mm-emoji" aria-hidden="true">{d.emoji}</span>
      <span className="mm-body">
        <span className="mm-name">{d.label}</span>
        <span className="mm-val">{d.collapsed ? 'клик — раскрыть' : 'клик — свернуть'}</span>
      </span>
      <span className="mm-count">{d.count}</span>
      <span className="mm-caret">{d.collapsed ? '▸' : '▾'}</span>
      <Handle type="source" position={Position.Right} className="mm-handle" />
    </div>
  );
}

function RootNode({ data }: NodeProps) {
  const d = asData(data);
  return (
    <div className="mm-root">
      <Handle type="source" position={Position.Right} className="mm-handle mm-handle-root" />
      <b>
        {d.emoji} {d.label}
      </b>
      <span>{d.subtitle}</span>
    </div>
  );
}

const nodeTypes = {
  root: RootNode,
  group: GroupNode,
  eco: LeafNode,
};

/* Тач-устройство: одним пальцем React Flow панорамирует холст и забирает
   прокрутку страницы. Поэтому жесты карты по умолчанию выключены и
   включаются кнопкой — тапы по узлам работают в обоих режимах. */
const isCoarsePointer = () =>
  typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;

function FlowsMindmap({ openNode, goTo }: Props) {
  const rf = useReactFlow();
  // fitView считает границы по измеренным узлам: до измерения он обрезает крайние
  const nodesReady = useNodesInitialized();
  const [isTouch] = useState(isCoarsePointer);
  // на узком холсте нужен запас: узлы измеряются после рендера, и fitView
  // без запаса обрезает крайние карточки
  const fitPad = isTouch ? 0.25 : 0.15;
  const [gestures, setGestures] = useState(() => !isCoarsePointer());

  const [kindFilter, setKindFilter] = useState<NodeKind | 'all'>('all');
  const [era, setEra] = useState<string>('all');
  const [onlyFlows, setOnlyFlows] = useState(false);
  const [showRelated, setShowRelated] = useState(true);
  const [search, setSearch] = useState('');
  const [collapsed, setCollapsed] = useState<Set<NodeKind>>(() =>
    isCoarsePointer() ? new Set(KIND_ORDER) : new Set()
  );
  const [hoverNode, setHoverNode] = useState<string | null>(null);
  const [selectedFlow, setSelectedFlow] = useState<string | null>(null);

  const eraFlows = useMemo(
    () => FLOWS.filter((f) => era === 'all' || (f.era ?? 'e2026') === era),
    [era]
  );

  const visibleNodes = useMemo(() => {
    const participants = new Set<string>();
    eraFlows.forEach((f) => {
      participants.add(f.from);
      participants.add(f.to);
    });
    return NODES.filter((n) => {
      if (kindFilter !== 'all' && n.kind !== kindFilter) return false;
      if (onlyFlows && !participants.has(n.id)) return false;
      return true;
    });
  }, [kindFilter, onlyFlows, eraFlows]);

  const matches = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return null;
    return new Set(
      visibleNodes
        .filter(
          (n) =>
            n.name.toLowerCase().includes(q) ||
            (n.tags ?? []).some((t) => t.toLowerCase().includes(q))
        )
        .map((n) => n.id)
    );
  }, [search, visibleNodes]);

  const matchKinds = useMemo(() => {
    const s = new Set<NodeKind>();
    if (matches) {
      matches.forEach((id) => {
        const k = NODE_MAP[id]?.kind;
        if (k) s.add(k);
      });
    }
    return s;
  }, [matches]);

  useEffect(() => {
    if (!matches || matches.size === 0) return;
    setCollapsed((prev) => {
      let changed = false;
      const next = new Set(
        [...prev].filter((k) => {
          if (matchKinds.has(k)) {
            changed = true;
            return false;
          }
          return true;
        })
      );
      return changed ? next : prev;
    });
  }, [matches, matchKinds]);

  const groups = useMemo(() => {
    const byKind = new Map<NodeKind, typeof NODES>();
    KIND_ORDER.forEach((k) => byKind.set(k, []));
    visibleNodes.forEach((n) => byKind.get(n.kind)!.push(n));
    KIND_ORDER.forEach((k) =>
      byKind.get(k)!.sort((a, b) => (b.valueNum ?? 0) - (a.valueNum ?? 0))
    );
    return KIND_ORDER.map((kind) => ({ kind, leaves: byKind.get(kind)! })).filter(
      (g) => g.leaves.length > 0
    );
  }, [visibleNodes]);

  const openLeafIds = useMemo(() => {
    const s = new Set<string>();
    groups.forEach((g) => {
      if (!collapsed.has(g.kind)) g.leaves.forEach((n) => s.add(n.id));
    });
    return s;
  }, [groups, collapsed]);

  const layoutNodes = useMemo(() => {
    const nodes: Node[] = [];

    let cursorY = 0;
    const blocks = groups.map((g) => {
      const open = !collapsed.has(g.kind);
      const height = open ? Math.max(1, g.leaves.length) * LEAF_STEP - 22 : 66;
      const block = { ...g, open, top: cursorY, height };
      cursorY += height + GROUP_GAP;
      return block;
    });
    const totalH = Math.max(0, cursorY - GROUP_GAP);
    const rootY = totalH / 2 - 42;

    nodes.push({
      id: 'root',
      type: 'root',
      position: { x: 0, y: rootY },
      draggable: false,
      selectable: false,
      data: {
        label: 'Мировая экономика',
        emoji: '🌐',
        color: 'var(--accent)',
        subtitle: `${visibleNodes.length} узлов · ${eraFlows.length} потоков`,
      },
    });

    blocks.forEach((g) => {
      const gid = `group-${g.kind}`;
      const color = KIND_COLOR[g.kind];
      nodes.push({
        id: gid,
        type: 'group',
        position: { x: GROUP_X, y: g.top + g.height / 2 - 31 },
        draggable: false,
        data: {
          label: GROUP_LABEL[g.kind],
          emoji: GROUP_EMOJI[g.kind],
          color,
          kind: g.kind,
          count: g.leaves.length,
          collapsed: !g.open,
        },
      });

      if (g.open) {
        g.leaves.forEach((n, i) => {
          const y = g.top + i * LEAF_STEP;
          nodes.push({
            id: n.id,
            type: 'eco',
            position: { x: LEAF_X, y },
            data: {
              nid: n.id,
              label: n.name,
              emoji: n.emoji,
              color: n.color ?? color,
              kind: n.kind,
              value: n.value,
              description: n.description,
              tipBelow: y < 130,
            },
          });
        });
      }
    });

    return nodes;
  }, [groups, collapsed, visibleNodes.length, eraFlows.length]);

  const edgesData = useMemo(() => {
    const edges: Edge[] = [];
    const neighbors = new Map<string, Set<string>>();
    const link = (a: string, b: string) => {
      if (!neighbors.has(a)) neighbors.set(a, new Set());
      if (!neighbors.has(b)) neighbors.set(b, new Set());
      neighbors.get(a)!.add(b);
      neighbors.get(b)!.add(a);
    };

    groups.forEach((g) => {
      const gid = `group-${g.kind}`;
      const color = KIND_COLOR[g.kind];
      edges.push({
        id: `root-${g.kind}`,
        source: 'root',
        target: gid,
        style: { stroke: 'var(--border-strong)', strokeWidth: 2, opacity: 0.9 },
      });
      if (!collapsed.has(g.kind)) {
        g.leaves.forEach((n) => {
          edges.push({
            id: `grp-${g.kind}-${n.id}`,
            source: gid,
            target: n.id,
            style: { stroke: 'var(--border-strong)', strokeWidth: 1.5, opacity: 0.6 },
          });
        });
      }
    });

    eraFlows.forEach((f) => {
      if (!openLeafIds.has(f.from) || !openLeafIds.has(f.to)) return;
      const isOld = (f.era ?? 'e2026') === 'e2010';
      const base = isOld ? 'var(--warn)' : 'var(--accent)';
      const w = 1.5 + Math.min(6, Math.sqrt(f.valueNum ?? 30) / 3.2);
      const touched = hoverNode !== null && (f.from === hoverNode || f.to === hoverNode);
      const opacity = hoverNode
        ? touched
          ? 1
          : 0.1
        : matches
          ? matches.has(f.from) || matches.has(f.to)
            ? 0.95
            : 0.12
          : 0.82;
      edges.push({
        id: `flow-${f.id}`,
        source: f.from,
        target: f.to,
        label: `${f.label}${f.valueNum ? ` · $${f.valueNum} млрд` : ''}`,
        labelStyle: { fill: 'var(--text-2)', fontSize: 10.5, fontWeight: 700 },
        labelBgStyle: { fill: 'var(--surface)', fillOpacity: 0.95 },
        labelBgPadding: [7, 4] as [number, number],
        labelBgBorderRadius: 9,
        markerEnd: { type: MarkerType.ArrowClosed, color: base, width: 15, height: 15 },
        style: { stroke: base, strokeWidth: touched ? w + 1 : w, opacity },
        data: { flowId: f.id },
      });
      link(f.from, f.to);
    });

    if (showRelated) {
      const seen = new Set<string>();
      openLeafIds.forEach((id) => {
        const n = NODE_MAP[id];
        if (!n) return;
        n.related.forEach((r) => {
          if (!openLeafIds.has(r)) return;
          const key = [id, r].sort().join('|');
          if (seen.has(key)) return;
          seen.add(key);
          const touched = hoverNode !== null && (id === hoverNode || r === hoverNode);
          const opacity = hoverNode
            ? touched
              ? 0.9
              : 0.08
            : matches
              ? matches.has(id) || matches.has(r)
                ? 0.5
                : 0.08
              : 0.3;
          edges.push({
            id: `rel-${key}`,
            source: id,
            target: r,
            style: {
              stroke: 'var(--muted)',
              strokeWidth: touched ? 1.8 : 1,
              strokeDasharray: '5 4',
              opacity,
            },
          });
          link(id, r);
        });
      });
    }

    const hoverKind = hoverNode ? NODE_MAP[hoverNode]?.kind : undefined;
    const finalEdges = edges.map((e) => {
      const isHier = e.id.startsWith('root-') || e.id.startsWith('grp-');
      if (!isHier) return e;
      let keep = true;
      if (hoverNode) {
        const nb = neighbors.get(hoverNode);
        keep =
          e.source === hoverNode ||
          e.target === hoverNode ||
          e.source === `group-${hoverKind}` ||
          e.target === `group-${hoverKind}` ||
          (nb ? nb.has(e.source) || nb.has(e.target) : false);
      } else if (matches) {
        keep =
          matches.has(e.target) ||
          (e.id.startsWith('root-') && matchKinds.has(e.target.replace('group-', '') as NodeKind)) ||
          (e.id.startsWith('grp-') && matchKinds.has(e.source.replace('group-', '') as NodeKind));
      }
      if (keep) return e;
      return { ...e, style: { ...(e.style ?? {}), opacity: 0.1 } };
    });

    return { edges: finalEdges, neighbors };
  }, [groups, collapsed, openLeafIds, eraFlows, hoverNode, matches, matchKinds, showRelated]);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  useEffect(() => {
    setNodes(layoutNodes);
  }, [layoutNodes, setNodes]);

  useEffect(() => {
    setEdges(edgesData.edges);
  }, [edgesData.edges, setEdges]);

  const layoutKey = useMemo(
    () =>
      [
        kindFilter,
        era,
        onlyFlows,
        showRelated,
        [...collapsed].sort().join('+'),
        [...openLeafIds].sort().join(','),
      ].join('|'),
    [kindFilter, era, onlyFlows, showRelated, collapsed, openLeafIds]
  );

  useEffect(() => {
    const t = setTimeout(() => {
      void rf.fitView({ padding: fitPad, duration: 350 });
    }, 140);
    return () => clearTimeout(t);
  }, [layoutKey, rf, fitPad, nodesReady]);

  useEffect(() => {
    if (!matches || matches.size === 0) return;
    const t = setTimeout(() => {
      void rf.fitView({
        nodes: [...matches].map((id) => ({ id })),
        padding: 0.35,
        duration: 350,
      });
    }, 130);
    return () => clearTimeout(t);
  }, [matches, rf]);

  const onNodeClick = useCallback(
    (_: ReactMouseEvent, node: Node) => {
      if (node.type === 'eco') {
        openNode(node.id);
      } else if (node.type === 'group') {
        const k = asData(node.data).kind;
        if (k) {
          setCollapsed((prev) => {
            const next = new Set(prev);
            if (next.has(k)) next.delete(k);
            else next.add(k);
            return next;
          });
        }
      } else if (node.type === 'root') {
        setCollapsed(new Set());
      }
    },
    [openNode]
  );

  const onNodeMouseEnter = useCallback((_: ReactMouseEvent, node: Node) => {
    if (node.type === 'eco') setHoverNode(node.id);
  }, []);

  const onNodeMouseLeave = useCallback(() => setHoverNode(null), []);

  const onEdgeClick = useCallback((_: ReactMouseEvent, edge: Edge) => {
    const fid = (edge.data as { flowId?: string } | undefined)?.flowId;
    if (fid) setSelectedFlow((cur) => (cur === fid ? null : fid));
  }, []);

  const resetFilters = useCallback(() => {
    setKindFilter('all');
    setEra('all');
    setOnlyFlows(false);
    setShowRelated(true);
    setSearch('');
    setCollapsed(new Set());
    setSelectedFlow(null);
  }, []);

  const ctx = useMemo<MindCtxValue>(
    () => ({
      hover: hoverNode,
      hoverKind: hoverNode ? NODE_MAP[hoverNode]?.kind : undefined,
      matches,
      matchKinds,
      neighbors: edgesData.neighbors,
    }),
    [hoverNode, matches, matchKinds, edgesData.neighbors]
  );

  const selFlow = selectedFlow ? FLOWS.find((f) => f.id === selectedFlow) ?? null : null;
  const selFrom = selFlow ? NODE_MAP[selFlow.from] : null;
  const selTo = selFlow ? NODE_MAP[selFlow.to] : null;

  return (
    <MindCtx.Provider value={ctx}>
      <div className="mm-toolbar">
        <div className="filter-row">
          <button
            className={kindFilter === 'all' ? 'filter-btn active' : 'filter-btn'}
            onClick={() => setKindFilter('all')}
          >
            Все типы
          </button>
          {KIND_ORDER.map((k) => (
            <button
              key={k}
              className={kindFilter === k ? 'filter-btn active' : 'filter-btn'}
              onClick={() => setKindFilter(k)}
            >
              {GROUP_EMOJI[k]} {GROUP_LABEL[k]}
            </button>
          ))}
        </div>
        <div className="filter-row">
          {FLOW_ERA_FILTER.map((f) => (
            <button
              key={f.key}
              className={era === f.key ? 'filter-btn active' : 'filter-btn'}
              onClick={() => {
                setEra(f.key);
                setSelectedFlow(null);
              }}
            >
              {f.label}
            </button>
          ))}
          <span className="mm-sep" />
          <button
            className={onlyFlows ? 'filter-btn active' : 'filter-btn'}
            onClick={() => setOnlyFlows((v) => !v)}
          >
            💸 Только с потоками
          </button>
          <button
            className={showRelated ? 'filter-btn active' : 'filter-btn'}
            onClick={() => setShowRelated((v) => !v)}
          >
            🔗 Related-связи
          </button>
          <span className="mm-sep" />
          <input
            className="mm-search"
            placeholder="Поиск узла…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button className="filter-btn" onClick={resetFilters}>
            Сбросить фильтры
          </button>
          <button
            className="filter-btn"
            onClick={() => void rf.fitView({ padding: fitPad, duration: 350 })}
          >
            🎯 Вписать
          </button>
          {isTouch && (
            <button
              className={gestures ? 'filter-btn active' : 'filter-btn'}
              onClick={() => setGestures((v) => !v)}
            >
              {gestures ? '🖐 Жесты карты: вкл' : '🖐 Жесты карты: выкл'}
            </button>
          )}
        </div>
      </div>

      <div className={gestures ? 'mm-canvas' : 'mm-canvas is-locked'}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          onNodeMouseEnter={onNodeMouseEnter}
          onNodeMouseLeave={onNodeMouseLeave}
          onEdgeClick={onEdgeClick}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: fitPad }}
          minZoom={0.15}
          maxZoom={2.2}
          deleteKeyCode={null}
          panOnDrag={gestures}
          zoomOnPinch={gestures}
          zoomOnScroll={!isTouch}
          zoomOnDoubleClick={gestures}
          nodesDraggable={gestures && !isTouch}
          preventScrolling={!isTouch}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={26}
            size={1.5}
            color="var(--border-strong)"
          />
          <Controls showInteractive={false} />
          <MiniMap
            pannable
            zoomable
            nodeColor={(n) => asData(n.data).color || '#8892b0'}
            maskColor="rgba(125, 135, 165, 0.35)"
          />

          <Panel position="bottom-right" className="mm-legend">
            <div>
              <i className="mm-lg mm-lg-flow" /> поток денег (2026)
            </div>
            <div>
              <i className="mm-lg mm-lg-old" /> поток 2010-х
            </div>
            <div>
              <i className="mm-lg mm-lg-rel" /> related-связь
            </div>
            <div className="mm-legend-hint">клик по группе — свернуть/раскрыть · клик по стрелке — история потока</div>
          </Panel>

          {selFlow && (
            <Panel position="bottom-left" className="mm-flowcard">
              <div className="mm-flowcard-head">
                <b>💸 {selFlow.label}</b>
                <button onClick={() => setSelectedFlow(null)} aria-label="Закрыть">
                  ✕
                </button>
              </div>
              <div className="mm-flowcard-route">
                <em onClick={() => openNode(selFlow.from)}>
                  {selFrom?.emoji} {selFrom?.name}
                </em>
                <span> ⟶ </span>
                <em onClick={() => openNode(selFlow.to)}>
                  {selTo?.emoji} {selTo?.name}
                </em>
              </div>
              <div className="mm-flowcard-value">{selFlow.value}</div>
              <p>{selFlow.description}</p>
            </Panel>
          )}
        </ReactFlow>
      </div>

      <p className="mm-hint">
        {isTouch
          ? gestures
            ? 'Жесты карты включены: один палец двигает карту, два — масштаб. Выключи их кнопкой, чтобы вернуть прокрутку страницы.'
            : 'Тап по узлу открывает карточку, тап по группе сворачивает её. Включи «Жесты карты», чтобы двигать и масштабировать холст.'
          : 'Колесо — масштаб, перетаскивание — панорама. Клик по узлу открывает карточку, клик по стрелке — историю потока.'}
      </p>

      <div className="crossnav">
        <button className="ghost-btn" onClick={() => goTo('chains')}>
          Смотреть цепочки зависимостей →
        </button>
      </div>
    </MindCtx.Provider>
  );
}

export default function Flows({ openNode, goTo }: Props) {
  return (
    <div className="section">
      <div className="section-head">
        <h1>💸 Потоки денег</h1>
        <p>
          Карта экономики: корень → группы (страны, сектора, продукты, услуги, технологии) → узлы.
          Сплошные стрелки — потоки денег с объёмом, пунктир — related-связи.
        </p>
      </div>
      <ReactFlowProvider>
        <FlowsMindmap openNode={openNode} goTo={goTo} />
      </ReactFlowProvider>
    </div>
  );
}
