import type { GenEvent, GenStat } from '../data/vietnam.generated';

export const VIETNAM_TIME_ZONE = 'Asia/Ho_Chi_Minh';
export type TimelineScale = 'month' | 'quarter' | 'year';

export interface VietnamDay { year: number; month: number; day: number }
export interface TimelineWindow { start: VietnamDay; endExclusive: VietnamDay; startOrdinal: number; endOrdinal: number }
export interface TimelineEvent { event: GenEvent; start: VietnamDay; end: VietnamDay; startOrdinal: number; endOrdinal: number }
export interface TimelineBar extends TimelineEvent { lane: number }

const DAY_MS = 86_400_000;
const PARTS_FORMATTER = new Intl.DateTimeFormat('en-CA', { timeZone: VIETNAM_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' });
const dayOnly = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Дата без времени уже является вьетнамским календарным днём; её нельзя читать как UTC. */
export function parseVietnamDay(value: string | null | undefined): VietnamDay | null {
  if (!value) return null;
  const match = dayOnly.exec(value.trim());
  if (match) {
    const candidate = { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
    return isValidVietnamDay(candidate) ? candidate : null;
  }
  const instant = new Date(value);
  if (!Number.isFinite(instant.getTime())) return null;
  const values = Object.fromEntries(PARTS_FORMATTER.formatToParts(instant).map((part) => [part.type, part.value]));
  const candidate = { year: Number(values.year), month: Number(values.month), day: Number(values.day) };
  return isValidVietnamDay(candidate) ? candidate : null;
}

export function isValidVietnamDay(day: VietnamDay): boolean {
  if (!Number.isInteger(day.year) || !Number.isInteger(day.month) || !Number.isInteger(day.day)) return false;
  if (day.month < 1 || day.month > 12 || day.day < 1 || day.day > 31) return false;
  return new Date(Date.UTC(day.year, day.month - 1, day.day)).toISOString().slice(0, 10) === `${String(day.year).padStart(4, '0')}-${String(day.month).padStart(2, '0')}-${String(day.day).padStart(2, '0')}`;
}

export function vietnamDayOrdinal(day: VietnamDay): number { return Date.UTC(day.year, day.month - 1, day.day) / DAY_MS; }
export function dayFromOrdinal(ordinal: number): VietnamDay {
  const date = new Date(ordinal * DAY_MS);
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: date.getUTCDate() };
}
export function compareDays(left: VietnamDay, right: VietnamDay): number { return vietnamDayOrdinal(left) - vietnamDayOrdinal(right); }

function daysInMonth(year: number, month: number): number { return new Date(Date.UTC(year, month, 0)).getUTCDate(); }
function addMonths(day: VietnamDay, months: number): VietnamDay {
  const monthIndex = day.year * 12 + day.month - 1 + months;
  const year = Math.floor(monthIndex / 12);
  const month = ((monthIndex % 12) + 12) % 12 + 1;
  return { year, month, day: Math.min(day.day, daysInMonth(year, month)) };
}

export function currentVietnamDay(now = new Date()): VietnamDay {
  return parseVietnamDay(now.toISOString()) ?? { year: now.getUTCFullYear(), month: now.getUTCMonth() + 1, day: now.getUTCDate() };
}
export function shiftAnchor(anchor: VietnamDay, scale: TimelineScale, amount: number): VietnamDay {
  if (scale === 'year') return { year: anchor.year + amount, month: 1, day: 1 };
  return addMonths({ ...anchor, day: 1 }, scale === 'quarter' ? amount * 3 : amount);
}
export function getTimelineWindow(anchor: VietnamDay, scale: TimelineScale): TimelineWindow {
  const start = scale === 'year' ? { year: anchor.year, month: 1, day: 1 } : scale === 'quarter' ? { year: anchor.year, month: Math.floor((anchor.month - 1) / 3) * 3 + 1, day: 1 } : { year: anchor.year, month: anchor.month, day: 1 };
  const endExclusive = addMonths(start, scale === 'year' ? 12 : scale === 'quarter' ? 3 : 1);
  return { start, endExclusive, startOrdinal: vietnamDayOrdinal(start), endOrdinal: vietnamDayOrdinal(endExclusive) };
}
export function positionInWindow(day: VietnamDay, window: TimelineWindow, midpoint = false): number {
  return (vietnamDayOrdinal(day) - window.startOrdinal + (midpoint ? 0.5 : 0)) / (window.endOrdinal - window.startOrdinal);
}
export function eventInWindow(event: GenEvent, window: TimelineWindow): TimelineEvent | null {
  const start = parseVietnamDay(event.starts_at);
  const end = parseVietnamDay(event.ends_at) ?? start;
  if (!start || !end) return null;
  const startOrdinal = vietnamDayOrdinal(start);
  const endOrdinal = Math.max(startOrdinal, vietnamDayOrdinal(end));
  if (endOrdinal < window.startOrdinal || startOrdinal >= window.endOrdinal) return null;
  return { event, start, end, startOrdinal, endOrdinal };
}
export function selectTimelineEvents(events: GenEvent[], window: TimelineWindow, filter = 'all'): TimelineEvent[] {
  return events.filter((event) => filter === 'all' || event.kind === filter || (filter === 'festival' && event.event_class === 'festival')).map((event) => eventInWindow(event, window)).filter((event): event is TimelineEvent => event !== null).sort((a, b) => a.startOrdinal - b.startOrdinal || a.event.title.localeCompare(b.event.title));
}
export function clusterPointEvents(items: TimelineEvent[], maxGapDays = 3): TimelineEvent[][] {
  const groups: TimelineEvent[][] = [];
  for (const item of items) {
    const last = groups[groups.length - 1];
    if (last && item.startOrdinal - last[last.length - 1].startOrdinal <= maxGapDays) last.push(item);
    else groups.push([item]);
  }
  return groups;
}
/** Порог кластера следует ширине 44px hit-area, чтобы близкие точки не перекрывались. */
export function clusterGapDays(window: TimelineWindow, trackWidth = 600, hitArea = 44): number {
  return Math.max(1, Math.ceil((window.endOrdinal - window.startOrdinal) * hitArea / trackWidth));
}
/** Пересекающиеся периоды получают разные дорожки, сохраняя кликабельность полос. */
export function layoutBars(items: TimelineEvent[]): TimelineBar[] {
  const laneEnds: number[] = [];
  return items.map((item) => {
    const freeLane = laneEnds.findIndex((end) => end <= item.startOrdinal);
    const lane = freeLane === -1 ? laneEnds.length : freeLane;
    laneEnds[lane] = item.endOrdinal + 1;
    return { ...item, lane };
  });
}
export function selectMobility(mobility: GenStat[], window: TimelineWindow) {
  return mobility.map((row) => {
    const day = parseVietnamDay(row.period);
    if (row.value === null || row.value === undefined) return null;
    const value = typeof row.value === 'number' ? row.value : Number(row.value);
    if (!day || !Number.isFinite(value)) return null;
    const ordinal = vietnamDayOrdinal(day);
    return ordinal >= window.startOrdinal && ordinal < window.endOrdinal ? { row, day, value, ordinal } : null;
  }).filter((row): row is { row: GenStat; day: VietnamDay; value: number; ordinal: number } => row !== null).sort((a, b) => a.ordinal - b.ordinal);
}
export function formatVietnamDate(value: string | null | undefined, options: Intl.DateTimeFormatOptions = {}) {
  const day = parseVietnamDay(value);
  if (!day) return 'Дата не указана';
  return new Intl.DateTimeFormat('ru-RU', { timeZone: VIETNAM_TIME_ZONE, ...options }).format(new Date(Date.UTC(day.year, day.month - 1, day.day, 12)));
}
export function formatWindow(window: TimelineWindow, scale: TimelineScale): string {
  const start = formatVietnamDate(`${window.start.year}-${String(window.start.month).padStart(2, '0')}-01`, { day: scale === 'year' ? undefined : 'numeric', month: 'long', year: 'numeric' });
  const endDay = dayFromOrdinal(window.endOrdinal - 1);
  const end = formatVietnamDate(`${endDay.year}-${String(endDay.month).padStart(2, '0')}-${String(endDay.day).padStart(2, '0')}`, { day: scale === 'year' ? undefined : 'numeric', month: 'long', year: 'numeric' });
  return scale === 'year' ? start : `${start} — ${end}`;
}
