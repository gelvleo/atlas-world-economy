import fs from 'node:fs';
import path from 'node:path';

// Валидатор целостности связей данных ATLAS.
// Запуск: npx tsx scripts/validate-links.ts
// Проверяет, что все from/to/related/nodes/targetId/serviceId
// ссылаются на существующие id узлов из src/data/nodes.ts.

const root = process.argv[2] || path.resolve('.');
const read = (p: string) => fs.readFileSync(path.join(root, p), 'utf8');

const src = read('src/data/nodes.ts');
const ids = [...src.matchAll(/^\s*id:\s*'([^']+)'/gm)].map((m) => m[1]);
const set = new Set(ids);
console.log(`Узлов: ${ids.length}`);

const checks: { file: string; re: RegExp; tag: string }[] = [
  { file: 'src/data/flows.ts', re: /(from|to):\s*'([^']+)'/g, tag: 'FLOWS' },
  { file: 'src/data/chains.ts', re: /(from|to):\s*'([^']+)'/g, tag: 'LINKS' },
  { file: 'src/data/chains.ts', re: /nodes:\s*\[([^\]]+)\]/g, tag: 'CHAIN' },
  { file: 'src/data/timeline.ts', re: /serviceId:\s*'([^']+)'/g, tag: 'TIMELINE' },
  { file: 'src/data/ai.ts', re: /targetId:\s*'([^']+)'/g, tag: 'AI' },
  { file: 'src/data/nodes.ts', re: /related:\s*\[([^\]]+)\]/g, tag: 'RELATED' }
];

let bad = 0;
for (const c of checks) {
  const body = read(c.file);
  for (const m of body.matchAll(c.re)) {
    const refs = c.tag === 'CHAIN' || c.tag === 'RELATED'
      ? [...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1])
      : [m[2]];
    for (const r of refs) {
      if (r && !set.has(r)) { console.log(`  ${c.tag} ✗ ${r}`); bad++; }
    }
  }
}
console.log(bad === 0 ? '\n✓ Все связи целостны' : `\n✗ ${bad} проблемных ссылок`);
if (bad > 0) process.exit(1);
