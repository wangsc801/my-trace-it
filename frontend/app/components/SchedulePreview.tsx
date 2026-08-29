import { useRef, useState } from "react";
import { toast } from "sonner";
import { Upload } from "lucide-react";
import { useNavigate } from "react-router";
import {
  buildSchedule,
  normalizeAmountUnit,
  parseCsv,
  type ScheduleEntry,
} from "~/libs/schedule";
import { saveSchedule } from "~/services/api";

function formatTime(d: Date | null): string {
  if (!d) return "";
  return d.toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

const SAMPLE = `createdAt,content,amountFormatted,amount,amountUnit,uuid
2026-08-09T07:21:55.795+08:00,完毕,,0.0,NONE,f970370a-2757-4e9c-b6c3-f83f0d10c44e
2026-08-09T07:09:10.062+08:00,洗澡,,0.0,NONE,c248a76b-c009-439b-a154-cc39efb1d5d9`;

export default function SchedulePreview() {
  const [csv, setCsv] = useState("");
  const [pending, setPending] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const navigate = useNavigate();

  async function handleFile(file: File) {
    const text = await file.text();
    setCsv(text);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void handleFile(file);
  }

  const rows = parseCsv(csv);
  const entries = buildSchedule(rows);

  async function handleSubmit() {
    if (pending || rows.length === 0) return;
    setPending(true);
    try {
      const res = await saveSchedule(normalizeAmountUnit(csv));
      if (res.ok) {
        toast.success(res.message || "保存成功");
        navigate("/browse");
      } else {
        toast.error(res.message || "保存失败");
      }
    } catch {
      toast.error("保存失败，请检查后端是否可用");
    } finally {
      setPending(false);
    }
  }

  const groups = entries
    .reduce<{ date: string; entries: ScheduleEntry[] }[]>(
      (acc, e) => {
        const last = acc[acc.length - 1];
        if (last && last.date === e.date) last.entries.push(e);
        else acc.push({ date: e.date, entries: [e] });
        return acc;
      },
      []
    )
    // Dates newest-first; events within each date stay chronological.
    .reverse();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">
          导入 Trace It CSV 文件
        </label>
        <div
          role="button"
          tabIndex={0}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed px-6 py-14 text-center transition-colors ${dragging
            ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20"
            : "border-zinc-300 hover:border-zinc-400 dark:border-zinc-700 dark:hover:border-zinc-600"
            }`}
        >
          <Upload size={30} className="text-zinc-400 dark:text-zinc-500" />
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            点击选择文件，或将文件拖到这里
          </span>
          <span className="text-xs text-zinc-400 dark:text-zinc-500">
            支持 .csv / text/csv
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => dialogRef.current?.showModal()}
            className="text-sm text-zinc-500 underline hover:text-zinc-800 dark:hover:text-zinc-200"
          >
            示例与说明
          </button>
          <span className="text-sm text-zinc-500">
            解析 {rows.length} 条
          </span>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
            e.target.value = "";
          }}
        />

        <dialog
          ref={dialogRef}
          className="m-auto w-full max-w-2xl rounded-xl border border-zinc-200 bg-white p-6 text-zinc-900 shadow-xl backdrop:bg-black/40 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        >
          <h2 className="mb-2 text-base font-semibold">示例与说明</h2>
          <p className="mb-4 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            点击选择或拖拽 Trace It 导出的 CSV 文件来导入数据。
            <br />
            每行一条记录，字段顺序为：createdAt, content, amountFormatted,
            amount, amountUnit, uuid。
            <br />
            content 为「完毕」或「结束」的记录表示上一条活动的结束时间，不会单独显示。
            <br />
            content 含空格时按第一个空格拆分为名称与详情，例如「英语 阅读」。
          </p>
          <pre className="max-h-64 overflow-auto rounded-lg bg-zinc-50 p-3 font-mono text-xs leading-5 dark:bg-zinc-800">
            {SAMPLE}
          </pre>
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="rounded-full border border-zinc-300 px-4 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              关闭
            </button>
          </div>
        </dialog>
      </div>

      <div className="flex flex-col gap-4">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={pending || rows.length === 0}
          className="w-fit rounded-full bg-zinc-900 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-40 dark:bg-white dark:text-black dark:hover:bg-zinc-300"
        >
          {pending ? "保存中…" : `保存到数据库（${rows.length} 条）`}
        </button>
      </div>

      {rows.length > 0 && (
        <div className="flex flex-col gap-4">
          <h2 className="text-sm font-medium">日程预览</h2>
          <div className="flex flex-col gap-6">
            {groups.map((g) => (
              <div key={g.date}>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                  {g.date}
                </h3>
                <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-700">
                  {g.entries.map((e) => (
                    <li
                      key={e.uuid}
                      className={`flex items-baseline justify-between px-4 py-2 text-sm ${e.end === null ? "text-red-600 dark:text-red-400" : ""
                        }`}
                    >
                      <span className="font-medium">{e.content}</span>
                      <span className="font-mono tabular-nums">
                        {formatTime(e.start)}
                        {e.end ? (
                          <>
                            <span className="mx-1 text-zinc-400">–</span>
                            {formatTime(e.end)}
                          </>
                        ) : (
                          <span className="ml-1 text-red-600 dark:text-red-400">
                            （无结束时间）
                          </span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}