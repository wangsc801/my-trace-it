import { useSearchParams } from "react-router";
import { getDatesWithData, getRecordsByDate } from "~/services/api";
import type { RecordRow } from "~/types/api";
import type { CsvRow } from "~/libs/schedule";
import {
  type CompareData,
  fmtMinutes,
  generateCompareData,
  toAnalyzeInput,
} from "~/libs/report";
import { useAsync } from "~/hooks/useAsync";
import { todayLocal } from "~/utils/date";
import MetricHelp from "~/components/shared/MetricHelp";
import DateComparePicker from "~/components/DateComparePicker";

function yesterdayOf(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function toCsvRows(rows: RecordRow[]): CsvRow[] {
  return rows.map((r) => ({
    createdAt: r.createdAt,
    content: r.content,
    amountFormatted: r.amountFormatted ?? "",
    amount: r.amount != null ? String(r.amount) : "",
    amountUnit: r.amountUnit ?? "NONE",
    uuid: r.uuid,
  }));
}

type DiffCat = "positive" | "negative" | "neutral";

function diffClass(val: number): DiffCat {
  if (val > 0) return "positive";
  if (val < 0) return "negative";
  return "neutral";
}

function diffSign(val: number): string {
  return val > 0 ? `+${val}` : String(val);
}

// 常规语义：增长=绿，下降=红（用于累计时长）
function diffBadgeClass(cat: DiffCat): string {
  if (cat === "positive")
    return "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300";
  if (cat === "negative")
    return "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300";
  return "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400";
}

// 反转语义：下降=绿（好），增长=红（差）——用于日程总数、间隔时间
function diffBadgeInvertedClass(cat: DiffCat): string {
  if (cat === "negative")
    return "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300";
  if (cat === "positive")
    return "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300";
  return "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400";
}

function diffColorClass(cat: DiffCat): string {
  if (cat === "positive") return "text-emerald-600 dark:text-emerald-400";
  if (cat === "negative") return "text-red-600 dark:text-red-400";
  return "text-zinc-500 dark:text-zinc-400";
}

// 荧光笔效果：仅 A 有 / 仅 B 有的活动
function highlightAOnly(aMin: number, bMin: number) {
  return bMin === 0 && aMin > 0;
}
function highlightBOnly(aMin: number, bMin: number) {
  return aMin === 0 && bMin > 0;
}

// 给日期加"今日/昨日"标注（如果确实是的话），自定义日期返回空
function roleLabel(date: string, today: string, yesterday: string): string {
  if (date === today) return "（今日）";
  if (date === yesterday) return "（昨日）";
  return "";
}

export default function ReportPage() {
  const [searchParams] = useSearchParams();
  const todayStr = todayLocal();
  const yesterdayStr = yesterdayOf(todayStr);

  // 从 URL 读取 a/b 参数，校验格式后使用，否则回退到默认
  const rawA = searchParams.get("a") ?? "";
  const rawB = searchParams.get("b") ?? "";
  const useA = rawA && DATE_RE.test(rawA) ? rawA : todayStr;
  const useB = rawB && DATE_RE.test(rawB) ? rawB : yesterdayStr;
  const isCustom = !(useA === todayStr && useB === yesterdayStr);

  const { data: dayData, loading } = useAsync(async () => {
    // 日期 A 包含次日凌晨，日期 B 不包含——保持原 today/yesterday 语义
    const [dates, a, b] = await Promise.all([
      getDatesWithData(),
      getRecordsByDate(useA, true),
      getRecordsByDate(useB, false),
    ]);
    return { dates, aRows: a.rows, bRows: b.rows };
  }, [useA, useB]);

  const datesWithData = dayData?.dates ?? [];
  const aRows = dayData?.aRows ?? [];
  const bRows = dayData?.bRows ?? [];

  if (loading) {
    return (
      <div className="min-h-full bg-zinc-50 dark:bg-zinc-950">
        <div className="mx-auto w-full max-w-6xl px-4 py-8">
          <p className="text-sm text-zinc-500">加载中…</p>
        </div>
      </div>
    );
  }

  const aRowsCsv = toCsvRows(aRows);
  const bRowsCsv = toCsvRows(bRows);

  if (aRowsCsv.length === 0 && bRowsCsv.length === 0) {
    return (
      <div className="min-h-full bg-zinc-50 dark:bg-zinc-950">
        <div className="mx-auto w-full max-w-6xl px-4 py-8">
          <DateComparePicker
            dateA={useA}
            dateB={useB}
            datesWithData={datesWithData}
            isCustom={isCustom}
          />
          <div className="mx-auto w-full max-w-3xl">
            <h1 className="mb-2 text-2xl font-bold text-zinc-900 dark:text-zinc-100">日程对比分析报告</h1>
            <p className="text-sm text-zinc-500">
              所选两天均无数据，无法生成分析报告。
            </p>
          </div>
        </div>
      </div>
    );
  }

  const compare: CompareData = generateCompareData(
    toAnalyzeInput(useA, aRowsCsv),
    toAnalyzeInput(useB, bRowsCsv)
  );

  const { today, yesterday, diff, activity_breakdown_diff: bd } = compare;
  const labelA = roleLabel(today.date, todayStr, yesterdayStr);
  const labelB = roleLabel(yesterday.date, todayStr, yesterdayStr);

  return (
    <div className="min-h-full bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto w-full max-w-6xl px-4 py-8">
        {/* 顶部对比日期选择器（胶囊 toggle + 双 Calendar collapse） */}
        <DateComparePicker
          dateA={useA}
          dateB={useB}
          datesWithData={datesWithData}
          isCustom={isCustom}
        />

        {/* Header */}
        <div className="mb-6 border-b border-zinc-200 pb-6 text-center dark:border-zinc-800">
          <h1 className="mb-1 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            日程对比分析报告
          </h1>
          <p className="mb-3 text-sm text-zinc-500">每日活动时长对比</p>
          <div className="flex flex-wrap justify-center gap-3">
            <span className="rounded-full border border-cyan-400/40 bg-cyan-50 px-4 py-1 text-sm font-medium text-cyan-700 dark:bg-cyan-950/50 dark:text-cyan-300">
              日期A：{today.date}{labelA}
            </span>
            <span className="rounded-full border border-violet-400/40 bg-violet-50 px-4 py-1 text-sm font-medium text-violet-700 dark:bg-violet-950/50 dark:text-violet-300">
              日期B：{yesterday.date}{labelB}
            </span>
          </div>
        </div>

        {/* 核心指标 */}
        <section className="mb-8">
          <h2 className="mb-3 border-l-4 border-cyan-500 pl-3 text-lg font-bold text-zinc-900 dark:text-zinc-100">
            核心指标
          </h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">

            {/* 累计时长 */}
            <div className="flex flex-col rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="text-sm font-medium text-zinc-500">
                累计时长
              </div>
              <div className="flex flex-1 flex-col items-center justify-center gap-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-cyan-600 dark:text-cyan-400">
                    {today.total_human}
                  </span>
                  <span className="text-zinc-400">vs</span>
                  <span className="text-3xl font-bold text-violet-600 dark:text-violet-400">
                    {yesterday.total_human}
                  </span>
                </div>
                <div className="text-xs text-zinc-500">
                  {today.date} {today.total_minutes} min | {yesterday.date} {yesterday.total_minutes} min
                </div>
                <span
                  className={`inline-block rounded-full px-3 py-1 text-sm font-bold ${diffBadgeClass(
                    diffClass(diff.total_minutes)
                  )}`}
                >
                  {diff.total_human}{" "}
                  <span className="opacity-70">({diffSign(diff.total_minutes)} min)</span>
                </span>
              </div>
            </div>

            {/* 日程总数 */}
            <div className="flex flex-col rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="text-sm font-medium text-zinc-500">
                日程总数
                <MetricHelp label="日程总数">
                  日程总数越少，代表杂务越少，当日主题集中，事务连贯性较好。
                  <br />
                  反之总数偏多可能意味着频繁切换、注意力分散。
                </MetricHelp>
              </div>
              <div className="flex flex-1 flex-col items-center justify-center gap-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-cyan-600 dark:text-cyan-400">
                    {today.total_events}
                  </span>
                  <span className="text-zinc-400">vs</span>
                  <span className="text-3xl font-bold text-violet-600 dark:text-violet-400">
                    {yesterday.total_events}
                  </span>
                </div>
                <span
                  className={`inline-block rounded-full px-3 py-1 text-sm font-bold ${diffBadgeInvertedClass(
                    diffClass(diff.total_events)
                  )}`}
                >
                  {diffSign(diff.total_events)}
                </span>
              </div>
            </div>

            {/* 间隔时间 */}
            <div className="flex flex-col rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="text-sm font-medium text-zinc-500">
                间隔时间
                <MetricHelp label="间隔时间">
                  间隔时间越少，代表未被记录的时间越少，说明日程记录覆盖面广、时间利用率高。
                  <br />
                  间隔偏多则可能有较多空闲或遗漏记录的时段。
                </MetricHelp>
              </div>
              <div className="flex flex-1 flex-col items-center justify-center gap-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-cyan-600 dark:text-cyan-400">
                    {today.gap_human}
                  </span>
                  <span className="text-zinc-400">vs</span>
                  <span className="text-3xl font-bold text-violet-600 dark:text-violet-400">
                    {yesterday.gap_human}
                  </span>
                </div>
                <div className="text-xs text-zinc-500">
                  {today.date} {today.gap_minutes} min | {yesterday.date} {yesterday.gap_minutes} min
                </div>
                <span
                  className={`inline-block rounded-full px-3 py-1 text-sm font-bold ${diffBadgeInvertedClass(
                    diffClass(diff.gap_minutes)
                  )}`}
                >
                  {diff.gap_human}{" "}
                  <span className="opacity-70">({diffSign(diff.gap_minutes)} min)</span>
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* 活动对比明细 */}
        <section className="mb-8">
          <h2 className="mb-3 border-l-4 border-cyan-500 pl-3 text-lg font-bold text-zinc-900 dark:text-zinc-100">
            活动对比明细
          </h2>
          <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <table className="w-full">
              <thead className="bg-zinc-100/80 dark:bg-zinc-800/60">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-zinc-500">
                    活动
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-cyan-600 dark:text-cyan-400">
                    日期A · {today.date}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-violet-600 dark:text-violet-400">
                    日期B · {yesterday.date}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-zinc-500">
                    变化
                  </th>
                </tr>
              </thead>
              <tbody>
                {bd.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-6 text-center text-sm text-zinc-400"
                    >
                      暂无数据
                    </td>
                  </tr>
                ) : (
                  bd.map((item, idx) => {
                    const d =
                      item.today_total_minutes - item.yesterday_total_minutes;
                    const cls = diffClass(d);
                    const aOnly = highlightAOnly(
                      item.today_total_minutes,
                      item.yesterday_total_minutes
                    );
                    const bOnly = highlightBOnly(
                      item.today_total_minutes,
                      item.yesterday_total_minutes
                    );
                    return (
                      <tr
                        key={item.name}
                        className={`border-t border-zinc-100 dark:border-zinc-800 ${idx % 2 === 0
                          ? "bg-zinc-50/50 dark:bg-zinc-900/30"
                          : "bg-white dark:bg-zinc-900"
                          }`}
                      >
                        <td className="px-4 py-2.5 text-sm font-bold text-zinc-900 dark:text-zinc-100">
                          {item.name}
                        </td>
                        <td className="px-4 py-2.5 text-sm font-semibold text-cyan-600 dark:text-cyan-400">
                          <span
                            className={
                              aOnly
                                ? "rounded px-2 py-1 bg-red-200/70 dark:bg-red-900/40"
                                : ""
                            }
                          >
                            {item.today_total_human}
                          </span>{" "}
                          <span className="text-xs opacity-70">
                            ({item.today_total_minutes} min)
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-sm font-semibold text-violet-600 dark:text-violet-400">
                          <span
                            className={
                              bOnly
                                ? "rounded px-2 py-1 bg-red-200/70 dark:bg-red-900/40"
                                : ""
                            }
                          >
                            {item.yesterday_total_human}
                          </span>{" "}
                          <span className="text-xs opacity-70">
                            ({item.yesterday_total_minutes} min)
                          </span>
                        </td>
                        <td
                          className={`px-4 py-2.5 text-sm font-bold ${diffColorClass(
                            cls
                          )}`}
                        >
                          {fmtMinutes(d)}{" "}
                          <span className="text-xs opacity-70">
                            ({diffSign(d)} min)
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* 每日活动详情 */}
        <section className="mb-8">
          <h2 className="mb-3 border-l-4 border-cyan-500 pl-3 text-lg font-bold text-zinc-900 dark:text-zinc-100">
            每日活动详情
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* 日期 A（今日角色 / 基准） */}
            <div className="rounded-lg border-t-4 border-t-cyan-500 border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <h3 className="mb-3 text-base font-bold text-cyan-700 dark:text-cyan-400">
                {today.date}{labelA} · 日期A（基准）
              </h3>
              {today.activity_breakdown.length === 0 ? (
                <p className="py-4 text-center text-sm text-zinc-400">暂无记录</p>
              ) : (
                <ul className="flex flex-col">
                  {today.activity_breakdown.map((act) => (
                    <li
                      key={act.name}
                      className="border-b border-zinc-100 py-2.5 last:border-b-0 dark:border-zinc-800"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold">{act.name}</span>
                        <span className="text-xs font-medium text-zinc-500">
                          {act.total_human}（{act.event_count} 项）
                        </span>
                      </div>
                      <ul className="mt-1.5 flex flex-col gap-1 pl-2 text-xs text-zinc-500">
                        {act.events.map((evt, i) => (
                          <li key={i} className="flex flex-wrap items-center gap-2">
                            <span className="font-mono font-medium text-zinc-700 dark:text-zinc-300">
                              {evt.start}~{evt.end}
                            </span>
                            <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                              {evt.duration_human}
                            </span>
                            {evt.detail && (
                              <span className="text-zinc-400">{evt.detail}</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* 日期 B（昨日角色 / 参照） */}
            <div className="rounded-lg border-t-4 border-t-violet-500 border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <h3 className="mb-3 text-base font-bold text-violet-700 dark:text-violet-400">
                {yesterday.date}{labelB} · 日期B（参照）
              </h3>
              {yesterday.activity_breakdown.length === 0 ? (
                <p className="py-4 text-center text-sm text-zinc-400">暂无记录</p>
              ) : (
                <ul className="flex flex-col">
                  {yesterday.activity_breakdown.map((act) => (
                    <li
                      key={act.name}
                      className="border-b border-zinc-100 py-2.5 last:border-b-0 dark:border-zinc-800"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold">{act.name}</span>
                        <span className="text-xs font-medium text-zinc-500">
                          {act.total_human}（{act.event_count} 项）
                        </span>
                      </div>
                      <ul className="mt-1.5 flex flex-col gap-1 pl-2 text-xs text-zinc-500">
                        {act.events.map((evt, i) => (
                          <li key={i} className="flex flex-wrap items-center gap-2">
                            <span className="font-mono font-medium text-zinc-700 dark:text-zinc-300">
                              {evt.start}~{evt.end}
                            </span>
                            <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                              {evt.duration_human}
                            </span>
                            {evt.detail && (
                              <span className="text-zinc-400">{evt.detail}</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}