import { useEffect, useState } from "react";
import { buildTimeline } from "~/libs/timeline";
import type { TimelineEventPlacement } from "~/libs/timeline";
import { colorKey, hasCategory, type ScheduleEntry } from "~/libs/schedule";
import UsageStats from "./UsageStats";

const ROW_H = 64;
const HOUR = 60 * 60 * 1000;
const MIN_SEG_MINUTES = 4;
const FULL_SEG_MINUTES = 9;

/** Fraction (0..1) of the current hour row that time `t` falls at. */
function xFrac(t: Date): number {
  const rowStart = new Date(
    t.getFullYear(),
    t.getMonth(),
    t.getDate(),
    t.getHours(),
    0,
    0,
    0
  );
  return (t.getTime() - rowStart.getTime()) / HOUR;
}

// const COLORS = [
//   "bg-emerald-100 dark:bg-emerald-900/40",
//   "bg-sky-100 dark:bg-sky-900/40",
//   "bg-amber-100 dark:bg-amber-900/40",
//   "bg-rose-100 dark:bg-rose-900/40",
//   "bg-violet-100 dark:bg-violet-900/40",
//   "bg-teal-100 dark:bg-teal-900/40",
//   "bg-orange-100 dark:bg-orange-900/40",
//   "bg-lime-100 dark:bg-lime-900/40",
// ];

const COLORS = [
  // 红色系
  "rgba(239, 68, 68, 0.18)",
  // 橙色系
  "rgba(249, 115, 22, 0.18)",
  // 琥珀色系
  "rgba(245, 158, 11, 0.18)",
  // 黄色系
  "rgba(234, 179, 8, 0.18)",
  // 青柠色系
  "rgba(132, 204, 22, 0.18)",
  // 绿色系
  "rgba(34, 197, 94, 0.18)",
  // 翠绿色系
  "rgba(16, 185, 129, 0.18)",
  // 蓝绿色系
  "rgba(20, 184, 166, 0.18)",
  // 青色系
  "rgba(6, 182, 212, 0.18)",
  // 天蓝色系
  "rgba(14, 165, 233, 0.18)",
  // 蓝色系
  "rgba(59, 130, 246, 0.18)",
  // 靛蓝色系
  "rgba(99, 102, 241, 0.18)",
  // 紫罗兰色系
  "rgba(139, 92, 246, 0.18)",
  // 紫色系
  "rgba(168, 85, 247, 0.18)",
  // 品红色系
  "rgba(217, 70, 239, 0.18)",
  // 粉色系
  "rgba(236, 72, 153, 0.18)",
  // 玫瑰色系
  "rgba(244, 63, 94, 0.18)",
];

