import { useMemo, useState } from 'react';
import type { GenEvent, GenStat } from '../data/vietnam.generated';
import {
  clusterPointEvents,
  clusterGapDays,
  currentVietnamDay,
  formatVietnamDate,
  formatWindow,
  getTimelineWindow,
  layoutBars,
  positionInWindow,
  selectMobility,
  selectTimelineEvents,
  shiftAnchor,
  type TimelineEvent,
  type TimelineScale,
  type VietnamDay
} from './vietnamTimeline.helpers';
import './vietnam-timeline.css';

interface Props {
  events: GenEvent[];
  mobility: GenStat[];
  mobilityRegion: string;
}

type Filter = 'all' | 'holiday' | 'festival' | 'school_term';

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'Все типы' },
  { value: 'holiday', label: 'Праздники' },
  { value: 'festival', label: 'Фестивали' },
  { value: 'school_term', label: 'Учебные периоды' }
];

const TRACKS: { key: string; label: string; kind: Filter }[] = [
  { key: 'holiday', label: 'Госпраздники', kind: 'holiday' },
  { key: 'festival', label: 'Фестивали', kind: 'festival' },
  { key: 'school_term', label: 'Учебные периоды', kind: 'school_term' }
];

const MONTHS = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];

function isoDay(day: VietnamDay): string {
  return `${String(day.year).padStart(4, '0')}-${String(day.month).padStart(2, '0')}-${String(day.day).padStart(2, '0')}`;
}

function addDays(day: VietnamDay, amount: number): VietnamDay {
  const date = new Date(Date.UTC(day.year, day.month - 1, day.day + amount));
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: date.getUTCDate() };
}

function addMonths(day: VietnamDay, amount: number): VietnamDay {
  const date = new Date(Date.UTC(day.year, day.month - 1 + amount, 1));
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: 1 };
}

function dateLabel(day: VietnamDay, scale: TimelineScale): string {
  return scale === 'year'
    ? `${MONTHS[day.month - 1]} ${day.year}`
    : scale === 'quarter'
      ? `${MONTHS[day.month - 1]} ${day.year}`
      : `${day.day} ${MONTHS[day.month - 1]}`;
}

function makeTicks(window: ReturnType<typeof getTimelineWindow>, scale: TimelineScale) {
  const span = window.endOrdinal - window.startOrdinal;
  let days: VietnamDay[];
  if (scale === 'month') {
    days = Array.from({ length: Math.ceil(span / 7) }, (_, index) => addDays(window.start, index * 7));
  } else if (scale === 'quarter') {
    days = [0, 1, 2].map((index) => addMonths(window.start, index));
  } else {
    days = [0, 3, 6, 9].map((index) => addMonths(window.start, index));
  }
  return days.map((day) => ({ day, position: positionInWindow(day, window), label: dateLabel(day, scale) }));
}

function eventDateRange(item: TimelineEvent): string {
  const options = { day: 'numeric' as const, month: 'long' as const, year: 'numeric' as const };
  const start = formatVietnamDate(isoDay(item.start), options);
  const end = formatVietnamDate(isoDay(item.end), options);
  return start === end ? start : `${start} — ${end}`;
}

function typeLabel(event: GenEvent): string {
  if (event.event_class === 'public_holiday' || event.kind === 'holiday') return 'Госпраздник';
  if (event.event_class === 'festival' || event.kind === 'conference') return 'Фестиваль';
  if (event.event_class === 'school_term' || event.kind === 'school_term') return 'Учебный период';
  return 'Событие';
}

function evidenceLabel(event: GenEvent): string | null {
  if (!event.evidence_kind) return null;
  if (event.evidence_kind === 'official') return 'официальный источник';
  if (event.evidence_kind === 'press') return 'пресс-источник';
  return 'тип источника не уточнён';
}

function sourceLine(event: GenEvent) {
  return event.source_url
    ? <a href={event.source_url} target="_blank" rel="noreferrer">{event.source_name ?? 'Открыть источник'}</a>
    : <span>Источник у строки не указан</span>;
}

