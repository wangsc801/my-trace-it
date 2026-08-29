import { buildDaySchedule, type CsvRow, type DayActivity } from "./schedule";

export interface EventDetail {
  start: string;
  end: string;
  duration_min: number;
  duration_human: string;
  detail: string;
}

export interface ActivityBreakdown {
  name: string;
  total_minutes: number;
  total_human: string;
  event_count: number;
  events: EventDetail[];
}

export interface DayAnalysis {
  date: string;
  total_events: number;
  total_minutes: number;
  total_human: string;
  gap_minutes: number;
  gap_human: string;
  activity_breakdown: ActivityBreakdown[];
}

export interface BreakdownDiffItem {
  name: string;
  today_total_minutes: number;
  today_total_human: string;
  yesterday_total_minutes: number;
  yesterday_total_human: string;
}

export interface CompareData {
  today: DayAnalysis;
  yesterday: DayAnalysis;
  diff: {
    total_events: number;
    total_minutes: number;
    total_human: string;
    gap_minutes: number;
    gap_human: string;
  };
  activity_breakdown_diff: BreakdownDiffItem[];
}

export function fmtMinutes(minutes: number): string {
  const sign = minutes < 0 ? "-" : "";
  const m = Math.abs(minutes);
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return `${sign}${h} h ${String(rem).padStart(2, "0")} m`;
}

function parseTime(timeStr: string | null | undefined): number | null {
  if (typeof timeStr !== "string" || !timeStr.includes(":")) return null;
  const [hStr, mStr] = timeStr.split(":");
  const h = Number(hStr);
  const m = Number(mStr);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

interface AnalyzeInput {
  date: string;
  events: DayActivity[];
}

export function analyzeSingleDay(data: AnalyzeInput): DayAnalysis {
  const dateStr = data.date;
  const valid: { evt: DayActivity; startMin: number; endMin: number }[] = [];

  for (const evt of data.events) {
    const startMin = parseTime(evt.start);
    const endMin = parseTime(evt.end);
    if (startMin === null || endMin === null || endMin <= startMin) continue;
    valid.push({ evt, startMin, endMin });
  }

  if (valid.length === 0) {
    return {
      date: dateStr,
      total_events: 0,
      total_minutes: 0,
      total_human: fmtMinutes(0),
      gap_minutes: 0,
      gap_human: fmtMinutes(0),
      activity_breakdown: [],
    };
  }

  valid.sort((a, b) => a.startMin - b.startMin);

  let totalMinutes = 0;
  const activityMap = new Map<string, EventDetail[]>();

  for (const { evt, startMin, endMin } of valid) {
    const duration = Math.max(0, endMin - startMin);
    totalMinutes += duration;

    const entry: EventDetail = {
      start: evt.start,
      end: evt.end!,
      duration_min: duration,
      duration_human: fmtMinutes(duration),
      detail: evt.detail ?? "",
    };

    const list = activityMap.get(evt.name) ?? [];
    list.push(entry);
    activityMap.set(evt.name, list);
  }

  const firstStart = valid[0].startMin;
  const lastEnd = valid[valid.length - 1].endMin;
  const totalSpan = Math.max(0, lastEnd - firstStart);
  const gapMinutes = Math.max(0, totalSpan - totalMinutes);

  const activityBreakdown: ActivityBreakdown[] = [...activityMap.entries()].map(
    ([name, subEvents]) => {
      const actTotal = subEvents.reduce((s, e) => s + e.duration_min, 0);
      const sorted = [...subEvents].sort(
        (a, b) => b.duration_min - a.duration_min
      );
      return {
        name,
        total_minutes: actTotal,
        total_human: fmtMinutes(actTotal),
        event_count: sorted.length,
        events: sorted,
      };
    }
  );
  activityBreakdown.sort((a, b) => b.total_minutes - a.total_minutes);

  return {
    date: dateStr,
    total_events: valid.length,
    total_minutes: totalMinutes,
    total_human: fmtMinutes(totalMinutes),
    gap_minutes: gapMinutes,
    gap_human: fmtMinutes(gapMinutes),
    activity_breakdown: activityBreakdown,
  };
}

export function generateCompareData(
  today: AnalyzeInput,
  yesterday: AnalyzeInput
): CompareData {
  const todayAnalysis = analyzeSingleDay(today);
  const yesterdayAnalysis = analyzeSingleDay(yesterday);

  const diffEvents =
    todayAnalysis.total_events - yesterdayAnalysis.total_events;
  const diffTotal =
    todayAnalysis.total_minutes - yesterdayAnalysis.total_minutes;
  const diffGap = todayAnalysis.gap_minutes - yesterdayAnalysis.gap_minutes;

  const todayMap = new Map(
    todayAnalysis.activity_breakdown.map((a) => [a.name, a])
  );
  const yesterdayMap = new Map(
    yesterdayAnalysis.activity_breakdown.map((a) => [a.name, a])
  );
  const allNames = new Set([...todayMap.keys(), ...yesterdayMap.keys()]);

  const breakdownDiff: BreakdownDiffItem[] = [...allNames].map((name) => {
    const t = todayMap.get(name);
    const y = yesterdayMap.get(name);
    const tMin = t?.total_minutes ?? 0;
    const yMin = y?.total_minutes ?? 0;
    return {
      name,
      today_total_minutes: tMin,
      today_total_human: fmtMinutes(tMin),
      yesterday_total_minutes: yMin,
      yesterday_total_human: fmtMinutes(yMin),
    };
  });
  breakdownDiff.sort(
    (a, b) =>
      b.today_total_minutes +
      b.yesterday_total_minutes -
      (a.today_total_minutes + a.yesterday_total_minutes)
  );

  return {
    today: todayAnalysis,
    yesterday: yesterdayAnalysis,
    diff: {
      total_events: diffEvents,
      total_minutes: diffTotal,
      total_human: fmtMinutes(diffTotal),
      gap_minutes: diffGap,
      gap_human: fmtMinutes(diffGap),
    },
    activity_breakdown_diff: breakdownDiff,
  };
}

export function toAnalyzeInput(
  dateStr: string,
  dayRows: CsvRow[]
): AnalyzeInput {
  const { events } = buildDaySchedule(dayRows);
  return { date: dateStr, events };
}