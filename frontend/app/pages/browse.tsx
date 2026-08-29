import { useSearchParams } from "react-router";
import { getColors, getDatesWithData, getDiary, getRecordsByDate } from "~/services/api";
import type { RecordRow } from "~/types/api";
import { buildSchedule, type CsvRow } from "~/libs/schedule";
import { useAsync } from "~/hooks/useAsync";
import { todayLocal } from "~/utils/date";
import Calendar from "~/components/Calendar";
import Timeline from "~/components/Timeline";
import Diary from "~/components/Diary";

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

export default function BrowsePage() {
  const [searchParams] = useSearchParams();
  const raw = searchParams.get("date");
  const selected = raw && DATE_RE.test(raw) ? raw : todayLocal();
  const today = todayLocal();

  const { data, loading } = useAsync(async () => {
    const [dates, colors, rows, diary] = await Promise.all([
      getDatesWithData(),
      getColors(),
      getRecordsByDate(selected, true),
      getDiary(selected),
    ]);
    return {
      dates,
      categoryColors: Object.fromEntries(colors.map((c) => [c.name, c.color])),
      rows: rows.rows,
      diary: diary.content,
    };
  }, [selected]);

  const datesWithData = data?.dates ?? [];
  const categoryColors = data?.categoryColors ?? {};
  const dayRows = data?.rows ?? [];
  const diaryContent = data?.diary ?? "";

  const entries = buildSchedule(toCsvRows(dayRows));

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-8">
      <h1 className="text-2xl font-semibold">按日期浏览数据</h1>
      <Calendar datesWithData={datesWithData} today={today} selected={selected} />
      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-medium">{selected}</h2>
        {loading ? (
          <p className="text-sm text-zinc-400">加载中…</p>
        ) : entries.length === 0 ? (
          <p className="text-sm text-zinc-400">当天暂无记录</p>
        ) : (
          <Timeline entries={entries} categoryColors={categoryColors} />
        )}
      </div>
      {!loading && <Diary date={selected} initialContent={diaryContent} />}
    </div>
  );
}