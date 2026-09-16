// Графики атласа. Один файл на весь раздел: формы всего четыре, и каждая
// повторяется в нескольких блоках.
//
// Правила взяты из скилла dataviz и из DESIGN.md:
//   · одна шкала на график, двух осей Y не бывает;
//   · цвет несёт вид ряда, а не его место в сортировке;
//   · подписи и легенда живут в границах, текст тонами --ink-*, не цветом ряда;
//   · числа моноширинные с разделителем тысяч;
//   · сетка и оси рецессивные, линия 2px, точка 8px;
//   · рядов больше четырёх не бывает: пятый уходит в «прочее» или в фасет.
//
// Палитра рядов проверена валидатором скилла (node validate_palette.js, light,
// 4 слота): все шесть проверок зелёные, худшая пара по дальтонизму ΔE 8,0,
// по обычному зрению 19,2. Первый слот - акцент атласа, фиолетового нет.

import type { ReactNode } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';

/** Категориальная палитра рядов. Порядок фиксирован: ряд получает слот по виду,
 *  а не по месту в сортировке, иначе фильтр перекрашивает выживших. */
export const CAT = ['#14568C', '#B36A12', '#1B8A70', '#A83A3A'] as const;

const INK = '#18181B';
const INK_2 = '#52525B';
const INK_3 = '#8A8A93';
const HAIR = '#E7E7EA';
const MONO = "'Geist Mono Variable', ui-monospace, SFMono-Regular, Menlo, monospace";
const SANS = "'Geist Variable', ui-sans-serif, system-ui, sans-serif";

// ─── Числа ────────────────────────────────────────────────────────────────────

const SCALES: [number, string][] = [
  [1e12, 'трлн'],
  [1e9, 'млрд'],
  [1e6, 'млн'],
  [1e3, 'тыс.']
];

/** Число оси: крупное сокращается до порядка, мелкое печатается целиком.
 *  Разделитель тысяч и запятая как десятичная - русская запись. */
export function axisNum(v: number): string {
  if (!Number.isFinite(v)) return '';
  // Ноль печатается нулём: «0,0» на основании оси читается как точность,
  // которой у деления нет.
  if (v === 0) return '0';
  const abs = Math.abs(v);
  const scale = SCALES.find(([n]) => abs >= n);
  if (!scale) return abs < 10 ? v.toFixed(1).replace('.', ',') : Math.round(v).toLocaleString('ru-RU');
  return `${(v / scale[0]).toFixed(abs / scale[0] >= 100 ? 0 : 1).replace('.', ',')} ${scale[1]}`;
}

/** Полное число для подсказки: порядок тут вредит, человек сверяет с источником. */
export const fullNum = (v: number): string =>
  Number.isInteger(v) ? v.toLocaleString('ru-RU') : v.toFixed(2).replace('.', ',');

// ─── Общие куски ──────────────────────────────────────────────────────────────

export interface Point {
  /** подпись по оси X: год «2024» или дата «2026-08-16» */
  period: string;
  [series: string]: string | number | null;
}

interface TipRow {
  name: string;
  value: number;
  color: string;
}

function Tip({
  active,
  payload,
  label,
  unit
}: {
  active?: boolean;
  payload?: { name?: string; value?: number; color?: string; dataKey?: string }[];
  label?: string;
  unit?: string;
}) {
  if (!active || !payload?.length) return null;
  const rows: TipRow[] = payload
    .filter((p) => p.value !== null && p.value !== undefined)
    .map((p) => ({ name: p.name ?? String(p.dataKey ?? ''), value: Number(p.value), color: p.color ?? INK_3 }));
  if (!rows.length) return null;
  return (
    <div className="chart-tip">
      <div className="chart-tip-head">{label}</div>
      {rows.map((r) => (
        <div className="chart-tip-row" key={r.name}>
          <span className="dot" style={{ background: r.color }} aria-hidden />
          <span className="chart-tip-name">{r.name}</span>
          <span className="num">{fullNum(r.value)}</span>
          {unit && <span className="unit">{unit}</span>}
        </div>
      ))}
    </div>
  );
}

const AXIS = { fontSize: 11, fontFamily: MONO, fill: INK_3 };
const AXIS_TEXT = { fontSize: 11.5, fontFamily: SANS, fill: INK_3 };

