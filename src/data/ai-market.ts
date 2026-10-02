// Сборка дерева рынка ИИ-внедрений из JSON-файлов data/ai-market.
// Файлы подхватываются все: новый файл агента попадает в дерево без правки кода.
// Целостность (родители, источники, дубли) проверяет scripts/validate-ai-market.ts.

import type { AiMarketEvidence, AiMarketFile, AiMarketLayer, AiMarketNode } from './ai-market.types';

const files = import.meta.glob<AiMarketFile>('../../data/ai-market/*.json', {
  eager: true,
  import: 'default'
});

const nodes: AiMarketNode[] = [];
const evidence: AiMarketEvidence[] = [];
for (const path of Object.keys(files).sort()) {
  const f = files[path];
  nodes.push(...(f.nodes ?? []));
  evidence.push(...(f.evidence ?? []));
}

export const AI_MARKET_NODES: AiMarketNode[] = nodes;
export const AI_MARKET_EVIDENCE: Record<string, AiMarketEvidence> = Object.fromEntries(
  evidence.map((e) => [e.id, e])
);
export const AI_MARKET_MAP: Record<string, AiMarketNode> = Object.fromEntries(nodes.map((n) => [n.id, n]));

// Дети по родителю. Порядок: сначала как в файлах, узлы ядра идут первыми
// (core.json сортируется раньше по имени).
export const AI_MARKET_CHILDREN: Record<string, AiMarketNode[]> = (() => {
  const map: Record<string, AiMarketNode[]> = {};
  for (const n of nodes) {
    if (!n.parent) continue;
    (map[n.parent] ??= []).push(n);
  }
  return map;
})();

export const AI_MARKET_ROOTS: Record<AiMarketLayer, AiMarketNode[]> = (() => {
  const map = {} as Record<AiMarketLayer, AiMarketNode[]>;
  for (const n of nodes) {
    if (n.parent) continue;
    (map[n.layer] ??= []).push(n);
  }
  return map;
})();

/** Путь от корня к узлу, для хлебных крошек. */
export function aiMarketTrail(id: string): AiMarketNode[] {
  const trail: AiMarketNode[] = [];
  let cur: AiMarketNode | undefined = AI_MARKET_MAP[id];
  const guard = new Set<string>();
  while (cur && !guard.has(cur.id)) {
    guard.add(cur.id);
    trail.unshift(cur);
    cur = cur.parent ? AI_MARKET_MAP[cur.parent] : undefined;
  }
  return trail;
}

/** Все потомки узла, для счётчиков «внутри N узлов». */
export function aiMarketDescendants(id: string): AiMarketNode[] {
  const out: AiMarketNode[] = [];
  const stack = [...(AI_MARKET_CHILDREN[id] ?? [])];
  const seen = new Set<string>();
  while (stack.length) {
    const n = stack.pop()!;
    if (seen.has(n.id)) continue;
    seen.add(n.id);
    out.push(n);
    stack.push(...(AI_MARKET_CHILDREN[n.id] ?? []));
  }
  return out;
}

/** Узлы, которые ссылаются на этот через related: обратные связи тоже кликабельны. */
export const AI_MARKET_BACKLINKS: Record<string, AiMarketNode[]> = (() => {
  const map: Record<string, AiMarketNode[]> = {};
  for (const n of nodes) for (const r of n.related ?? []) (map[r] ??= []).push(n);
  return map;
})();

export const AI_MARKET_STATS = (() => {
  const quotes = nodes.reduce((s, n) => s + (n.quotes?.length ?? 0), 0);
  const questions = nodes.filter((n) => n.kind === 'question').length;
  const withUrl = evidence.filter((e) => e.url).length;
  return { nodes: nodes.length, quotes, questions, evidence: evidence.length, withUrl };
})();
