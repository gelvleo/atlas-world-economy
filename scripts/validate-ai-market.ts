// Валидатор карты рынка ИИ-внедрений: data/ai-market/*.json.
// Запуск: npx tsx scripts/validate-ai-market.ts [папка] (входит в npm run check).
// Без аргумента проверяет data/ai-market; для Вьетнама: data/vn-market.
//
// Красный, если: дубли id, родитель не найден, related ведёт в пустоту, число без
// источника, источник без url, цитата без url или длиннее 20 слов, длинное тире.
// Печатает счётчики по слоям, чтобы видеть объём, а не только ошибки.

import { readdirSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { AiMarketFile, AiMarketNode } from '../src/data/ai-market.types';

const here = dirname(fileURLToPath(import.meta.url));
const dir = resolve(here, '..', process.argv[2] ?? 'data/ai-market');
const files = readdirSync(dir).filter((f) => f.endsWith('.json')).sort();

const nodes: (AiMarketNode & { _file: string })[] = [];
const evidence = new Map<string, { url: string; _file: string }>();
const problems: string[] = [];

for (const f of files) {
  let data: AiMarketFile;
  try {
    data = JSON.parse(readFileSync(resolve(dir, f), 'utf8'));
  } catch (e) {
    problems.push(`${f}: не JSON (${(e as Error).message})`);
    continue;
  }
  for (const n of data.nodes ?? []) nodes.push({ ...n, _file: f });
  for (const e of data.evidence ?? []) {
    if (evidence.has(e.id)) problems.push(`${f}: дубль источника «${e.id}» (уже в ${evidence.get(e.id)!._file})`);
    evidence.set(e.id, { url: e.url, _file: f });
    if (!e.url) problems.push(`${f}: источник «${e.id}» без url`);
  }
}

const ids = new Map<string, string>();
for (const n of nodes) {
  if (ids.has(n.id)) problems.push(`${n._file}: дубль узла «${n.id}» (уже в ${ids.get(n.id)})`);
  ids.set(n.id, n._file);
}

const DASH = /[–—]/;
const text = (n: AiMarketNode) =>
  [n.title, n.summary, ...(n.facts ?? []), ...(n.questions ?? []), ...(n.pains ?? []), n.priceRu, n.priceEn, n.acceptance, n.risk]
    .filter(Boolean)
    .join(' ');

for (const n of nodes) {
  const where = `${n._file} · ${n.id}`;
  if (n.parent && !ids.has(n.parent)) problems.push(`${where}: родитель «${n.parent}» не найден`);
  for (const r of n.related ?? []) if (!ids.has(r)) problems.push(`${where}: related «${r}» не найден`);
  for (const e of n.evidence ?? []) if (!evidence.has(e)) problems.push(`${where}: источник «${e}» не найден`);
  for (const num of n.numbers ?? []) {
    if (!num.evidence || !evidence.has(num.evidence)) problems.push(`${where}: число «${num.label}» без источника`);
  }
  for (const q of n.quotes ?? []) {
    if (!q.url) problems.push(`${where}: цитата без url`);
    if (q.text.split(/\s+/).length > 24) problems.push(`${where}: цитата длиннее 20 слов`);
  }
  if (DASH.test(text(n))) problems.push(`${where}: длинное тире`);
}

// Петли родителей роняют хлебные крошки: проверяем явно.
for (const n of nodes) {
  const seen = new Set<string>();
  let cur: AiMarketNode | undefined = n;
  while (cur?.parent) {
    if (seen.has(cur.id)) { problems.push(`${n._file} · ${n.id}: петля родителей`); break; }
    seen.add(cur.id);
    cur = nodes.find((x) => x.id === cur!.parent);
  }
}

const byLayer: Record<string, number> = {};
for (const n of nodes) byLayer[n.layer] = (byLayer[n.layer] ?? 0) + 1;
const quotes = nodes.reduce((s, n) => s + (n.quotes?.length ?? 0), 0);
const numbers = nodes.reduce((s, n) => s + (n.numbers?.length ?? 0), 0);

console.log(`Карта ${dir.split('/').pop()}: файлов ${files.length}, узлов ${nodes.length}, источников ${evidence.size}, цитат ${quotes}, чисел ${numbers}`);
console.log(Object.entries(byLayer).map(([k, v]) => `${k} ${v}`).join(' · '));
if (problems.length) {
  console.error(`\nОшибок: ${problems.length}`);
  for (const p of problems.slice(0, 80)) console.error('  ' + p);
  if (problems.length > 80) console.error(`  ... и ещё ${problems.length - 80}`);
  process.exit(1);
}
console.log('Целостность: ok');