function formatTime(d: Date): string {
  return d.toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/** True when a color is a user-configured solid hex (not a palette rgba). */
function isHexColor(value: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(value);
}

function timeRangeText(e: TimelineEventPlacement): string {
  if (e.open) return `${formatTime(e.start)} …`;
  return `${formatTime(e.start)}–${formatTime(e.end!)}`;
}

function durationText(e: TimelineEventPlacement): string {
  if (e.open) return "进行中";
  const mins = Math.round((e.end!.getTime() - e.start.getTime()) / 60000);
  return `${mins} 分钟`;
}

/**
 * Assign a color to each content key. Keys present in `categoryColors` (from the
 * DB) use their configured color; keys not in the DB fall back to the palette,
 * assigned in order of first appearance and prioritizing categorized content.
 */
function buildColorMap(
  events: { content: string }[],
  categoryColors: Record<string, string>
): Map<string, string> {
  const map = new Map<string, string>();
  let next = 0;
  for (const pass of ["categorized", "uncategorized"] as const) {
    for (const e of events) {
      const categorized = hasCategory(e.content);
      if (pass === "categorized" ? !categorized : categorized) continue;
      const key = colorKey(e.content);
      if (map.has(key)) continue;
      if (categoryColors[key] != null) {
        map.set(key, categoryColors[key]);
      } else {
        map.set(key, COLORS[next++ % COLORS.length]);
      }
    }
  }
  return map;
}

export default function Timeline({
  entries,
  categoryColors = {},
}: {
  entries: ScheduleEntry[];
  categoryColors?: Record<string, string>;
}) {
  const tl = buildTimeline(entries);
  const [selected, setSelected] = useState<TimelineEventPlacement | null>(null);

  useEffect(() => {
    if (!selected) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected]);

  if (tl.empty) {
    return <p className="text-sm text-zinc-500">这一天暂无记录。</p>;
  }

  const colorMap = buildColorMap(
    tl.rows.flatMap((r) => r.events),
    categoryColors
  );

  // Between adjacent blocks, show the idle minutes when the gap is >= 3 min.
  const sorted = [...entries].sort(
    (a, b) => a.start.getTime() - b.start.getTime()
  );
  // Gaps render inside their owning row to avoid cross-row drift.
  // Vertical (top) is fixed so labels line up neatly within a row;
  // horizontal (left) is derived from the gap's midpoint within the hour.
  const gapsBySlot = new Map<
    number,
    { key: string; minutes: number; left: number }[]
  >();
  for (let i = 0; i < sorted.length - 1; i++) {
    const cur = sorted[i];
    const next = sorted[i + 1];
    if (!cur.end) continue;
    const minutes = Math.floor(
      (next.start.getTime() - cur.end.getTime()) / 60000
    );
    if (minutes < 3) continue;
    const center = new Date((cur.end.getTime() + next.start.getTime()) / 2);
    const slot = Math.floor(
      (center.getTime() - tl.baseStart.getTime()) / HOUR
    );
    const arr = gapsBySlot.get(slot) ?? [];
    arr.push({
      key: `${cur.uuid}-${next.uuid}`,
      minutes,
      left: xFrac(center) * 100,
    });
    gapsBySlot.set(slot, arr);
  }

  return (
    <>
      <div className="flex gap-2">
        <div className="w-12 shrink-0">
          {tl.rows.map((row) => (
            <div
              key={row.hour}
              className="flex items-center justify-end pr-2 text-xs tabular-nums text-zinc-400"
              style={{ height: ROW_H }}
            >
              {row.hour}:00
            </div>
          ))}
        </div>

        <div className="relative flex-1 overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
          {tl.rows.map((row, slot) => (
            <div
              key={row.hour}
              className="relative border-b border-zinc-200 last:border-b-0 dark:border-zinc-800"
              style={{ height: ROW_H }}
            >
              {row.events.map((e) => {
                // An open event has no end; treat it as always showing full info.
                const segMins = e.open ? Infinity : Math.round(e.width * 60);
                const showTime = e.open || segMins >= FULL_SEG_MINUTES;
                const showContent = e.open || segMins >= MIN_SEG_MINUTES;
                const baseColor = colorMap.get(colorKey(e.content)) ?? "";
                // Option A: user-configured solid hex → translucent wash over the
                // theme surface (so light/dark both adapt) + a solid left accent.
                const userWash = isHexColor(baseColor)
                  ? {
                      backgroundColor: `color-mix(in srgb, ${baseColor} 26%, transparent)`,
                      borderLeft: `3px solid ${baseColor}`,
                    }
                  : { backgroundColor: baseColor };
                return (
                  <div
                    key={e.uuid}
                    onClick={(ev) => {
                      ev.stopPropagation();
                      setSelected(e);
                    }}
                    className={`absolute top-1 bottom-1 flex cursor-pointer flex-col justify-center overflow-hidden rounded-lg px-2 text-xs ${
                      selected === e ? "ring-2 ring-zinc-900 dark:ring-zinc-100" : ""
                    }`}
                    style={{
                      left: `${e.left * 100}%`,
                      width: `${e.width * 100}%`,
                      ...userWash,
                    }}
                  >
                    {showContent && (
                      <div className="truncate font-medium">{e.content}</div>
                    )}
                    {showTime && (
                      <div
                        className={`truncate tabular-nums ${
                          e.open ? "text-red-600 dark:text-red-400" : "opacity-80"
                        }`}
                      >
                        {formatTime(e.start)}
                        {e.open
                          ? " …"
                          : `–${formatTime(e.end!)} (${Math.round(
                              (e.end!.getTime() - e.start.getTime()) / 60000
                            )})`}
                      </div>
                    )}
                  </div>
                );
              })}
              {(gapsBySlot.get(slot) ?? []).map((g) => (
                <div
                  key={g.key}
                  className="pointer-events-none absolute z-10 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded bg-zinc-100/80 px-1.5 py-0.5 text-[11px] tabular-nums leading-none text-zinc-500 dark:bg-zinc-800/80 dark:text-zinc-400"
                  style={{ left: `${g.left}%` }}
                >
                  {g.minutes}
                </div>
              ))}
            </div>
          ))}
        </div>

        {selected && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            onClick={() => setSelected(null)}
          >
            <div
              className="w-full max-w-md rounded-xl bg-white p-6 text-zinc-900 shadow-xl dark:bg-zinc-900 dark:text-zinc-100"
              onClick={(ev) => ev.stopPropagation()}
            >
              <div className="mb-4 flex items-start justify-between gap-4">
                <h3 className="text-xl font-semibold">{selected.content}</h3>
                <button
                  onClick={() => setSelected(null)}
                  aria-label="关闭"
                  className="rounded-full px-2 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                >
                  ✕
                </button>
              </div>
              <div className="flex flex-col gap-3 text-base">
                <div className="flex items-center gap-3">
                  <span className="w-10 shrink-0 text-zinc-400">时间</span>
                  <span className="font-bold tabular-nums">{timeRangeText(selected)}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-10 shrink-0 text-zinc-400">用时</span>
                  <span>{durationText(selected)}</span>
                </div>
                {hasCategory(selected.content) && (
                  <div className="flex items-center gap-3">
                    <span className="w-10 shrink-0 text-zinc-400">类别</span>
                    <span>{selected.content.slice(0, selected.content.indexOf(" "))}</span>
                  </div>
                )}
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setSelected(null)}
                  className="rounded-full bg-zinc-900 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-white dark:text-black dark:hover:bg-zinc-300"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <UsageStats entries={entries} />
    </>
  );
}