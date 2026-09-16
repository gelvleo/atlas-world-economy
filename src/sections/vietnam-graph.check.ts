import {
  isBusinessEdge,
  searchGraphNodes,
  validateGraphData,
  type GraphNode
} from './vietnam-graph.helpers';

const assert = (condition: unknown, message: string) => {
  if (!condition) throw new Error(message);
};

const raw = {
  generated_at: '2026-09-16',
  nodes: [
    { slug: 'company:vingroup', kind: 'company', name: 'Vingroup', region_slug: 'vn', degree: 1 },
    { slug: 'market:vn-dairy', kind: 'market', name: 'Молочный рынок Вьетнама', region_slug: 'vn', degree: 1 }
  ],
  edges: [{ src: 'company:vingroup', dst: 'market:vn-dairy', relation: 'sells_in', weight: null, note: null }]
};
const checked = validateGraphData(raw);
assert(checked.ok, 'валидный снимок отклонён');
if (!checked.ok) throw new Error(checked.error);

const aliases = [{ slug: 'company:vingroup', name: 'Vingroup', name_vi: 'Tập đoàn Vingroup' }];
assert(searchGraphNodes(checked.value.nodes, 'Vingroup', aliases)[0]?.slug === 'company:vingroup', 'точный поиск не поднял узел');
assert(searchGraphNodes(checked.value.nodes, 'tap doan vingroup', aliases)[0]?.slug === 'company:vingroup', 'поиск по alias не сработал');
assert(isBusinessEdge({ relation: 'co_mentioned_with' }) === false, 'co_mentioned ошибочно деловая связь');
assert(isBusinessEdge({ relation: 'located_in' }) === false, 'located_in ошибочно деловая связь');
assert(isBusinessEdge({ relation: null }) === false, 'null relation ошибочно деловая связь');
assert(isBusinessEdge({ relation: 'sells_in' }) === true, 'sells_in потерян из делового слоя');
assert(checked.value.edges[0].src === 'company:vingroup' && checked.value.edges[0].dst === 'market:vn-dairy', 'направление ребра изменено');

const node: GraphNode = { slug: 'a', kind: 'company', name: 'A', region_slug: 'vn', degree: 0 };
assert(!validateGraphData({ generated_at: 'now', nodes: [node], edges: [{ src: 'a', dst: 'missing', relation: 'sells_in', weight: null, note: null }] }).ok, 'dangling endpoint пропущен');

console.log('vietnam-graph checks passed');
