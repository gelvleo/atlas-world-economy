// Таймлайн событий региона.
//
// Подача взята с дорожной карты Comuni (components/admin/roadmap/RoadmapClient.tsx
// и roadmap-visuals.tsx): горизонтальная ось месяцев, вертикальная линия
// «сегодня», дорожки по видам, длящееся рисуется полосой, точечное - маркером с
// подписью. Перенесены геометрия окна и дорожек; зависимости донора (Next.js,
// lucide, shadcn Button) не переносились.
//
// Зачем это здесь: праздник сам по себе ничего не говорит. Он говорит вместе с
// пиком спроса, поэтому под дорожками событий на ТОЙ ЖЕ оси идёт ряд движения
// людей. Тэт читается не как строка календаря, а как провал поездок.

import { useMemo, useState } from 'react';
import type { GenEvent, GenStat } from '../data/vietnam.generated';
import { CAT, fullNum } from '../ui/charts';

const MONTH_SHORT = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];

/** Доля даты в окне [start, end], 0..1. Вне окна обрезается по краю. */
const posIn = (d: Date, start: Date, end: Date) => {
  const total = end.getTime() - start.getTime();
  if (total <= 0) return 0;
  return Math.min(1, Math.max(0, (d.getTime() - start.getTime()) / total));
};

/** Начала месяцев внутри окна: направляющие сетки и подписи оси. */
function monthTicks(start: Date, end: Date) {
  const out: { pos: number; label: string }[] = [];
  const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  if (cursor < start) cursor.setMonth(cursor.getMonth() + 1);
  while (cursor <= end) {
    out.push({
      pos: posIn(cursor, start, end),
      // Январь подписан годом: без года ось из двенадцати месяцев не говорит,
      // какой это январь, а окно всегда пересекает границу года.
      label: cursor.getMonth() === 0
        ? `${MONTH_SHORT[0]} ${cursor.getFullYear()}`
        : MONTH_SHORT[cursor.getMonth()]
    });
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return out;
}

const dayRu = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }) : '—';

/** Короткая дата для колонки значения: «26 апр 2026». Полная («26 апреля
 *  2026 г.») в паре с концом периода давала строку в 40 знаков, а колонка
 *  значения в атласе не переносится - на 390 она сжимала имя события в
 *  столбик по одному слову. */
const dayShort = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

/** Диапазон дат строки. Конец печатается, только если это ДРУГОЙ день: у
 *  однодневного праздника в базе стоят две метки времени одних суток, и
 *  строка читалась как «26 апр 2026 - 26 апр 2026». */
function rangeShort(a: string | null, b: string | null): string {
  const one = dayShort(a);
  if (!a || !b) return one;
  const sameDay = new Date(a).toDateString() === new Date(b).toDateString();
  return sameDay ? one : `${one} - ${dayShort(b)}`;
}

/** Дорожки: что во что попадает. Порядок дорожек сверху вниз - тот же. */
const TRACKS: { key: string; label: string; bar: boolean; match: (e: GenEvent) => boolean }[] = [
  { key: 'holiday', label: 'Госпраздники', bar: false, match: (e) => e.kind === 'holiday' },
  { key: 'festival', label: 'Фестивали', bar: false, match: (e) => e.kind === 'conference' || e.event_class === 'festival' },
  { key: 'school', label: 'Учебный год', bar: true, match: (e) => e.kind === 'school_term' }
];

interface Props {
  events: GenEvent[];
  /** Ряд подвижности по датам: доля тех, кто уехал дальше 10 км от дома. */
  mobility: GenStat[];
  /** Имя региона, по которому снят ряд подвижности. */
  mobilityRegion: string;
}

/** Ближе этой доли оси точки сливаются в одну пилюлю со счётчиком. 0,022 от
 *  окна в 13 месяцев - это примерно девять дней: праздники одной связки
 *  («29 Tết», «Mồng 1 Tết», «Mồng 2 Tết») сходятся в одну, а разные события
 *  остаются разными точками. */
