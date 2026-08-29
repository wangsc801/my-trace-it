import { useState } from "react";
import { useNavigate } from "react-router";

const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];

const pad = (n: number) => String(n).padStart(2, "0");

export default function Calendar({
  datesWithData,
  today,
  selected,
  onSelectDate,
}: {
  datesWithData: string[];
  today: string;
  selected: string;
  onSelectDate?: (date: string) => void;
}) {
  const navigate = useNavigate();
  const withData = new Set(datesWithData);

  const [view, setView] = useState(() => {
    const d = new Date(`${selected}T00:00:00`);
    return { y: d.getFullYear(), m: d.getMonth() };
  });

  const first = new Date(view.y, view.m, 1);
  const startOffset = first.getDay();
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const dateStr = (d: number) => `${view.y}-${pad(view.m + 1)}-${pad(d)}`;
  const monthLabel = `${view.y}年${view.m + 1}月`;

  return (
    <div className="mx-auto w-full max-w-sm rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
      <div className="mb-3 flex items-center justify-between">
        <button
          onClick={() => setView((v) => ({ ...v, m: v.m - 1 }))}
          className="rounded px-2 py-1 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          aria-label="上个月"
        >
          ‹
        </button>
        <span className="font-medium">{monthLabel}</span>
        <button
          onClick={() => setView((v) => ({ ...v, m: v.m + 1 }))}
          className="rounded px-2 py-1 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          aria-label="下个月"
        >
          ›
        </button>
      </div>

      <div className="mb-1 grid grid-cols-7 text-center text-xs text-zinc-400">
        {WEEKDAYS.map((w) => (
          <div key={w}>{w}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-sm">
        {cells.map((d, i) =>
          d === null ? (
            <div key={i} />
          ) : (
            <button
              key={i}
              onClick={() => {
                const ds = dateStr(d);
                if (onSelectDate) onSelectDate(ds);
                else navigate(`/browse?date=${ds}`);
              }}
              className={`flex h-8 items-center justify-center rounded-full transition-colors ${
                dateStr(d) === selected
                  ? "bg-zinc-900 font-semibold text-white dark:bg-white dark:text-black"
                  : withData.has(dateStr(d))
                    ? "bg-emerald-100 font-semibold text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200"
                    : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
              } ${
                dateStr(d) === today && dateStr(d) !== selected
                  ? "ring-1 ring-zinc-400 dark:ring-zinc-500"
                  : ""
              }`}
            >
              {d}
            </button>
          )
        )}
      </div>
    </div>
  );
}