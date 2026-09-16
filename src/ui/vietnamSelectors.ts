import type { GenRegion, GenStat } from '../data/vietnam.generated';

export interface ComparableSeriesOptions {
  regionSlug: string;
  metric: string;
  unit?: string;
  sourceUrl?: string;
  periods?: string[];
  frequency?: 'annual' | 'monthly' | 'any';
}

export interface ComparableSeries {
  rows: GenStat[];
  unit: string | null;
  sourceUrl: string | null;
  conflicts: string[];
}

/**
 * Выбирает один источник и одну единицу, чтобы график не превращал смесь
 * методик в ложную тенденцию. Конфликт за один период остаётся видимым в
 * `conflicts`, а спорная точка исключается из линии.
 */
export function selectComparableSeries(all: GenStat[], options: ComparableSeriesOptions): ComparableSeries {
  const candidates = all.filter((row) =>
    row.region_slug === options.regionSlug &&
    row.metric === options.metric &&
    row.value !== null &&
    Number.isFinite(Number(row.value)) &&
    row.period !== null &&
    (!options.periods || options.periods.includes(row.period)) &&
    (options.frequency === 'annual' ? /^\d{4}$/.test(row.period) : options.frequency === 'monthly' ? /^\d{4}-(0[1-9]|1[0-2])$/.test(row.period) : true)
  );
  const unitCandidates = [...new Set(candidates.map((row) => row.unit).filter((item): item is string => Boolean(item)))];
  const unit = options.unit ?? unitCandidates
    .map((item) => ({ item, count: candidates.filter((row) => row.unit === item).length }))
    .sort((a, b) => b.count - a.count || a.item.localeCompare(b.item))[0]?.item ?? null;
  if (!unit) return { rows: [], unit: null, sourceUrl: null, conflicts: [] };
  const base = candidates.filter((row) => (row.unit ?? null) === unit);

  const sourceGroups = new Map<string, GenStat[]>();
  for (const row of base) {
    const key = row.source_url ?? '';
    sourceGroups.set(key, [...(sourceGroups.get(key) ?? []), row]);
  }
  const sourceUrl = options.sourceUrl ?? [...sourceGroups.entries()]
    .sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]))[0]?.[0] ?? null;
  const selected = sourceGroups.get(sourceUrl ?? '') ?? [];
  const byPeriod = new Map<string, GenStat[]>();
  for (const row of selected) byPeriod.set(row.period!, [...(byPeriod.get(row.period!) ?? []), row]);

  const conflicts: string[] = [];
  const rows: GenStat[] = [];
  for (const [period, candidates] of byPeriod) {
    const values = new Set(candidates.map((row) => Number(row.value)));
    if (values.size > 1) conflicts.push(period);
    else if (candidates[0]) rows.push(candidates[0]);
  }
  rows.sort((a, b) => (a.period ?? '').localeCompare(b.period ?? ''));
  return { rows, unit: rows[0]?.unit ?? selected[0]?.unit ?? null, sourceUrl: sourceUrl || null, conflicts };
}

export function regionsForPerimeter(regions: GenRegion[], perimeter: string, level = 'province'): GenRegion[] {
  return regions.filter((region) => region.level === level && region.perimeter === perimeter);
}

export function comparableRegionRows(
  stats: GenStat[],
  regions: GenRegion[],
  options: { perimeter: string; metric: string; period: string; unit?: string }
) {
  const scope = regionsForPerimeter(regions, options.perimeter);
  const metricRows = stats.filter((stat) =>
    stat.metric === options.metric && stat.period === options.period && stat.value !== null && Number.isFinite(Number(stat.value))
  );
  const unitCandidates = [...new Set(metricRows.map((stat) => stat.unit).filter((item): item is string => Boolean(item)))];
  const selectedUnit = options.unit ?? unitCandidates
    .map((item) => ({ item, count: metricRows.filter((stat) => stat.unit === item).length }))
    .sort((a, b) => b.count - a.count || a.item.localeCompare(b.item))[0]?.item;
  const rows = scope.map((region) => {
    const matches = metricRows.filter((stat) =>
      stat.region_slug === region.slug &&
      selectedUnit !== undefined && selectedUnit !== null && stat.unit === selectedUnit
    );
    const values = new Set(matches.map((stat) => Number(stat.value)));
    return {
      region,
      stat: values.size === 1 ? matches[0] : undefined,
      conflict: values.size > 1
    };
  });
  return {
    rows,
    covered: rows.filter((row) => row.stat).length,
    missing: rows.filter((row) => !row.stat && !row.conflict).length,
    conflicts: rows.filter((row) => row.conflict).length
  };
}
