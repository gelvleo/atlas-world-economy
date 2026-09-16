import type { GenRegion, GenStat } from '../data/vietnam.generated';
import { comparableRegionRows, regionsForPerimeter, selectComparableSeries } from './vietnamSelectors';

const check = (condition: boolean, message: string) => { if (!condition) throw new Error(message); };
const stat = (region_slug: string, period: string, value: number | null, source_url = 'nso', unit = 'person'): GenStat => ({ region_slug, metric: 'population', period, value, unit, source_type: 'official', source_url, source_note: null, fetched_at: null });
const series = selectComparableSeries([stat('vn', '2023', 100), stat('vn', '2024', 101), stat('vn', '2025-01', 102), stat('vn', '2024', 103, 'wb'), stat('vn', '2024', Number.NaN)], { regionSlug: 'vn', metric: 'population', unit: 'person', sourceUrl: 'nso', frequency: 'annual' });
check(series.rows.map((item) => item.period).join(',') === '2023,2024', 'annual rows or NaN filtering failed');
check(series.conflicts.length === 0, 'different source must not be mixed');
const monthly = selectComparableSeries([
  stat('vn', '2026-01', 100),
  stat('vn', '2026-13', 101),
  stat('vn', '2026-01-15', 102)
], { regionSlug: 'vn', metric: 'population', unit: 'person', sourceUrl: 'nso', frequency: 'monthly' });
check(monthly.rows.length === 1 && monthly.rows[0].period === '2026-01', 'monthly period filtering failed');
const conflicting = selectComparableSeries([stat('vn', '2024', 101), stat('vn', '2024', 102)], { regionSlug: 'vn', metric: 'population', unit: 'person', sourceUrl: 'nso', frequency: 'annual' });
check(conflicting.rows.length === 0 && conflicting.conflicts[0] === '2024', 'conflicting duplicate was hidden');
check(selectComparableSeries([stat('vn', '2024', 4, 'nso', 'person'), stat('vn', '2024', 5, 'nso', 'km2')], { regionSlug: 'vn', metric: 'population', unit: 'person', frequency: 'annual' }).rows.length === 1, 'mixed units were accepted');
const regions: GenRegion[] = [
  { id: 'a', slug: 'a', level: 'province', parent_id: null, name_vi: null, name_ru: 'A', name_en: null, perimeter: 'post-2025', lat: null, lon: null, area_km2: null },
  { id: 'b', slug: 'b', level: 'province', parent_id: null, name_vi: null, name_ru: 'B', name_en: null, perimeter: 'post-2025', lat: null, lon: null, area_km2: null },
  { id: 'old', slug: 'old', level: 'province', parent_id: null, name_vi: null, name_ru: 'Old', name_en: null, perimeter: 'pre-2025', lat: null, lon: null, area_km2: null }
];
check(regionsForPerimeter(regions, 'post-2025').length === 2, 'perimeter selection failed');
const coverage = comparableRegionRows([stat('a', '2025', 4)], regions, { perimeter: 'post-2025', metric: 'population', period: '2025', unit: 'person' });
check(coverage.covered === 1 && coverage.missing === 1, 'missing coverage failed');
console.log('vietnam selectors: ok');
