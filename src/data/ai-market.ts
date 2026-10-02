// Карта рынка ИИ-внедрений: дерево из data/ai-market/*.json. Движок общий, см. market-tree.ts.

import type { AiMarketFile } from './ai-market.types';
import { buildTree } from './market-tree';

const files = import.meta.glob<AiMarketFile>('../../data/ai-market/*.json', {
  eager: true,
  import: 'default'
});

export const AI_MARKET_TREE = buildTree(files);
export const AI_MARKET_EVIDENCE = AI_MARKET_TREE.evidence;
