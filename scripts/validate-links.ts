// Валидатор целостности данных ATLAS.
// Запуск: npx tsx scripts/validate-links.ts   (или npm run check)
//
// Проверяет, что каждая ссылка на узел (from/to/related/nodes/serviceId/targetId)
// указывает на существующий id, что нет дублей id, и показывает дисциплину
// доказательств — сколько узлов несут число без источника.
//
// Раньше валидатор читал файлы РЕГУЛЯРКАМИ и искал `id:` в начале строки. Узлы в
// nodes.ts записаны одним объектом в строку — `{ id: 'usa', … }`, и под выражение
// `^\s*id:` не попадал НИ ОДИН узел: скрипт печатал «Узлов: 0» и ругался разом на
// все 265 ссылок. Проверка, которая всегда красная, не проверяет ничего.
// Теперь данные импортируются как модули: текст разбирать не нужно, а новые
// файлы данных подхватываются вместе со своими экспортами.

import { ALL_NODES } from '../src/data/nodes';
import { FLOWS } from '../src/data/flows';
import { CHAINS, DEPENDENCY_LINKS } from '../src/data/chains';
import { SERVICE_ERAS } from '../src/data/timeline';
import { AI_IMPACTS } from '../src/data/ai';
import { EDTECH_FLOWS, EDTECH_CHAINS, EDTECH_LINKS } from '../src/data/edtech';
import { AI_NATIVE_FLOWS, AI_NATIVE_CHAINS, AI_NATIVE_LINKS } from '../src/data/ai-native';
import { VIETNAM_FLOWS, VIETNAM_CHAINS, VIETNAM_LINKS } from '../src/data/vietnam';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { EcoNode } from '../src/types';

const ids = new Set(ALL_NODES.map((n) => n.id));
const problems: string[] = [];

const check = (tag: string, ref: string | undefined, where: string) => {
  if (!ref) return;
  if (!ids.has(ref)) problems.push(`${tag} · ${where} → нет узла «${ref}»`);
};

for (const f of [...FLOWS, ...EDTECH_FLOWS, ...AI_NATIVE_FLOWS, ...VIETNAM_FLOWS]) {
  check('поток', f.from, f.id);
  check('поток', f.to, f.id);
}
for (const l of [...DEPENDENCY_LINKS, ...EDTECH_LINKS, ...AI_NATIVE_LINKS, ...VIETNAM_LINKS]) {
  check('связь', l.from, l.id);
  check('связь', l.to, l.id);
}
for (const c of [...CHAINS, ...EDTECH_CHAINS, ...AI_NATIVE_CHAINS, ...VIETNAM_CHAINS]) {
  c.nodes.forEach((n) => check('цепочка', n, c.id));
}
for (const s of SERVICE_ERAS) check('динамика', s.serviceId, `${s.serviceId}/${s.era}`);
for (const e of AI_IMPACTS) check('ИИ', e.targetId, e.id);
for (const n of ALL_NODES) n.related.forEach((r) => check('related', r, n.id));

// Якоря блоков раздела «Вьетнам» записаны дважды: разметкой (id="vn-<якорь>") и
// списком SECTION_IDS, по которому маршрут решает, есть такой блок или нет.
// Пока строки совпадают, всё работает; разойдутся — ссылка на существующий блок
// начнёт отвечать «блока нет», и ни одна проверка не покраснеет. Поэтому
// сверяем оба списка здесь, на гейте. Тот же список держит у себя агент
// region-brief в ATLAS_SECTIONS, и о его изменении он просит предупреждать.
const dbSource = readFileSync(
  resolve(dirname(fileURLToPath(import.meta.url)), '../src/sections/VietnamDb.tsx'),
  'utf8'
);
const declared = (/const SECTION_IDS = \[([\s\S]*?)\]/.exec(dbSource)?.[1] ?? '')
  .match(/'([a-z]+)'/g)
  ?.map((q) => q.replace(/'/g, '')) ?? [];
// Сверка двусторонняя, и это безопасно только при одном правиле, которое здесь и
// записано: **статичный якорь `id="vn-<слово>"` в разделе означает блок, на
// который можно сослаться маршрутом**. Другого назначения у такого имени нет.
// Понадобится якорь не под ссылку (подзаголовок, цель для фокуса) - дай ему имя
// без приставки `vn-`, иначе гейт справедливо потребует строку в SECTION_IDS.
// Без этого правила двусторонняя сверка краснела бы на здоровом коде, а такую
// проверку быстро начинают глушить, и она становится хуже отсутствующей.
// Якоря строк региона и рынка собираются шаблоном (`vn-region-…`, `vn-market-…`)
// и под регулярку не попадают: это строки данных, а не блоки.
const rendered = [...dbSource.matchAll(/id="vn-([a-z]+)"/g)].map((m) => m[1]);
for (const id of rendered) {
  if (!declared.includes(id)) problems.push(`якорь · блок «${id}» есть в разметке, но не в SECTION_IDS`);
}
for (const id of declared) {
  if (!rendered.includes(id)) problems.push(`якорь · «${id}» есть в SECTION_IDS, но блока с таким id в разметке нет`);
}

// Дубль id — узел молча перекрывает другой в NODE_MAP, и панель открывает не тот.
const seen = new Map<string, number>();
for (const n of ALL_NODES) seen.set(n.id, (seen.get(n.id) ?? 0) + 1);
for (const [id, count] of seen) {
  if (count > 1) problems.push(`дубль · id «${id}» встречается ${count} раза`);
}

// Дисциплина доказательств: число без источника — то, за что дашборду не верят.
const hasNumber = (n: EcoNode) => /\d/.test(n.value ?? '');
const numeric = ALL_NODES.filter(hasNumber);
const unsourced = numeric.filter((n) => !n.evidence?.length);
const emptyUrl = ALL_NODES.flatMap((n) => n.evidence ?? []).filter((e) => !e.url).length;

console.log(`узлов: ${ALL_NODES.length} · с числом в подписи: ${numeric.length} · из них без источника: ${unsourced.length}`);
console.log(`потоков: ${FLOWS.length + EDTECH_FLOWS.length + AI_NATIVE_FLOWS.length + VIETNAM_FLOWS.length} · цепочек: ${CHAINS.length + EDTECH_CHAINS.length + AI_NATIVE_CHAINS.length + VIETNAM_CHAINS.length} · связей: ${DEPENDENCY_LINKS.length + EDTECH_LINKS.length + AI_NATIVE_LINKS.length + VIETNAM_LINKS.length}`);
console.log(`источников без ссылки (названы словами): ${emptyUrl}`);
console.log(`якорей раздела «Вьетнам»: ${declared.length}, разметка и SECTION_IDS сверены`);

if (problems.length) {
  problems.forEach((p) => console.log(`  ✗ ${p}`));
  console.log(`\n✗ ${problems.length} проблем со ссылками`);
  process.exit(1);
}
console.log('\n✓ все ссылки целы, дублей нет');
