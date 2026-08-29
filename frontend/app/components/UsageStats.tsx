import { colorKey, type ScheduleEntry } from "~/libs/schedule";

function formatDuration(mins: number): string {
  if (mins < 60) return `${mins} 分钟`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h} 小时` : `${h}小时${m}分钟`;
}

export default function UsageStats({ entries }: { entries: ScheduleEntry[] }) {
  const statMap = new Map<string, number>();
  for (const e of entries) {
    if (!e.end) continue;
    const mins = (e.end.getTime() - e.start.getTime()) / 60000;
    const key = colorKey(e.content);
    statMap.set(key, (statMap.get(key) ?? 0) + mins);
  }

  const statRows = [...statMap.entries()]
    .map(([key, mins]) => ({ key, mins: Math.round(mins) }))
    .sort((a, b) => b.mins - a.mins);

  // Total unrecorded time between the first event's start and the last
  // event's end, i.e. the sum of gaps between consecutive recorded events.
  const sorted = [...entries].sort(
    (a, b) => a.start.getTime() - b.start.getTime()
  );
  let idleMs = 0;
  for (let i = 0; i < sorted.length - 1; i++) {
    const cur = sorted[i];
    if (!cur.end) continue;
    idleMs += sorted[i + 1].start.getTime() - cur.end.getTime();
  }
  const idleMins = Math.round(idleMs / 60000);

  if (statRows.length === 0) return null;

  return (
    <div className="mt-6 max-w-md min-w-1/3 mx-auto">
      <h2 className="mb-2 text-sm font-medium text-center">用时统计</h2>
      <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
        {statRows.map((r) => (
          <li
            key={r.key}
            className="flex items-center justify-between px-4 py-2 text-sm"
          >
            <span className="font-medium">{r.key}</span>
            <span className="tabular-nums text-zinc-500">
              {formatDuration(r.mins)}
            </span>
          </li>
        ))}
      </ul>
      {idleMins > 0 && (
        <p className="mt-3 text-center text-sm text-zinc-500">
          空闲时间：{formatDuration(idleMins)}
        </p>
      )}
    </div>
  );
}