/** Обёртка графика: заголовок, подпись единицы и сам холст фиксированной высоты.
 *  Высота в пикселях, а не в процентах: ResponsiveContainer внутри флекса без
 *  заданной высоты схлопывается в ноль.
 *
 *  Легенда своя, а не из recharts: та выдаёт ряды в порядке отрисовки стека, и
 *  «дома» оказывались третьими, хотя это первый сегмент полосы. Свой порядок в
 *  легенде совпадает с порядком слотов палитры - иначе легенда врёт. */
export function Figure({
  title,
  note,
  legend,
  height = 220,
  children
}: {
  title?: ReactNode;
  note?: ReactNode;
  legend?: { key: string; label: string }[];
  height?: number;
  children: ReactNode;
}) {
  return (
    <figure className="chart">
      {(title || note) && (
        <figcaption className="chart-head">
          {title && <span className="chart-title">{title}</span>}
          {note && <span className="chart-note">{note}</span>}
        </figcaption>
      )}
      <div className="chart-canvas" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          {children as never}
        </ResponsiveContainer>
      </div>
      {legend && legend.length > 1 && (
        <div className="legend">
          {legend.map((l, i) => (
            <span className="legend-item" key={l.key}>
              <span className="dot" style={{ background: CAT[i % CAT.length] }} aria-hidden />
              {l.label}
            </span>
          ))}
        </div>
      )}
    </figure>
  );
}

// ─── Тенденция по периодам ────────────────────────────────────────────────────

export interface TrendProps {
  data: Point[];
  /** Ключи рядов в порядке показа. Один ряд рисуется площадью, несколько - линиями. */
  series: { key: string; label: string }[];
  unit?: string;
  height?: number;
  title?: ReactNode;
  note?: ReactNode;
  /** Подписи оси X длинные (даты) - тогда через одну. */
  sparseX?: boolean;
  /** Соединять ли точки через пропущенные периоды. По умолчанию пропуск виден. */
  connectNulls?: boolean;
}

/** Ряд по годам или датам. Один ряд - площадь под линией: форма читается
 *  быстрее, чем голая линия. Несколько - линии с легендой. */
export function Trend({ data, series, unit, height = 220, title, note, sparseX, connectNulls = false }: TrendProps) {
  const many = series.length > 1;
  const margin = { top: 8, right: 12, bottom: 4, left: 4 };
  const axes = (
    <>
      <CartesianGrid stroke={HAIR} strokeDasharray="0" vertical={false} />
      <XAxis
        dataKey="period"
        tick={AXIS}
        tickLine={false}
        axisLine={{ stroke: HAIR }}
        // Прореживание считает сам recharts по зазору: жёсткий interval={0}
        // печатал четырнадцать лет подряд, и на 390 px они слипались в
        // «20112012201320142015». Края ряда остаются подписанными всегда.
        interval="preserveStartEnd"
        minTickGap={sparseX ? 24 : 12}
      />
      <YAxis
        tick={AXIS}
        tickLine={false}
        axisLine={false}
        width={56}
        tickFormatter={axisNum}
        // Ноль в основании: обрезанная ось преувеличивает наклон.
        domain={[0, 'auto']}
      />
      <Tooltip content={<Tip unit={unit} />} cursor={{ stroke: INK_3, strokeWidth: 1 }} />
    </>
  );

  return (
    <Figure title={title} note={note} height={height} legend={many ? series : undefined}>
      {many ? (
        <LineChart data={data} margin={margin}>
          {axes}
          {series.map((s, i) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stroke={CAT[i % CAT.length]}
              strokeWidth={2}
              dot={{ r: 3, strokeWidth: 0, fill: CAT[i % CAT.length] }}
              activeDot={{ r: 5 }}
              connectNulls={connectNulls}
            />
          ))}
        </LineChart>
      ) : (
        <AreaChart data={data} margin={margin}>
          <defs>
            <linearGradient id="chart-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={CAT[0]} stopOpacity={0.18} />
              <stop offset="100%" stopColor={CAT[0]} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          {axes}
          <Area
            type="monotone"
            dataKey={series[0].key}
            name={series[0].label}
            stroke={CAT[0]}
            strokeWidth={2}
            fill="url(#chart-area)"
            dot={{ r: 3, strokeWidth: 0, fill: CAT[0] }}
            activeDot={{ r: 5 }}
            connectNulls={connectNulls}
          />
        </AreaChart>
      )}
    </Figure>
  );
}

// ─── Столбики по категориям ───────────────────────────────────────────────────

