export interface GraphNode {
  slug: string;
  kind: string | null;
  name: string;
  region_slug: string | null;
  degree: number;
}

export interface GraphEdge {
  src: string;
  dst: string;
  relation: string | null;
  weight: number | null;
  note: string | null;
}

export interface GraphFile {
  generated_at: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface GraphEntityAlias {
  slug: string;
  name?: string | null;
  name_ru?: string | null;
  name_vi?: string | null;
  name_en?: string | null;
}

export type GraphValidation =
  | { ok: true; value: GraphFile }
  | { ok: false; error: string };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const nullableString = (value: unknown): value is string | null =>
  value === null || typeof value === 'string';

const validNode = (value: unknown): value is GraphNode => {
  if (!isRecord(value)) return false;
  return (
    typeof value.slug === 'string' && value.slug.length > 0 &&
    typeof value.name === 'string' && value.name.length > 0 &&
    nullableString(value.kind) && nullableString(value.region_slug) &&
    typeof value.degree === 'number' && Number.isFinite(value.degree) && value.degree >= 0
  );
};

const validEdge = (value: unknown): value is GraphEdge => {
  if (!isRecord(value)) return false;
  return (
    typeof value.src === 'string' && value.src.length > 0 &&
    typeof value.dst === 'string' && value.dst.length > 0 &&
    nullableString(value.relation) &&
    (value.weight === null || (typeof value.weight === 'number' && Number.isFinite(value.weight))) &&
    nullableString(value.note)
  );
};

/** Проверяем весь снимок до построения индексов: частичный JSON не должен
 * превращаться в пустой граф и выглядеть как отсутствие связей. */
export function validateGraphData(value: unknown): GraphValidation {
  if (!isRecord(value) || typeof value.generated_at !== 'string' || value.generated_at.length === 0) {
    return { ok: false, error: 'нет generated_at' };
  }
  if (!Array.isArray(value.nodes) || !value.nodes.every(validNode)) {
    return { ok: false, error: 'некорректная форма nodes' };
  }
  if (!Array.isArray(value.edges) || !value.edges.every(validEdge)) {
    return { ok: false, error: 'некорректная форма edges' };
  }

  const slugs = new Set(value.nodes.map((node) => node.slug));
  if (slugs.size !== value.nodes.length) return { ok: false, error: 'дублирующиеся slug узлов' };
  const dangling = value.edges.find((edge) => !slugs.has(edge.src) || !slugs.has(edge.dst));
  if (dangling) return { ok: false, error: `ребро ссылается на неизвестный узел (${dangling.src} → ${dangling.dst})` };

  return { ok: true, value: value as unknown as GraphFile };
}

/** Единая нормализация делает поиск устойчивым к диакритике, дефисам,
 * подчёркиваниям и русской/вьетнамской раскладке slug. */
export const normalizeGraphText = (value: string) =>
  value
    .replace(/[đĐ]/g, 'd')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();

const aliasValues = (node: GraphNode, entity?: GraphEntityAlias) =>
  [node.name, node.slug, entity?.name, entity?.name_ru, entity?.name_vi, entity?.name_en]
    .filter((value): value is string => Boolean(value))
    .map(normalizeGraphText)
    .filter(Boolean);

export function graphAliases(
  node: GraphNode,
  entities: ReadonlyArray<GraphEntityAlias> = []
): string[] {
  const entity = entities.find((item) => item.slug === node.slug);
  return [...new Set(aliasValues(node, entity))];
}

export function searchGraphNodes(
  nodes: ReadonlyArray<GraphNode>,
  query: string,
  entities: ReadonlyArray<GraphEntityAlias> = []
): GraphNode[] {
  const normalizedQuery = normalizeGraphText(query);
  if (normalizedQuery.length < 2) return [];

  return nodes
    .map((node) => {
      const aliases = graphAliases(node, entities);
      const score = aliases.reduce((best, alias) => {
        if (alias === normalizedQuery) return Math.min(best, 0);
        if (alias.startsWith(normalizedQuery)) return Math.min(best, 1);
        if (alias.includes(normalizedQuery)) return Math.min(best, 2);
        return best;
      }, 99);
      return { node, score };
    })
    .filter((item) => item.score < 99)
    .sort((a, b) => a.score - b.score || b.node.degree - a.node.degree || a.node.name.localeCompare(b.node.name))
    .map((item) => item.node);
}

export const nationalMarketNodes = (nodes: ReadonlyArray<GraphNode>) =>
  nodes
    .filter((node) => node.kind === 'market' && node.region_slug === 'vn')
    .sort((a, b) => b.degree - a.degree || a.name.localeCompare(b.name));

export const CONTEXT_RELATIONS = new Set(['co_mentioned_with', 'located_in']);

const BUSINESS_RELATIONS = new Set([
  'operates_market', 'sells_in', 'competes_with', 'subsidiary_of', 'owns',
  'regulated_by', 'affected_by', 'founded_by', 'produces', 'supplies',
  'serves_segment', 'employed_by', 'partnered_with', 'acquired',
  'invested_in', 'precedes', 'member_of'
]);

export const isBusinessEdge = (edge: Pick<GraphEdge, 'relation'>) =>
  edge.relation !== null &&
  !CONTEXT_RELATIONS.has(edge.relation) &&
  BUSINESS_RELATIONS.has(edge.relation);