export default function VietnamTimeline({ events, mobility, mobilityRegion }: Props) {
  const [scale, setScale] = useState<TimelineScale>('month');
  const [anchor, setAnchor] = useState<VietnamDay>(() => currentVietnamDay());
  const [filter, setFilter] = useState<Filter>('all');
  const [open, setOpen] = useState<TimelineEvent[] | null>(null);
  const window = useMemo(() => getTimelineWindow(anchor, scale), [anchor, scale]);
  const ticks = useMemo(() => makeTicks(window, scale), [window, scale]);
  const selected = useMemo(() => selectTimelineEvents(events, window, filter), [events, filter, window]);
  const mobilityRows = useMemo(() => selectMobility(mobility, window), [mobility, window]);
  const today = positionInWindow(currentVietnamDay(), window, true);
  const tracks = TRACKS.map((track) => ({
    ...track,
    items: selected.filter((item) => track.kind === 'festival'
      ? item.event.kind === 'conference' || item.event.event_class === 'festival'
      : item.event.kind === track.kind)
  })).filter((track) => track.items.length > 0);

  const changeWindow = (amount: number) => {
    setAnchor((current) => shiftAnchor(current, scale, amount));
    setOpen(null);
  };
  const markerVisible = today >= 0 && today <= 1;
  const openEvent = (items: TimelineEvent[]) => setOpen(items);

  return (
    <section className="vt-calendar" aria-labelledby="vt-title">
      <div className="vt-heading">
        <div>
          <p className="vt-eyebrow">Календарь Вьетнама</p>
          <h2 id="vt-title">События и периоды</h2>
          <p className="vt-range" aria-live="polite">
            {formatWindow(window, scale)} · календарные дни <span>Asia/Ho_Chi_Minh</span>
          </p>
        </div>
        <div className="vt-nav" aria-label="Навигация по календарю">
          <button type="button" onClick={() => changeWindow(-1)} aria-label="Предыдущее окно">Назад</button>
          <button type="button" onClick={() => { setAnchor(currentVietnamDay()); setOpen(null); }}>Сегодня</button>
          <button type="button" onClick={() => changeWindow(1)} aria-label="Следующее окно">Вперёд</button>
        </div>
      </div>

      <div className="vt-controls" aria-label="Масштаб и фильтр">
        <div className="vt-segmented" role="group" aria-label="Масштаб оси">
          {(['month', 'quarter', 'year'] as TimelineScale[]).map((value) => (
            <button key={value} type="button" className={scale === value ? 'is-active' : ''} aria-pressed={scale === value} onClick={() => { setScale(value); setOpen(null); }}>
              {value === 'month' ? 'Месяц' : value === 'quarter' ? 'Квартал' : 'Год'}
            </button>
          ))}
        </div>
        <label className="vt-filter">
          <span>Тип события</span>
          <select value={filter} onChange={(event) => { setFilter(event.target.value as Filter); setOpen(null); }}>
            {FILTERS.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}
          </select>
        </label>
      </div>

      {tracks.length === 0 ? (
        <div className="vt-empty" role="status">
          <strong>В этом окне событий нет</strong>
          <span>Попробуйте другое окно или снимите фильтр типа. Навигация и масштаб остаются доступны.</span>
        </div>
      ) : (
        <div className="vt-scroll" tabIndex={0} aria-label="Прокручиваемая шкала календаря">
          <div className="vt-board">
            <div className="vt-row vt-axis-row">
              <span className="vt-label">Период</span>
              <div className="vt-track vt-axis">
                {ticks.map((tick) => <span className="vt-tick-label" style={{ left: `${tick.position * 100}%` }} key={isoDay(tick.day)}>{tick.label}</span>)}
                {markerVisible && <span className="vt-today-marker" style={{ left: `${today * 100}%` }} aria-hidden="true" />}
              </div>
            </div>

            {tracks.map((track) => {
              const points = clusterPointEvents(track.items.filter((item) => item.endOrdinal === item.startOrdinal), clusterGapDays(window));
              const bars = layoutBars(track.items.filter((item) => item.endOrdinal > item.startOrdinal));
              const lanes = Math.max(1, ...bars.map((bar) => bar.lane + 1));
              return (
                <div className="vt-row" key={track.key}>
                  <span className="vt-label">{track.label}</span>
                  <div className="vt-track vt-event-track" style={{ minHeight: `${Math.max(64, lanes * 48 + 16)}px` }}>
                    {bars.map((bar) => {
                      const left = Math.max(0, positionInWindow(bar.start, window));
                      const right = Math.min(1, positionInWindow(addDays(bar.end, 1), window));
                      return <button type="button" className="vt-bar" style={{ left: `${left * 100}%`, width: `${Math.max(2, (right - left) * 100)}%`, top: `${bar.lane * 48 + 8}px` }} onClick={() => openEvent([bar])} key={`${bar.event.title}-${bar.startOrdinal}`} aria-label={`${bar.event.title}, ${eventDateRange(bar)}`} title={`${bar.event.title} · ${eventDateRange(bar)}`}><span>{bar.event.title}</span></button>;
                    })}
                    {points.map((group) => {
                      const first = group[0];
                      const position = positionInWindow(first.start, window, true);
                      const isOpen = open?.[0] === first;
                      const label = group.length > 1 ? `${group.length} события: ${group.map((item) => item.event.title).join(', ')}` : `${first.event.title}, ${eventDateRange(first)}`;
                      return <button type="button" className={`vt-point${group.length > 1 ? ' vt-cluster' : ''}`} style={{ left: `${position * 100}%` }} onClick={() => setOpen(isOpen ? null : group)} aria-pressed={isOpen} aria-label={label} title={label} key={`${first.event.title}-${first.startOrdinal}`}>{group.length > 1 ? `×${group.length}` : ''}</button>;
                    })}
                    {markerVisible && <span className="vt-today-marker" style={{ left: `${today * 100}%` }} aria-hidden="true" />}
                  </div>
                </div>
              );
            })}

            {mobilityRows.length > 0 && <div className="vt-row vt-mobility-row">
              <span className="vt-label">Мобильность</span>
              <div className="vt-track vt-mobility-track">
                {mobilityRows.map((row) => <span className="vt-mobility-dot" style={{ left: `${positionInWindow(row.day, window, true) * 100}%`, bottom: `${Math.min(82, Math.max(10, row.value))}%` }} title={`${formatVietnamDate(isoDay(row.day), { day: 'numeric', month: 'long', year: 'numeric' })}: ${row.value.toFixed(1)}%`} key={`${row.ordinal}-${row.value}`} />)}
                {markerVisible && <span className="vt-today-marker" style={{ left: `${today * 100}%` }} aria-hidden="true" />}
              </div>
            </div>}
          </div>
        </div>
      )}

      <p className="vt-note">Точки показывают отдельные дни, полосы — периоды, «×N» объединяет близкие даты. Красная линия — сегодня. У событий пока не указан регион.</p>

      {open && <aside className="vt-details" aria-live="polite">
        <div className="vt-details-head"><strong>{open.length > 1 ? `События в группе: ${open.length}` : 'Детали события'}</strong><button type="button" onClick={() => setOpen(null)} aria-label="Закрыть детали">Закрыть</button></div>
        {open.map((item, index) => <article className="vt-detail" key={`${item.event.title}-${item.startOrdinal}-${index}`}>
          <h3>{item.event.title}</h3>
          <p>{eventDateRange(item)} · {typeLabel(item.event)}</p>
          <p>{sourceLine(item.event)}{evidenceLabel(item.event) ? ` · ${evidenceLabel(item.event)}` : ''}</p>
          <p className="vt-muted">География: не указана в данных события.</p>
        </article>)}
      </aside>}

      <p className="vt-footnote">{mobilityRows.length > 0
        ? `На той же оси показана отдельная серия мобильности ${mobilityRegion || 'региона'}: ${mobilityRows.length} наблюдений. Совпадение дат само по себе не доказывает причинность или изменение спроса.`
        : 'Ряд мобильности не показан: нет наблюдений за этот период. Локальный ряд нельзя переносить на национальный календарь.'}</p>
    </section>
  );
}
