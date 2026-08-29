import type { ScheduleEntry } from "./schedule";

export interface TimelineEventPlacement {
  uuid: string;
  content: string;
  start: Date;
  end: Date | null;
  open: boolean;
  /** Offset from the left of the row, as a fraction of row width (0..1). */
  left: number;
  /** Width of the bar, as a fraction of row width (0..1). */
  width: number;
  /** Position of the entry in the day's chronological order; used to cycle colors. */
  index: number;
}

export interface TimelineRow {
  hour: number;
  events: TimelineEventPlacement[];
}

export interface Timeline {
  firstHour: number;
  lastHour: number;
  /** Start time of the first rendered row; used to position markers over the grid. */
  baseStart: Date;
  rows: TimelineRow[];
  empty: boolean;
}

const HOUR = 60 * 60 * 1000;

/** True when two timestamps fall on the same calendar date. */
function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/**
 * Build the row for the slot at `baseStart + slot * HOUR`. `slot` counts hours
 * from the first row; after wrapping past midnight it addresses the next day's
 * early-morning rows (e.g. slot 2 is 01:00 the following day).
 */
function buildRow(
  baseStart: Date,
  slot: number,
  sorted: ScheduleEntry[]
): TimelineRow {
  const rowStart = baseStart.getTime() + slot * HOUR;
  const rowEnd = rowStart + HOUR;

  const events: TimelineEventPlacement[] = [];
  for (let i = 0; i < sorted.length; i++) {
    const e = sorted[i];
    const overlapStart = Math.max(e.start.getTime(), rowStart);
    let overlapEnd = rowEnd;
    let open = false;
    if (e.end) {
      overlapEnd = Math.min(e.end.getTime(), rowEnd);
    } else {
      open = true;
    }
    if (overlapStart >= overlapEnd) continue;

    const left = (overlapStart - rowStart) / HOUR;
    const width = (overlapEnd - overlapStart) / HOUR;
    events.push({
      uuid: e.uuid,
      content: e.content,
      start: e.start,
      end: e.end,
      open,
      left,
      width,
      index: i,
    });
  }
  events.sort((a, b) => a.left - b.left);
  return { hour: new Date(rowStart).getHours(), events };
}

/**
 * Lay out a single day's schedule as a series of hourly rows. Each hour is a
 * horizontal track; an event that falls within that hour is rendered as a
 * horizontal bar positioned by `left`/`width` (fractions of the row width),
 * proportional to the minutes within the hour. An event with no end time
 * (open) extends to the end of its row and is flagged for styling.
 *
 * A day does not end at 24:00: when the last activity crosses midnight, the
 * rows continue into the next day's early morning, tolerating up to 03:00.
 */
export function buildTimeline(entries: ScheduleEntry[]): Timeline {
  if (entries.length === 0) {
    return {
      firstHour: 0,
      lastHour: 0,
      baseStart: new Date(0),
      rows: [],
      empty: true,
    };
  }

  const sorted = [...entries].sort(
    (a, b) => a.start.getTime() - b.start.getTime()
  );

  const firstStart = sorted[0].start;
  const firstHour = firstStart.getHours();

  let lastEnd = sorted[0].end ?? sorted[0].start;
  for (const e of sorted) {
    const end = e.end ?? e.start;
    if (end.getTime() > lastEnd.getTime()) lastEnd = end;
  }

  const endsSameDay = sameDay(lastEnd, firstStart);
  let lastHour: number;
  if (endsSameDay) {
    lastHour = Math.max(lastEnd.getHours(), firstHour);
  } else {
    lastHour = Math.min(lastEnd.getHours(), 3);
  }

  const baseStart = new Date(
    firstStart.getFullYear(),
    firstStart.getMonth(),
    firstStart.getDate(),
    firstHour,
    0,
    0,
    0
  );

  const rows: TimelineRow[] = [];
  if (endsSameDay) {
    for (let h = firstHour; h <= lastHour; h++) {
      rows.push(buildRow(baseStart, h - firstHour, sorted));
    }
  } else {
    for (let h = firstHour; h < 24; h++) {
      rows.push(buildRow(baseStart, h - firstHour, sorted));
    }
    for (let h = 0; h <= lastHour; h++) {
      rows.push(buildRow(baseStart, 24 - firstHour + h, sorted));
    }
  }

  return { firstHour, lastHour, baseStart, rows, empty: false };
}