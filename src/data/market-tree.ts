// Дерево карты рынка из JSON-файлов одной папки. Одна сборка на два домена:
// data/ai-market (рынок ИИ-внедрений) и data/vn-market (Вьетнам). Файлы
// подхватываются все: новый файл агента попадает в дерево без правки кода.
// Целостность проверяет scripts/validate-ai-market.ts <папка>.

import type { AiMarketEvidence, AiMarketFile, AiMarketLayer, AiMarketNode } from './ai-market.types';

export interface MarketTree {
  nodes: AiMarketNode[];
  evidence: Record<string, AiMarketEvidence>;
  map: Record<string, AiMarketNode>;
  children: Record<string, AiMarketNode[]>;
  roots: Record<AiMarketLayer, AiMarketNode[]>;
  backlinks: Record<string, AiMarketNode[]>;
  stats: { nodes: number; quotes: number; questions: number; evidence: number; withUrl: number };
  trail: (id: string) => AiMarketNode[];
  descendants: (id: string) => AiMarketNode[];
}

export function buildTree(files: Record<string, AiMarketFile>): MarketTree {
  const nodes: AiMarketNode[] = [];
  const evidenceList: AiMarketEvidence[] = [];
  for (const path of Object.keys(files).sort()) {
    const f = files[path];
    nodes.push(...(f.nodes ?? []));
    evidenceList.push(...(f.evidence ?? []));
  }
  const map: Record<string, AiMarketNode> = Object.fromEntries(nodes.map((n) => [n.id, n]));
  const children: Record<string, AiMarketNode[]> = {};
  const roots = {} as Record<AiMarketLayer, AiMarketNode[]>;
  const backlinks: Record<string, AiMarketNode[]> = {};
  for (const n of nodes) {
    if (n.parent) (children[n.parent] ??= []).push(n);
    else (roots[n.layer] ??= []).push(n);
    for (const r of n.related ?? []) (backlinks[r] ??= []).push(n);
  }
  const trail = (id: string) => {
    const out: AiMarketNode[] = [];
    let cur: AiMarketNode | undefined = map[id];
    const guard = new Set<string>();
    while (cur && !guard.has(cur.id)) {
      guard.add(cur.id);
      out.unshift(cur);
      cur = cur.parent ? map[cur.parent] : undefined;
    }
    return out;
  };
  const descendants = (id: string) => {
    const out: AiMarketNode[] = [];
    const stack = [...(children[id] ?? [])];
    const seen = new Set<string>();
    while (stack.length) {
      const n = stack.pop()!;
      if (seen.has(n.id)) continue;
      seen.add(n.id);
      out.push(n);
      stack.push(...(children[n.id] ?? []));
    }
    return out;
  };
  const evidence = Object.fromEntries(evidenceList.map((e) => [e.id, e]));
  const stats = {
    nodes: nodes.length,
    quotes: nodes.reduce((s, n) => s + (n.quotes?.length ?? 0), 0),
    questions: nodes.filter((n) => n.kind === 'question').length,
    evidence: evidenceList.length,
    withUrl: evidenceList.filter((e) => e.url).length
  };
  return { nodes, evidence, map, children, roots, backlinks, stats, trail, descendants };
}
