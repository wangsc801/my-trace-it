import { useNavigate } from "react-router";
import { useState } from "react";
import { ChevronDown, ChevronUp, X } from "lucide-react";
import Calendar from "./Calendar";

function todayLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

function yesterdayOf(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

export default function DateComparePicker({
  dateA,
  dateB,
  datesWithData,
  isCustom,
}: {
  dateA: string;
  dateB: string;
  datesWithData: string[];
  isCustom: boolean;
}) {
  const navigate = useNavigate();
  const today = todayLocal();
  const [expanded, setExpanded] = useState(false);
  const [localA, setLocalA] = useState(dateA);
  const [localB, setLocalB] = useState(dateB);

  const apply = (a: string, b: string) => {
    const t = todayLocal();
    const y = yesterdayOf(t);
    // 如果等于默认值就不传 query，保持 URL 干净
    if (a === t && b === y) {
      navigate("/report");
    } else {
      navigate(`/report?a=${a}&b=${b}`);
    }
  };

  const handleClear = () => {
    setExpanded(false);
    const t = todayLocal();
    const y = yesterdayOf(t);
    setLocalA(t);
    setLocalB(y);
    navigate("/report");
  };

  const handleToggle = () => {
    if (!expanded) {
      // 展开时同步本地状态（应对 URL 已在外部变化的情况）
      setLocalA(dateA);
      setLocalB(dateB);
    }
    setExpanded((v) => !v);
  };

  const summary = isCustom
    ? `自定义对比：${dateA}  vs  ${dateB}`
    : `默认对比：今日（${dateA}） vs 昨日（${dateB}）`;

  return (
    <div className="mb-6 flex flex-col items-center justify-center">
      {/* 胶囊 Toggle 按钮 */}
      <button
        onClick={handleToggle}
        className={`group inline-flex items-center gap-2 rounded-full border px-5 py-2 text-sm font-medium shadow-sm transition-all hover:shadow-md ${
          isCustom
            ? "border-cyan-400/40 bg-linear-gradient-to-r from-cyan-50 to-violet-50 text-cyan-700 dark:from-cyan-950/40 dark:to-violet-950/40 dark:text-cyan-300"
            : "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
        }`}
      >
        <span className="truncate max-w-[70vw]">{summary}</span>
        {expanded ? (
          <ChevronUp className="h-4 w-4 shrink-0 opacity-70" />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0 opacity-70" />
        )}
      </button>

      {/* Collapse 区域：双 Calendar + 清除按钮 */}
      {expanded && (
        <div className="mt-4 w-full animate-[fadeIn_0.2s_ease-out]">
          <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2 md:max-w-2xl md:mx-auto">
            {/* 日期 A（今日角色） */}
            <div className="flex flex-col items-center gap-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/40 bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300">
                日期 A · 对比基准
              </div>
              <Calendar
                datesWithData={datesWithData}
                today={today}
                selected={localA}
                onSelectDate={(d) => {
                  setLocalA(d);
                  apply(d, localB);
                }}
              />
            </div>
            {/* 日期 B（昨日角色） */}
            <div className="flex flex-col items-center gap-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-violet-400/40 bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700 dark:bg-violet-950/40 dark:text-violet-300">
                日期 B · 对比参照
              </div>
              <Calendar
                datesWithData={datesWithData}
                today={today}
                selected={localB}
                onSelectDate={(d) => {
                  setLocalB(d);
                  apply(localA, d);
                }}
              />
            </div>
          </div>

          {/* 清除按钮 */}
          <div className="mt-5 flex justify-center">
            <button
              onClick={handleClear}
              className="inline-flex items-center gap-1.5 rounded-full border border-zinc-300 bg-white px-4 py-1.5 text-sm font-medium text-zinc-600 shadow-sm transition-all hover:border-red-300 hover:bg-red-50 hover:text-red-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-red-800 dark:hover:bg-red-950/30 dark:hover:text-red-400"
            >
              <X className="h-3.5 w-3.5" />
              清除 · 恢复今日 vs 昨日
            </button>
          </div>
        </div>
      )}
    </div>
  );
}