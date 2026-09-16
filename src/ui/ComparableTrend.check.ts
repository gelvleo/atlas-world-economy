// Проверка запускается tsx без @types/node, поэтому маленькие проверки остаются
// самодостаточными и не добавляют Node-типы в production-конфигурацию.
// @ts-expect-error В проекте нет @types/node, но встроенный модуль доступен при запуске проверки.
import { execFileSync } from 'node:child_process';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { GEN_STATS, type GenStat } from '../data/vietnam.generated';
import { AnnualPoints, ComparableTrend } from './ComparableTrend';

const assert = {
  deepEqual(actual: unknown, expected: unknown) {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      throw new Error(`Ожидалось ${JSON.stringify(expected)}, получено ${JSON.stringify(actual)}`);
    }
  },
  match(actual: string, pattern: RegExp) {
    if (!pattern.test(actual)) throw new Error(`Не найдено ${pattern}`);
  },
  doesNotMatch(actual: string, pattern: RegExp) {
    if (pattern.test(actual)) throw new Error(`Не должно быть ${pattern}`);
  },
  ok(value: unknown, message: string) {
    if (!value) throw new Error(message);
  }
};

const stat = (period: string, value: number | null): GenStat => ({
  region_slug: 'check',
  metric: 'population',
  period,
  value,
  unit: 'person',
  source_type: 'official',
  source_url: 'https://example.test/source',
  source_note: null,
  fetched_at: null
});

const markupForTrend = (series: Parameters<typeof ComparableTrend>[0]['series']) =>
  renderToStaticMarkup(createElement(ComparableTrend, { series, title: 'Проверка', note: 'Ряд' }));

const renderVietnamDbRoutes = () => {
  // CSS импортируется legacy-графиком, поэтому SSR запускается в отдельном
  // Node-контексте с тестовым loader-заглушкой. Runtime и production loader не меняются.
  const loader = `export async function load(url, context, nextLoad) {
    if (url.endsWith('.css')) return { format: 'module', source: 'export default {};', shortCircuit: true };
    return nextLoad(url, context);
  }`;
  const script = `
    import { createElement } from 'react';
    import { renderToStaticMarkup } from 'react-dom/server';
    import VietnamDb from './src/sections/VietnamDb.tsx';
    const renderAt = (hash) => {
      globalThis.window = { location: { hash }, addEventListener() {}, removeEventListener() {} };
      return renderToStaticMarkup(createElement(VietnamDb));
    };
    console.log(JSON.stringify({
      region: renderAt('#/vietnam/region/vn'),
      employment: renderAt('#/vietnam/section/employment'),
      currentLamDong: renderAt('#/vietnam/region/vn-lamdong')
    }));
  `;
  const nodePath = (globalThis as unknown as { process: { execPath: string } }).process.execPath;
  const output = execFileSync(nodePath, [
    '--no-warnings',
    '--import', 'tsx/esm',
    '--experimental-loader', `data:text/javascript,${encodeURIComponent(loader)}`,
    '--input-type=module', '-e', script
  ], { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
  return JSON.parse(output.trim()) as { region: string; employment: string; currentLamDong: string };
};

const gap = AnnualPoints([stat('2020', 10), stat('2022', 30)]);
assert.deepEqual(gap.data, [
  { period: '2020', value: 10 },
  { period: '2021', value: null },
  { period: '2022', value: 30 }
]);
assert.deepEqual(gap.missing, ['2021']);

const validSeries = {
  rows: [stat('2020', 10), stat('2021', 20), stat('2022', 30)],
  unit: 'person',
  sourceUrl: 'https://example.test/source',
  conflicts: []
};
assert.match(markupForTrend(validSeries), /Источник ряда/);
const conflictMarkup = markupForTrend({ ...validSeries, conflicts: ['2021'] });
assert.match(conflictMarkup, /Спорные периоды/);
assert.match(conflictMarkup, /Линия скрыта/);
assert.doesNotMatch(conflictMarkup, /Источник ряда/);
const missingUnitMarkup = markupForTrend({ ...validSeries, unit: null });
assert.match(missingUnitMarkup, /Нет сопоставимого ряда с единицей и источником/);
assert.doesNotMatch(missingUnitMarkup, /Источник ряда/);
const missingSourceMarkup = markupForTrend({ ...validSeries, sourceUrl: null });
assert.match(missingSourceMarkup, /Нет сопоставимого ряда с единицей и источником/);
assert.doesNotMatch(missingSourceMarkup, /Источник ряда/);

const {
  region: regionMarkup,
  employment: employmentMarkup,
  currentLamDong: currentLamDongMarkup
} = renderVietnamDbRoutes();
assert.match(regionMarkup, /Выбранный регион/);
assert.match(regionMarkup, /Источник ряда/);

assert.match(employmentMarkup, /Занятость/);
assert.match(employmentMarkup, /Источник ряда/);

// Если в новом снимке появятся три годовые точки для этой территории, пример
// нужно перенести на другой короткий post-2025 регион, сохранив проверку exact-slug.
assert.match(currentLamDongMarkup, /Для графика нужны минимум три сопоставимых годовых наблюдения/);
assert.match(currentLamDongMarkup, /Выбранный регион/);

assert.ok(
  GEN_STATS.some((row) => row.region_slug === 'vn' && row.metric === 'unemployment_rate'),
  'В снимке нет данных занятости для регрессионной проверки'
);
console.log('ComparableTrend checks passed');
