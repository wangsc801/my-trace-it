import { useEffect, useRef, useState } from "react";
import { Check, Pencil, X } from "lucide-react";
import { getRecords, getRecordsByDate, updateContent } from "~/services/api";
import type { RecordRow } from "~/types/api";

const PAGE_SIZE = 30;

function formatTime(iso: string): string {
  return iso.slice(11, 16);
}

function formatEmptyDate(date: string): string {
  const parts = date.split("-");
  if (parts.length !== 3) return "暂无记录";
  const [y, m, d] = parts.map(Number);
  if (!y || !m || !d) return "暂无记录";
  return `${y}年${m}月${d}日 无记录`;
}

export default function ContentEditor() {
  // date === "" means the default list (all records, newest first, lazy-loaded).
  const [date, setDate] = useState("");
  const [rows, setRows] = useState<RecordRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [editingUuid, setEditingUuid] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");

  const offsetRef = useRef(0);
  const loadingRef = useRef(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  async function loadDefaultPage(reset: boolean) {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    try {
      const offset = reset ? 0 : offsetRef.current;
      const data = await getRecords({ offset, limit: PAGE_SIZE });
      const newRows: RecordRow[] = data.rows ?? [];
      setRows((prev) => (reset ? newRows : [...prev, ...newRows]));
      setHasMore(newRows.length === PAGE_SIZE);
      offsetRef.current = offset + newRows.length;
      setLoaded(true);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }

  async function loadDate(d: string) {
    setLoading(true);
    try {
      const data = await getRecordsByDate(d);
      setRows(data.rows ?? []);
      setHasMore(false);
      setLoaded(true);
    } finally {
      setLoading(false);
    }
  }

  function changeDate(value: string) {
    setDate(value);
    setEditingUuid(null);
    setError("");
    setLoaded(false);
    setRows([]);
    if (value) {
      loadDate(value);
    } else {
      offsetRef.current = 0;
      setHasMore(true);
      loadDefaultPage(true);
    }
  }

  useEffect(() => {
    loadDefaultPage(true);
  }, []);

  // Lazy loading applies only to the default (no-date) list.
  useEffect(() => {
    if (date) return;
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingRef.current) {
          loadDefaultPage(false);
        }
      },
      { rootMargin: "300px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [date, hasMore]);

  function startEdit(row: RecordRow) {
    setEditingUuid(row.uuid);
    setDraft(row.content);
    setError("");
  }

  function cancelEdit() {
    setEditingUuid(null);
    setError("");
  }

  async function confirmEdit() {
    if (!draft.trim()) {
      setError("内容不能为空");
      return;
    }
    const uuid = editingUuid;
    const res = await updateContent(uuid!, draft);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    setRows((prev) =>
      prev.map((r) => (r.uuid === uuid ? { ...r, content: draft.trim() } : r))
    );
    setEditingUuid(null);
    setError("");
  }

  const empty = loaded && !loading && rows.length === 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <label htmlFor="edit-date" className="text-sm text-zinc-500">
          日期
        </label>
        <input
          id="edit-date"
          type="date"
          value={date}
          onChange={(e) => changeDate(e.target.value)}
          className="rounded border border-zinc-300 bg-white px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {empty ? (
        <p className="py-8 text-center text-sm text-zinc-500">
          {formatEmptyDate(date)}
        </p>
      ) : (
        <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
          {rows.map((r) => {
            const editing = editingUuid === r.uuid;
            return (
              <li
                key={r.uuid}
                className="flex items-center gap-3 px-4 py-2.5 text-sm"
              >
                <span className="w-12 shrink-0 tabular-nums text-zinc-400">
                  {formatTime(r.createdAt)}
                </span>
                {editing ? (
                  <input
                    type="text"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    autoFocus
                    className="flex-1 rounded border border-zinc-300 bg-white px-2 py-1 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-900"
                  />
                ) : (
                  <span className="flex-1">{r.content}</span>
                )}
                {editing ? (
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={confirmEdit}
                      className="flex items-center gap-1 rounded-full bg-zinc-900 px-3 py-1 font-medium text-white hover:bg-zinc-700 dark:bg-white dark:text-black dark:hover:bg-zinc-300"
                    >
                      <Check size={14} />
                      确认
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="flex items-center gap-1 rounded-full border border-zinc-300 px-3 py-1 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                    >
                      <X size={14} />
                      取消
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => startEdit(r)}
                    className="flex shrink-0 items-center gap-1 rounded-full border border-zinc-300 px-3 py-1 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                  >
                    <Pencil size={14} />
                    修改
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <div ref={sentinelRef} className="flex justify-center py-2">
        {loading && <span className="text-sm text-zinc-400">加载中…</span>}
        {loaded && date === "" && !hasMore && rows.length > 0 && (
          <span className="text-sm text-zinc-400">已加载全部</span>
        )}
      </div>
    </div>
  );
}