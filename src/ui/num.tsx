// Число и единица измерения по разделу 2 контракта: моноширинным идёт только
// число, единица — отдельным span тоном --ink-3 и размером --t-meta.
// Разделы не режут строки сами: значение целиком отдаётся сюда.
import type { ReactNode } from 'react';

// ponytail: эвристика по первой числовой группе. Данные — свободный текст
// («рост ~6.5%/год», «$32.38 трлн ВВП»), схемы единиц в них нет. Если появится
// поле unit в данных — брать оттуда и эвристику выкинуть.
// Знаки перед числом ($ ~ + − < > ≈) — часть числа, а не единицы: «+12,2%»
// и «< 1 мес» без них меняют смысл.
const RE = /^([^\d$~+<>≈≥≤−]*?)\s*([$~+<>≈≥≤−]*\s*[\d][\d\s.,–—\-]*%?)\s*(.*)$/u;

export function splitValue(v: string): [string, string, string] {
  const m = RE.exec(v);
  if (!m) return ['', v, ''];
  return [m[1].trim(), m[2].trim(), m[3].trim()];
}

interface Props {
  /** значение целиком: «$32.38 трлн ВВП», «2 300 – 2 700 школ», «442» */
  value: string | number;
  /** единица, если она в данных отдельным полем */
  unit?: ReactNode;
  /** дополнительные классы обёртки: list-side, stat-num, table-cell */
  className?: string;
}

/** Значение строкой: число моно, единица вторым тоном. */
export default function Val({ value, unit, className }: Props) {
  const raw = String(value);
  // Значение у части узлов и потоков — не число, а фраза («инфраструктура
  // доказательств»). Моноширинному в ней делать нечего: отдаём обычным текстом,
  // а .val--text снимает моно с обёртки вроде .list-side.
  if (!/\d/.test(raw)) {
    return <span className={className ? `${className} val--text` : 'val--text'}>{raw}</span>;
  }
  const [pre, num, post] = splitValue(raw);
  const tail = unit ?? (post || null);
  return (
    <span className={className}>
      {pre && <span className="unit unit--pre">{pre}</span>}
      <span className="num">{num}</span>
      {tail && <span className="unit">{tail}</span>}
    </span>
  );
}
