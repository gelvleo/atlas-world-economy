import type { ReactNode } from 'react';
import { Trend, type Point } from './charts';
import type { GenStat } from '../data/vietnam.generated';
import type { ComparableSeries } from './vietnamSelectors';

export function AnnualPoints(rows: GenStat[]): { data: Point[]; missing: string[] } {
  const years = rows.map((row) => Number(row.period)).filter(Number.isInteger);
  if (years.length < 2) {
    return {
      data: rows.map((row) => ({ period: row.period!, value: Number(row.value) })),
      missing: []
    };
  }

  const byYear = new Map(rows.map((row) => [row.period!, Number(row.value)]));
  const data: Point[] = [];
  const missing: string[] = [];
  for (let year = Math.min(...years); year <= Math.max(...years); year += 1) {
    const period = String(year);
    const value = byYear.get(period);
    if (value === undefined) missing.push(period);
    data.push({ period, value: value ?? null });
  }
  return { data, missing };
}

export interface ComparableTrendProps {
  series: ComparableSeries;
  title: string;
  note: ReactNode;
  unit?: string;
}

export function ComparableTrend({ series, title, note, unit }: ComparableTrendProps) {
  const points = AnnualPoints(series.rows);
  if (!series.unit || !series.sourceUrl) {
    return <div className="empty"><strong>{title}</strong><span>Нет сопоставимого ряда с единицей и источником.</span></div>;
  }
  if (series.conflicts.length > 0) {
    return <div className="empty"><strong>{title}</strong><span>Спорные периоды: {series.conflicts.join(', ')}. Линия скрыта до выбора одного значения.</span></div>;
  }
  if (points.data.length < 2) {
    return <div className="empty"><strong>{title}</strong><span>Сопоставимых точек меньше двух. Ряд не строится.</span></div>;
  }
  if (points.missing.length > 0) {
    return <div className="empty"><strong>{title}</strong><span>Нет данных за {points.missing.join(', ')}. Пропуски не соединяются в непрерывную тенденцию.</span></div>;
  }
  return (
    <Trend
      data={points.data}
      series={[{ key: 'value', label: title.toLowerCase() }]}
      unit={unit ?? series.unit}
      title={title}
      note={<>{note} · <a href={series.sourceUrl}>Источник ряда</a></>}
      sparseX
    />
  );
}
