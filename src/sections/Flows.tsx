import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
} from 'react';
import {
  Background,
  BackgroundVariant,
  Handle,
  MarkerType,
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
import { NODES, NODE_MAP } from '../data/nodes';
import { FLOWS, FLOW_ERA_FILTER } from '../data/flows';
import { KIND_LABEL, KIND_TONE } from '../ui/glyphs';
import {
  IconClose,
  IconFit,
  IconHand,
  IconNext,
  IconZoomIn,
  IconZoomOut,
  KindIcon,
  NodeGlyph,
} from '../ui/icons';

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

const GROUP_X = 400;
const LEAF_X = 740;
const LEAF_STEP = 84;
const GROUP_GAP = 56;

interface MindData {
  nid?: string;
  label: string;
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

// Цвет вида живёт только в левой полосе 2px и точке 6px — переменная --k.
const kindStyle = (kind?: NodeKind): CSSProperties =>
  ({ '--k': kind ? KIND_TONE[kind] : 'var(--hair-strong)' }) as CSSProperties;

function LeafNode({ data, selected }: NodeProps) {
  const d = asData(data);
  const { hover, matches, neighbors } = useContext(MindCtx);
  const nid = d.nid ?? '';
  const node = NODE_MAP[nid];

  let cls = 'mm-node mm-leaf';
  if (selected) cls += ' is-selected';
  if (matches) {
    cls += matches.has(nid) ? ' is-match' : ' is-dim';
  } else if (hover) {
    if (hover === nid) cls += ' is-focus';
    else if (!neighbors.get(hover)?.has(nid)) cls += ' is-dim';
  }

  return (
    <div className={cls} style={kindStyle(d.kind)}>
      <Handle type="target" position={Position.Left} className="mm-handle" />
      {node && <NodeGlyph node={node} size={18} />}
      <span className="mm-body">
        <span className="mm-name">{d.label}</span>
        {d.value && <span className="mm-val num">{d.value}</span>}
      </span>
      <Handle type="source" position={Position.Right} className="mm-handle" />
      {hover === nid && (
        <div className={'mm-tip panel' + (d.tipBelow ? ' mm-tip-below' : '')}>
          <b>{d.label}</b>
          {d.value && <span className="mm-tip-val num">{d.value}</span>}
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

  let cls =
    'mm-node mm-group' + (selected ? ' is-selected' : '') + (d.collapsed ? ' is-collapsed' : '');
  if (matches) {
    if (!d.kind || !matchKinds.has(d.kind)) cls += ' is-dim';
  } else if (hover && d.kind && hoverKind !== d.kind) {
    cls += ' is-dim';
  }

  return (
    <div className={cls} style={kindStyle(d.kind)}>
      <Handle type="target" position={Position.Left} className="mm-handle" />
      {d.kind && <KindIcon kind={d.kind} />}
      <span className="mm-body">
        <span className="mm-name">{d.label}</span>
        <span className="mm-val">{d.collapsed ? 'раскрыть' : 'свернуть'}</span>
      </span>
      <span className="mm-count num">{d.count}</span>
      <Handle type="source" position={Position.Right} className="mm-handle" />
    </div>
  );
}

function RootNode({ data }: NodeProps) {
  const d = asData(data);
  return (
    <div className="mm-node mm-root">
      <Handle type="source" position={Position.Right} className="mm-handle mm-handle-root" />
      <span className="mm-body">
        <span className="mm-name">{d.label}</span>
        <span className="mm-val">{d.subtitle}</span>
      </span>
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
  const [hoverEdge, setHoverEdge] = useState<string | null>(null);
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
        subtitle: `${visibleNodes.length} узлов · ${eraFlows.length} потоков`,
      },
    });

    blocks.forEach((g) => {
      const gid = `group-${g.kind}`;
      nodes.push({
        id: gid,
        type: 'group',
        position: { x: GROUP_X, y: g.top + g.height / 2 - 31 },
        draggable: false,
        data: {
          label: GROUP_LABEL[g.kind],
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
      edges.push({
        id: `root-${g.kind}`,
        source: 'root',
        target: gid,
        style: { stroke: 'var(--hair-strong)', strokeWidth: 1.5 },
      });
      if (!collapsed.has(g.kind)) {
        g.leaves.forEach((n) => {
          edges.push({
            id: `grp-${g.kind}-${n.id}`,
            source: gid,
            target: n.id,
            style: { stroke: 'var(--hair)', strokeWidth: 1 },
          });
        });
      }
    });

    eraFlows.forEach((f) => {
      if (!openLeafIds.has(f.from) || !openLeafIds.has(f.to)) return;
      const isOld = (f.era ?? 'e2026') === 'e2010';
      const base = isOld ? 'var(--warn)' : 'var(--accent)';
      const w = 1.2 + Math.min(5, Math.sqrt(f.valueNum ?? 30) / 3.6);
      const touched = hoverNode !== null && (f.from === hoverNode || f.to === hoverNode);
      const edgeId = `flow-${f.id}`;
      // Подпись показываем только под курсором или у выбранного ребра: в покое
      // на плотных участках подписи наезжали друг на друга и не читались.
      const named = hoverEdge === edgeId || selectedFlow === f.id;
      const opacity = hoverNode
        ? touched
          ? 1
          : 0.12
        : matches
          ? matches.has(f.from) || matches.has(f.to)
            ? 0.95
            : 0.12
          : 0.75;
      edges.push({
        id: edgeId,
        source: f.from,
        target: f.to,
        // valueNum — это ТОЛЩИНА линии, а не деньги: у 15 из 22 потоков в данных
        // стоит оценка на глаз («данные для clinical AI», valueNum 45). Раньше сюда
        // приклеивалось ` · $45 млрд`, и читатель видел выдуманную сумму как факт.
        // Показываем `value` как он записан — деньги там, где они действительно деньги.
        label: named ? `${f.label} · ${f.value}` : undefined,
        labelStyle: { fill: 'var(--ink)', fontSize: 11, fontWeight: 500 },
        labelBgStyle: { fill: 'var(--surface)', stroke: 'var(--hair)' },
        labelBgPadding: [6, 4] as [number, number],
        labelBgBorderRadius: 6,
        markerEnd: { type: MarkerType.ArrowClosed, color: base, width: 14, height: 14 },
        style: {
          stroke: base,
          strokeWidth: touched || named ? w + 1 : w,
          opacity: named ? 1 : opacity,
        },
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
              ? 0.85
              : 0.06
            : matches
              ? matches.has(id) || matches.has(r)
                ? 0.45
                : 0.06
              : 0.35;
          edges.push({
            id: `rel-${key}`,
            source: id,
            target: r,
            style: {
              stroke: 'var(--hair-strong)',
              strokeWidth: touched ? 1.5 : 1,
              strokeDasharray: '4 4',
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
  }, [
    groups,
    collapsed,
    openLeafIds,
    eraFlows,
    hoverNode,
    hoverEdge,
    selectedFlow,
    matches,
    matchKinds,
    showRelated,
  ]);

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

  const onEdgeMouseEnter = useCallback((_: ReactMouseEvent, edge: Edge) => {
    setHoverEdge(edge.id);
  }, []);

  const onEdgeMouseLeave = useCallback(() => setHoverEdge(null), []);

  const onEdgeClick = useCallback((_: ReactMouseEvent, edge: Edge) => {
    const fid = (edge.data as { flowId?: string } | undefined)?.flowId;
    if (fid) setSelectedFlow((cur) => (cur === fid ? null : fid));
  }, []);

  const allCollapsed = collapsed.size >= groups.length && groups.length > 0;

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
      <div className="toolbar" role="group" aria-label="Вид узла">
        <button
          className={kindFilter === 'all' ? 'btn btn--ghost active' : 'btn btn--ghost'}
          aria-pressed={kindFilter === 'all'}
          onClick={() => setKindFilter('all')}
        >
          Все виды
        </button>
        {KIND_ORDER.map((k) => (
          <button
            key={k}
            className={kindFilter === k ? 'btn btn--ghost active' : 'btn btn--ghost'}
            aria-pressed={kindFilter === k}
            onClick={() => setKindFilter(k)}
          >
            {GROUP_LABEL[k]}
          </button>
        ))}
      </div>

      <div className="toolbar">
        {FLOW_ERA_FILTER.map((f) => (
          <button
            key={f.key}
            className={era === f.key ? 'btn btn--ghost active' : 'btn btn--ghost'}
            aria-pressed={era === f.key}
            onClick={() => {
              setEra(f.key);
              setSelectedFlow(null);
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="toolbar">
        <button
          className={onlyFlows ? 'btn btn--ghost active' : 'btn btn--ghost'}
          aria-pressed={onlyFlows}
          onClick={() => setOnlyFlows((v) => !v)}
        >
          Только с потоками
        </button>
        <button
          className={showRelated ? 'btn btn--ghost active' : 'btn btn--ghost'}
          aria-pressed={showRelated}
          onClick={() => setShowRelated((v) => !v)}
        >
          Смежные связи
        </button>
        <button
          className="btn btn--ghost"
          onClick={() =>
            setCollapsed(allCollapsed ? new Set() : new Set(groups.map((g) => g.kind)))
          }
        >
          {allCollapsed ? 'Раскрыть группы' : 'Свернуть группы'}
        </button>
        <input
          className="field mm-search"
          placeholder="Поиск узла"
          aria-label="Поиск узла на карте"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className="btn btn--ghost" onClick={resetFilters}>
          Сбросить
        </button>
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
          onEdgeMouseEnter={onEdgeMouseEnter}
          onEdgeMouseLeave={onEdgeMouseLeave}
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
          proOptions={{ hideAttribution: true }}
        >
          <Background variant={BackgroundVariant.Dots} gap={26} size={1} color="#D2D2D7" />

          <Panel position="top-right" className="mm-controls">
            <button
              className="btn--icon"
              aria-label="Приблизить карту"
              onClick={() => void rf.zoomIn({ duration: 160 })}
            >
              <IconZoomIn />
            </button>
            <button
              className="btn--icon"
              aria-label="Отдалить карту"
              onClick={() => void rf.zoomOut({ duration: 160 })}
            >
              <IconZoomOut />
            </button>
            <button
              className="btn--icon"
              aria-label="Вписать карту в экран"
              onClick={() => void rf.fitView({ padding: fitPad, duration: 350 })}
            >
              <IconFit />
            </button>
            {isTouch && (
              <button
                className={gestures ? 'btn--icon is-on' : 'btn--icon'}
                aria-pressed={gestures}
                aria-label={gestures ? 'Выключить жесты карты' : 'Включить жесты карты'}
                onClick={() => setGestures((v) => !v)}
              >
                <IconHand />
              </button>
            )}
          </Panel>

          <Panel position="bottom-right" className="mm-legend">
            <span>
              <i className="mm-lg mm-lg-flow" /> поток денег, 2026
            </span>
            <span>
              <i className="mm-lg mm-lg-old" /> поток 2010-х
            </span>
            <span>
              <i className="mm-lg mm-lg-rel" /> смежная связь
            </span>
            <span className="mm-legend-hint">
              толщина линии — относительный масштаб потока, не сумма
            </span>
          </Panel>

          {selFlow && (
            <Panel position="bottom-left" className="mm-flowcard panel">
              <div className="mm-flowcard-head">
                <b>{selFlow.label}</b>
                <button
                  className="btn--icon"
                  onClick={() => setSelectedFlow(null)}
                  aria-label="Закрыть историю потока"
                >
                  <IconClose />
                </button>
              </div>
              <div className="mm-flowcard-route">
                {selFrom && (
                  <button className="mm-flowcard-node" onClick={() => openNode(selFlow.from)}>
                    <NodeGlyph node={selFrom} />
                    <span>{selFrom.name}</span>
                  </button>
                )}
                <span className="route-arrow route-arrow--inline" aria-hidden="true" />
                {selTo && (
                  <button className="mm-flowcard-node" onClick={() => openNode(selFlow.to)}>
                    <NodeGlyph node={selTo} />
                    <span>{selTo.name}</span>
                  </button>
                )}
              </div>
              <div className="mm-flowcard-value num">{selFlow.value}</div>
              <p className="meta">{selFlow.description}</p>
            </Panel>
          )}
        </ReactFlow>
      </div>

      <p className="mm-hint meta">
        {isTouch
          ? gestures
            ? 'Жесты карты включены: один палец двигает карту, два — масштаб. Выключи их, чтобы вернуть прокрутку страницы.'
            : 'Тап по узлу открывает карточку, тап по группе сворачивает её. Включи жесты, чтобы двигать и масштабировать холст.'
          : 'Колесо — масштаб, перетаскивание — панорама. Наведи на стрелку, чтобы прочитать подпись потока, кликни — откроется история.'}
      </p>

      <div className="crossnav">
        <button className="btn btn--ghost" onClick={() => goTo('chains')}>
          Цепочки зависимостей <IconNext />
        </button>
      </div>
    </MindCtx.Provider>
  );
}

export default function Flows({ openNode, goTo }: Props) {
  return (
    <div className="section">
      <div className="section-head">
        <p className="kicker">Потоки денег</p>
        <h1 className="section-title">Карта мировой экономики</h1>
        <p className="section-lead">
          Корень, пять групп узлов и связи между ними. Сплошные линии — потоки денег, пунктир —
          смежные связи. Толщина линии показывает относительный масштаб потока, а не сумму.
        </p>
      </div>
      <ReactFlowProvider>
        <FlowsMindmap openNode={openNode} goTo={goTo} />
      </ReactFlowProvider>
    </div>
  );
}
