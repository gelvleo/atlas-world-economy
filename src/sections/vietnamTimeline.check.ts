import type { GenEvent, GenStat } from '../data/vietnam.generated';
import {
  eventInWindow,
  clusterGapDays,
  getTimelineWindow,
  layoutBars,
  parseVietnamDay,
  selectMobility,
  selectTimelineEvents,
  vietnamDayOrdinal
} from './vietnamTimeline.helpers';

const assert = (condition: boolean, message: string) => {
  if (!condition) throw new Error(`vietnamTimeline check failed: ${message}`);
};
const event = (starts_at: string | null, ends_at: string | null = null): GenEvent => ({
  title: 'check', kind: 'holiday', event_class: 'public_holiday', starts_at, ends_at,
  source_url: null, source_name: null, evidence_kind: null
});
const stat = (period: string | null, value: number | null): GenStat => ({
  region_slug: 'vn-lamdong-dalat', metric: 'mobility_10_100km_share', period, value,
  unit: 'percent', source_type: 'proxy', source_url: null, source_note: null, fetched_at: null
});

const jan2027 = getTimelineWindow({ year: 2027, month: 1, day: 12 }, 'month');
const vnDay = parseVietnamDay('2026-12-31T17:00:00Z');
assert(vnDay?.year === 2027 && vnDay.month === 1 && vnDay.day === 1, 'UTC instant must be 1 January in Vietnam');
assert(jan2027.endExclusive.year === 2027 && jan2027.endExclusive.month === 2, 'month window must roll into next year');
assert(eventInWindow(event('2026-12-31T17:00:00Z'), jan2027)?.start.day === 1, 'new-year event must be inside January');
assert(eventInWindow(event('not-a-date'), jan2027) === null, 'invalid event date must be excluded');
const festival = { ...event('2027-01-12'), kind: 'conference', event_class: 'festival' };
assert(selectTimelineEvents([festival], jan2027, 'festival').length === 1, 'festival filter keeps conference events marked as festivals');

const overlap = layoutBars([
  eventInWindow(event('2027-01-02', '2027-01-08'), jan2027)!,
  eventInWindow(event('2027-01-05', '2027-01-10'), jan2027)!
]);
assert(overlap[0].lane !== overlap[1].lane, 'overlapping bars must receive separate lanes');
assert(clusterGapDays(getTimelineWindow({ year: 2027, month: 1, day: 1 }, 'year')) > clusterGapDays(jan2027), 'point clustering threshold scales with window span');

const mobility = selectMobility([stat('2027-01-05', 12), stat('2027-01-07', null), stat('2026-12-31', 99), stat('2027-01-06', Number.NaN), stat('not-a-date', 20)], jan2027);
assert(mobility.length === 1 && mobility[0].value === 12, 'mobility keeps finite values in window only');
assert(mobility[0].ordinal === vietnamDayOrdinal({ year: 2027, month: 1, day: 5 }), 'mobility geometry uses Vietnam calendar days');

console.log('vietnamTimeline checks passed');