export interface BarsRow {
  label: string;
  value: number;
  /** Подсветить строку (выбранная зона, свой район). */
  active?: boolean;
}

/** Горизонтальные столбики: категорий много, имена длинные, читать их вертикально
 *  невозможно. Значение подписано у конца столбика, легенда не нужна - ряд один. */
export function Bars({
  rows,
  unit,
  title,
  note,
  height
}: {
  rows: BarsRow[];
  unit?: string;
  title?: ReactNode;
  note?: ReactNode;
  height?: number;
}) {
  const h = height ?? Math.max(120, rows.length * 28 + 24);
  return (
    <Figure title={title} note={note} height={h}>
      <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 56, bottom: 4, left: 4 }}>
        <CartesianGrid stroke={HAIR} horizontal={false} />
        <XAxis type="number" tick={AXIS} tickLine={false} axisLine={false} tickFormatter={axisNum} />
        <YAxis
          type="category"
          dataKey="label"
          tick={AXIS_TEXT}
          tickLine={false}
          axisLine={{ stroke: HAIR }}
          width={132}
        />
        <Tooltip content={<Tip unit={unit} />} cursor={{ fill: 'rgba(20, 86, 140, 0.06)' }} />
        <Bar dataKey="value" name={unit ?? 'значение'} radius={[0, 4, 4, 0]} barSize={14} isAnimationActive={false}>
          {rows.map((r, i) => (
            <Cell key={i} fill={r.active ? CAT[1] : CAT[0]} />
          ))}
        </Bar>
      </BarChart>
    </Figure>
  );
}

// ─── Доли, сложенные в сто процентов ──────────────────────────────────────────

/** Стек долей по категориям. Ряды суммируются до целого, поэтому стек честен:
 *  в любом другом случае стек врёт и вместо него идут столбики. */
export function Shares({
  data,
  series,
  title,
  note,
  height
}: {
  data: Point[];
  series: { key: string; label: string }[];
  title?: ReactNode;
  note?: ReactNode;
  height?: number;
}) {
  const h = height ?? Math.max(160, data.length * 26 + 24);
  return (
    <Figure title={title} note={note} height={h} legend={series}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 12, bottom: 4, left: 4 }} stackOffset="expand">
        <XAxis
          type="number"
          tick={AXIS}
          tickLine={false}
          axisLine={false}
          domain={[0, 1]}
          tickFormatter={(v: number) => `${Math.round(v * 100)} %`}
        />
        <YAxis
          type="category"
          dataKey="period"
          tick={AXIS_TEXT}
          tickLine={false}
          axisLine={{ stroke: HAIR }}
          width={112}
          // Без этого recharts прячет каждую вторую подпись, и половина строк
          // остаётся без имени: категорию по соседям не угадать.
          interval={0}
        />
        <Tooltip content={<Tip unit="%" />} cursor={{ fill: 'rgba(20, 86, 140, 0.06)' }} />
        {series.map((s, i) => (
          <Bar
            key={s.key}
            dataKey={s.key}
            name={s.label}
            stackId="a"
            fill={CAT[i % CAT.length]}
            // Зазор 2px поверхности между сегментами: границы стека иначе
            // сливаются в одну полосу.
            stroke="#FFFFFF"
            strokeWidth={2}
            barSize={16}
            isAnimationActive={false}
          />
        ))}
      </BarChart>
    </Figure>
  );
}

// ─── Спарклайн ────────────────────────────────────────────────────────────────

/** Ряд в строке списка. Библиотеку сюда не тянем: это двадцать точек и путь,
 *  а ResponsiveContainer в строке таблицы стоит дороже самой строки. */
export function Sparkline({ values, width = 64, height = 18 }: { values: number[]; width?: number; height?: number }) {
  if (values.length < 3) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const step = (width - 2) / (values.length - 1);
  const y = (v: number) => height - 2 - ((v - min) / span) * (height - 4);
  const d = values.map((v, i) => `${i ? 'L' : 'M'} ${(1 + i * step).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');
  const last = values[values.length - 1];
  const rising = last >= values[0];
  return (
    <svg
      className="spark"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={`Ряд из ${values.length} значений, ${rising ? 'рост' : 'снижение'} с ${fullNum(values[0])} до ${fullNum(last)}`}
    >
      <path d={d} fill="none" stroke={CAT[0]} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={(1 + (values.length - 1) * step).toFixed(1)} cy={y(last).toFixed(1)} r="2" fill={CAT[0]} />
    </svg>
  );
}