const CLUSTER_GAP = 0.022;

/** Самая узкая дорожка: 640 px минимальной ширины таймлайна минус колонка имён.
 *  Подпись ставится, только если она влезает ПРИ ЭТОЙ ширине - тогда на 390 и
 *  на 1440 подписи не наезжают одинаково, а не «на десктопе повезло». */
const TRACK_MIN_PX = 524;
/** Уже этого подпись не читается и не ставится: остаётся точка с подсказкой. */
const MIN_LABEL_PX = 56;

/** Точки дорожки, схлопнутые по близости. Кластер из одной точки - обычная
 *  точка с подписью, кластер из нескольких - пилюля со счётчиком. */
function clusterPoints(items: GenEvent[], start: Date, end: Date) {
  const out: { pos: number; items: GenEvent[] }[] = [];
  for (const e of items) {
    const pos = posIn(new Date(e.starts_at as string), start, end);
    const last = out[out.length - 1];
    if (last && pos - last.pos < CLUSTER_GAP) last.items.push(e);
    else out.push({ pos, items: [e] });
  }
  return out;
}

export default function VietnamTimeline({ events, mobility, mobilityRegion }: Props) {
  // Открыт кластер, а не событие: у пилюли внутри может быть три даты.
  const [open, setOpen] = useState<GenEvent[] | null>(null);

  // Окно: полгода назад и полгода вперёд от первого числа текущего месяца.
  // Считается один раз на маунт - таймлайн не должен перерисовываться от того,
  // что человек сидит на странице через полночь.
  const { start, end } = useMemo(() => {
    const now = new Date();
    const s = new Date(now.getFullYear(), now.getMonth() - 6, 1);
    const e = new Date(now.getFullYear(), now.getMonth() + 7, 0);
    return { start: s, end: e };
  }, []);

  const ticks = useMemo(() => monthTicks(start, end), [start, end]);
  const today = posIn(new Date(), start, end);

  const inWindow = (e: GenEvent) => {
    const s = e.starts_at ? new Date(e.starts_at) : null;
    const f = e.ends_at ? new Date(e.ends_at) : s;
    if (!s) return false;
    return (f ?? s) >= start && s <= end;
  };

  const tracks = TRACKS.map((t) => ({
    ...t,
    items: events.filter((e) => t.match(e) && inWindow(e)).sort((a, b) => (a.starts_at ?? '').localeCompare(b.starts_at ?? ''))
  })).filter((t) => t.items.length > 0);

  // Ряд подвижности на той же оси. Своей шкалы у него нет: он показывает форму,
  // а числа читаются подсказкой. Поэтому это спарклайн, а не второй график с
  // осью Y - двух шкал в одном поле не бывает.
  const spark = useMemo(() => {
    const rows = mobility
      .filter((s) => s.period && s.value !== null)
      .map((s) => ({ t: new Date(s.period as string), v: Number(s.value) }))
      .filter((r) => !Number.isNaN(r.t.getTime()))
      .sort((a, b) => a.t.getTime() - b.t.getTime());
    if (rows.length < 3) return null;
    const min = Math.min(...rows.map((r) => r.v));
    const max = Math.max(...rows.map((r) => r.v));
    const span = max - min || 1;
    const pts = rows.map((r) => ({
      x: posIn(r.t, start, end) * 100,
      y: 90 - ((r.v - min) / span) * 80,
      v: r.v,
      t: r.t
    }));
    return {
      d: pts.map((p, i) => `${i ? 'L' : 'M'} ${p.x.toFixed(2)} ${p.y.toFixed(1)}`).join(' '),
      first: rows[0],
      last: rows[rows.length - 1],
      min,
      max,
      n: rows.length,
      pts
    };
  }, [mobility, start, end]);

  if (tracks.length === 0) {
    return (
      <div className="empty">
        <span className="empty-title">В окне таймлайна событий нет</span>
        <span>
          Календарь региона не отдал ни одного праздника, фестиваля или учебного периода за полгода
          назад и полгода вперёд. Их собирает обход календаря.
        </span>
      </div>
    );
  }

  return (
    <div className="stack">
      {/* Ось на тринадцать месяцев требует места: на 390 px дорожка шириной
          245 px превращала подписи месяцев в кашу. Широкое содержимое в атласе
          скроллится внутри своей обёртки, как таблицы - страница вбок не едет. */}
      <div className="table-wrap">
      <div className="tl">
        {/* Шапка с месяцами */}
        <div className="tl-row tl-head">
          <span className="tl-name">Месяц</span>
          <div className="tl-track">
            <div className="tl-grid">
              {ticks.map((t, i) => (
                <span key={i} className="tl-tick" style={{ left: `${t.pos * 100}%` }} />
              ))}
              {today > 0 && today < 1 && <span className="tl-today" style={{ left: `${today * 100}%` }} />}
            </div>
            {ticks.map((t, i) => (
              <span
                key={i}
                className="tl-tick-label"
                // У краёв дорожки центрированная подпись наполовину уезжает за
                // границу и обрезается: «мар» читался как «ар».
                style={{
                  left: `${t.pos * 100}%`,
                  transform: t.pos < 0.04 ? 'none' : t.pos > 0.96 ? 'translateX(-100%)' : 'translateX(-50%)'
                }}
              >
                {t.label}
              </span>
            ))}
          </div>
        </div>

        {tracks.map((track) => {
          const groups = track.bar ? [] : clusterPoints(track.items, start, end);
          return (
          <div className="tl-row" key={track.key}>
            <span className="tl-name">{track.label}</span>
            <div className="tl-track">
              <div className="tl-grid">
                {ticks.map((t, i) => (
                  <span key={i} className="tl-tick" style={{ left: `${t.pos * 100}%` }} />
                ))}
                {today > 0 && today < 1 && <span className="tl-today" style={{ left: `${today * 100}%` }} />}
              </div>
              {track.bar
                ? track.items.map((e, i) => {
                    // Отрезок: у учебного периода есть конец. Без конца рисуем
                    // короткую полосу, а не точку - вид дорожки не меняем.
                    const s = new Date(e.starts_at as string);
                    const left = posIn(s, start, end);
                    const f = e.ends_at ? new Date(e.ends_at) : s;
                    const right = posIn(f, start, end);
                    return (
                      <button
                        className="tl-bar"
                        key={`${e.title}-${i}`}
                        style={{ left: `${left * 100}%`, width: `${Math.max(2, (right - left) * 100)}%` }}
                        onClick={() => setOpen([e])}
                        title={`${e.title} · ${dayRu(e.starts_at)} - ${dayRu(e.ends_at)}`}
                      >
                        {e.title}
                      </button>
                    );
                  })
                : groups.map((g, i) => {
                    // Место до следующего кластера. Подпись шире этого места
                    // наезжала на соседа: «Tết Dương lịch» упиралось в связку
                    // «29 Tết», кружки ложились поверх букв.
                    const room = (groups[i + 1]?.pos ?? 1) - g.pos;
                    const roomPx = room * TRACK_MIN_PX;
                    const many = g.items.length > 1;
                    const first = g.items[0];
                    const past = new Date(first.starts_at as string) < new Date();
                    const isOpen = open === g.items;
                    const titles = g.items.map((e) => `${e.title} · ${dayRu(e.starts_at)}`).join('\n');
                    return (
                      <span key={`${first.title}-${i}`}>
                        {many ? (
                          <button
                            className={`tl-pill${past ? ' tl-pill--past' : ''}`}
                            style={{ left: `${g.pos * 100}%` }}
                            aria-pressed={isOpen}
                            aria-label={`${g.items.length} события подряд: ${g.items.map((e) => e.title).join(', ')}`}
                            onClick={() => setOpen(isOpen ? null : g.items)}
                            title={titles}
                          >
                            ×{g.items.length}
                          </button>
                        ) : (
                          <button
                            className={`tl-dot${past ? ' tl-dot--past' : ''}`}
                            style={{ left: `${g.pos * 100}%` }}
                            aria-pressed={isOpen}
                            aria-label={`${first.title}, ${dayRu(first.starts_at)}`}
                            onClick={() => setOpen(isOpen ? null : g.items)}
                            title={titles}
                          />
                        )}
                        {roomPx >= MIN_LABEL_PX && (
                          <span
                            className={`tl-dot-label${many ? ' tl-dot-label--pill' : ''}`}
                            style={{ left: `${g.pos * 100}%`, maxWidth: `calc(${room * 100}% - 20px)` }}
                            aria-hidden
                          >
                            {first.title}
                          </span>
                        )}
                      </span>
                    );
                  })}
            </div>
          </div>
          );
        })}

        {/* Ряд данных на той же оси */}
        {spark && (
          <div className="tl-row">
            <span className="tl-name">Поездки от 10 км</span>
            <div className="tl-track" style={{ minHeight: 56 }}>
              <div className="tl-grid">
                {ticks.map((t, i) => (
                  <span key={i} className="tl-tick" style={{ left: `${t.pos * 100}%` }} />
                ))}
                {today > 0 && today < 1 && <span className="tl-today" style={{ left: `${today * 100}%` }} />}
              </div>
              <div className="tl-spark">
                <svg
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                  role="img"
                  aria-label={`Доля поездок дальше 10 км, ${mobilityRegion}: ${spark.n} дат, от ${fullNum(spark.min)} до ${fullNum(spark.max)} процента`}
                >
                  <path d={spark.d} fill="none" stroke={CAT[0]} strokeWidth="1.6" vectorEffect="non-scaling-stroke" />
                </svg>
              </div>
            </div>
          </div>
        )}
      </div>
      </div>

      <div className="tl-legend">
        <span>
          Красная черта - сегодня. Точка - день, полоса - период, пилюля «×N» -
          несколько дат подряд, клик раскрывает их списком. Окно:{' '}
          {start.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })} -{' '}
          {end.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}.
        </span>
      </div>

      {open && (
        <div className="note">
          <div className="kicker">
            {open.length > 1
              ? `Подряд идут ${open.length} события`
              : open[0].event_class ?? open[0].kind ?? 'событие'}
          </div>
          <div className="list">
            {open.map((e, i) => (
              <div className="list-row" key={`${e.title}-${i}`}>
                <span className="list-main">
                  <span>{e.title}</span>
                  <span className="tag">{e.event_class ?? e.kind ?? 'событие'}</span>
                  <span className="stat-note">
                    {e.source_url ? (
                      <a href={e.source_url} target="_blank" rel="noreferrer">
                        {e.source_name ?? 'источник'}
                      </a>
                    ) : (
                      'источник у этой строки не указан'
                    )}
                    {e.evidence_kind ? ` · тип источника: ${e.evidence_kind}` : ''}
                  </span>
                </span>
                <span className="list-side num">{rangeShort(e.starts_at, e.ends_at)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {spark ? (
        <p className="section-lead">
          Нижняя дорожка - доля людей, уехавших дальше 10 км от дома, по дням. Ряд снят по району{' '}
          {mobilityRegion}: <span className="num">{spark.n}</span> дат, от{' '}
          <span className="num">{fullNum(spark.min)}</span> до{' '}
          <span className="num">{fullNum(spark.max)}</span> процента. Своей оси Y у ряда нет намеренно:
          двух шкал в одном поле не бывает, здесь читается форма, а числа стоят рядом.
        </p>
      ) : (
        <p className="section-lead">
          Ряда спроса по месяцам под осью нет: помесячного турпотока база региона не знает, годовые
          числа на дневную ось не ложатся. Появится помесячный ряд - встанет сюда же.
        </p>
      )}
    </div>
  );
}
