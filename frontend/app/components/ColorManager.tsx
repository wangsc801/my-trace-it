import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { HexColorPicker } from "react-colorful";
import { toast } from "sonner";
import {
  ArrowDown,
  ArrowUp,
  Check,
  ListOrdered,
  Plus,
  Save,
  Trash2,
  Undo2,
  X,
} from "lucide-react";
import { createColor, saveColors, updateColorById } from "~/services/api";

interface ColorRow {
  key: number;
  id: number | null;
  name: string;
  color: string;
  deleted: boolean;
}

// react-colorful popover: live preview via onChange, persist via onCommit on close.
function ColorSwatch({
  color,
  disabled,
  onChange,
  onCommit,
}: {
  color: string;
  disabled?: boolean;
  onChange: (c: string) => void;
  onCommit: (c: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const startRef = useRef(color);
  const colorRef = useRef(color);
  colorRef.current = color;
  const onCommitRef = useRef(onCommit);
  onCommitRef.current = onCommit;

  const close = useCallback(() => {
    setOpen(false);
    if (colorRef.current !== startRef.current) {
      onCommitRef.current(colorRef.current);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) close();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (open) {
            close();
          } else {
            startRef.current = color;
            setOpen(true);
          }
        }}
        aria-label="选择颜色"
        className="h-8 w-10 cursor-pointer rounded border border-zinc-200 dark:border-zinc-700 disabled:opacity-40"
        style={{ backgroundColor: color }}
      />
      {open && (
        <div className="absolute right-0 top-9 z-30 rounded-lg border border-zinc-200 bg-white p-2 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
          <HexColorPicker color={color} onChange={onChange} />
        </div>
      )}
    </div>
  );
}

export default function ColorManager({
  initialColors,
}: {
  initialColors: { id: number; name: string; color: string }[];
}) {
  const idRef = useRef(-1);
  const nextKey = () => idRef.current--;

  const [rows, setRows] = useState<ColorRow[]>(() =>
    initialColors.map((r) => ({ key: r.id, id: r.id, name: r.name, color: r.color, deleted: false }))
  );
  const [reordering, setReordering] = useState(false);
  const [baseOrder, setBaseOrder] = useState<ColorRow[]>([]);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  // Add-color modal state.
  const [showModal, setShowModal] = useState(false);
  const [modalName, setModalName] = useState("");
  const [modalColor, setModalColor] = useState("#000000");
  const [modalError, setModalError] = useState("");
  const [saving, setSaving] = useState(false);

  const hasPendingDelete = rows.some((r) => r.deleted);

  function updateRow(key: number, patch: Partial<ColorRow>) {
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  function toggleDelete(key: number) {
    setMessage("");
    setRows((rs) =>
      rs.map((r) => {
        if (r.key !== key) return r;
        const next = { ...r, deleted: !r.deleted };
        if (next.deleted) toast.info(`已标记删除：${r.name || "（未命名）"}`);
        else toast.success(`已撤销删除：${r.name || "（未命名）"}`);
        return next;
      })
    );
  }

  function move(index: number, dir: -1 | 1) {
    setRows((rs) => {
      const j = index + dir;
      if (j < 0 || j >= rs.length) return rs;
      const next = [...rs];
      [next[index], next[j]] = [next[j], next[index]];
      return next;
    });
  }

  function startReorder() {
    setBaseOrder(rows);
    setReordering(true);
  }

  function confirmReorder() {
    const upserts = rows
      .filter((r) => !r.deleted)
      .map((r, i) => ({ name: r.name, color: r.color, seq: i + 1 }));
    const promise = (async () => {
      const res = await saveColors(upserts, []);
      if (!res.ok) throw new Error(res.message);
      return res;
    })();
    toast.promise(promise, {
      loading: "正在保存顺序…",
      success: () => {
        startTransition(() => {
          setReordering(false);
          setMessage("");
        });
        return "顺序已更新";
      },
      error: (e) => {
        const msg = e instanceof Error ? e.message : "保存失败";
        setMessage(msg);
        return msg;
      },
    });
  }

  function cancelReorder() {
    setRows(baseOrder);
    setReordering(false);
  }

  function handleSave() {
    const upserts = rows.filter((r) => !r.deleted).map((r, i) => ({ name: r.name, color: r.color, seq: i + 1 }));
    const deletes = rows.filter((r) => r.deleted).map((r) => r.name);
    const promise = (async () => {
      const res = await saveColors(upserts, deletes);
      if (!res.ok) throw new Error(res.message);
      return { res, deletes };
    })();
    toast.promise(promise, {
      loading: "正在保存…",
      success: ({ deletes: ds }) => {
        startTransition(() => {
          const committed = rows.filter((r) => !r.deleted);
          setRows(committed);
          setReordering(false);
          setMessage("");
        });
        return ds.length ? `已保存，删除 ${ds.length} 项` : "已保存";
      },
      error: (e) => {
        const msg = e instanceof Error ? e.message : "保存失败";
        setMessage(msg);
        return msg;
      },
    });
  }

  function commitColor(r: ColorRow, color: string) {
    if (r.deleted) return;
    const label = r.name || "（未命名）";
    const promise = (async () => {
      const res =
        r.id != null
          ? await updateColorById(r.id, color)
          : await saveColors(
              [
                {
                  name: r.name,
                  color,
                  seq: rows.filter((x) => !x.deleted).findIndex((x) => x.key === r.key) + 1,
                },
              ],
              []
            );
      if (!res.ok) throw new Error(res.message);
      return res;
    })();
    toast.promise(promise, {
      loading: "正在保存颜色…",
      success: () => {
        startTransition(() => {
          setMessage("");
        });
        return `已更新「${label}」的颜色`;
      },
      error: (e) => {
        const msg = e instanceof Error ? e.message : "保存失败";
        setMessage(msg);
        return msg;
      },
    });
  }

  function openModal() {
    setModalName("");
    setModalColor("#000000");
    setModalError("");
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setModalError("");
  }

  async function saveModal() {
    setSaving(true);
    setModalError("");
    const name = modalName.trim();
    const promise = createColor(modalName, modalColor).then((res) => {
      if (!res.ok) throw new Error(res.message);
      return res;
    });
    toast.promise(promise, {
      loading: "正在添加颜色…",
      success: () => {
        const newRow: ColorRow = { key: nextKey(), id: null, name, color: modalColor, deleted: false };
        setRows((rs) => [...rs, newRow]);
        setShowModal(false);
        setMessage("");
        return `已添加「${name}」`;
      },
      error: (e) => {
        const msg = e instanceof Error ? e.message : "添加失败";
        setModalError(msg);
        return msg;
      },
      finally: () => setSaving(false),
    });
  }

  const saveButton = (
    <button
      type="button"
      onClick={handleSave}
      disabled={pending}
      className="flex items-center gap-1.5 rounded-full bg-red-600 px-5 py-1.5 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-40 dark:bg-red-600 dark:hover:bg-red-500"
    >
      <Save size={15} />
      {pending ? "保存中…" : "保存"}
    </button>
  );

  return (
    <div className="flex flex-col gap-4">
      {message && <p className="text-sm text-red-600">{message}</p>}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openModal}
            disabled={reordering || pending}
            className="flex items-center gap-1.5 rounded-full border border-zinc-300 px-4 py-1.5 text-sm hover:bg-zinc-100 disabled:opacity-40 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            <Plus size={15} />
            添加
          </button>
          {reordering ? (
            <>
              <button
                type="button"
                onClick={confirmReorder}
                className="flex items-center gap-1.5 rounded-full bg-zinc-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-white dark:text-black dark:hover:bg-zinc-300"
              >
                <Check size={15} />
                确认
              </button>
              <button
                type="button"
                onClick={cancelReorder}
                className="flex items-center gap-1.5 rounded-full border border-zinc-300 px-4 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
              >
                <X size={15} />
                取消
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={startReorder}
              className="flex items-center gap-1.5 rounded-full border border-zinc-300 px-4 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              <ListOrdered size={15} />
              重排序
            </button>
          )}
        </div>
      </div>

      <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
        {rows.map((r, i) =>
          reordering ? (
            <li
              key={r.key}
              className="flex items-center gap-3 px-4 py-2.5 text-sm"
            >
              <span className="w-6 text-zinc-400">{i + 1}</span>
              <span
                className={`flex-1 truncate ${r.deleted ? "line-through opacity-50" : ""}`}
              >
                {r.name || "（未命名）"}
              </span>
              <span
                className="h-5 w-5 shrink-0 rounded-full border border-zinc-200 dark:border-zinc-700"
                style={{ backgroundColor: r.color }}
              />
              <button
                type="button"
                onClick={() => move(i, -1)}
                disabled={i === 0}
                aria-label="上移"
                className="rounded p-1 text-zinc-500 hover:bg-zinc-100 disabled:opacity-30 dark:hover:bg-zinc-800"
              >
                <ArrowUp size={16} />
              </button>
              <button
                type="button"
                onClick={() => move(i, 1)}
                disabled={i === rows.length - 1}
                aria-label="下移"
                className="rounded p-1 text-zinc-500 hover:bg-zinc-100 disabled:opacity-30 dark:hover:bg-zinc-800"
              >
                <ArrowDown size={16} />
              </button>
            </li>
          ) : (
            <li
              key={r.key}
              className={`flex items-center gap-3 px-4 py-2.5 text-sm ${
                r.deleted ? "opacity-60" : ""
              }`}
            >
              <input
                type="text"
                value={r.name}
                maxLength={16}
                onChange={(e) => updateRow(r.key, { name: e.target.value })}
                placeholder="名称（≤16字符）"
                className={`w-40 rounded border border-zinc-300 bg-white px-2 py-1 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 ${
                  r.deleted ? "line-through" : ""
                }`}
              />
              <ColorSwatch
                color={r.color}
                disabled={r.deleted}
                onChange={(c) => updateRow(r.key, { color: c })}
                onCommit={(c) => commitColor(r, c)}
              />
              <span className="flex-1" />
              {r.deleted ? (
                <button
                  type="button"
                  onClick={() => toggleDelete(r.key)}
                  aria-label="撤销删除"
                  className="flex items-center gap-1 rounded-full px-2 py-1 text-sm text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950"
                >
                  <Undo2 size={15} />
                  撤销
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => toggleDelete(r.key)}
                  aria-label="删除"
                  className="rounded p-1 text-zinc-400 hover:text-red-600 dark:hover:text-red-400"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </li>
          )
        )}
      </ul>

      {hasPendingDelete && !reordering && !pending && (
        <div className="flex justify-end">{saveButton}</div>
      )}

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={closeModal}
        >
          <div
            className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl dark:bg-zinc-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center gap-2">
              <button
                type="button"
                onClick={closeModal}
                aria-label="关闭"
                className="rounded p-1 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <X size={18} />
              </button>
              <h3 className="text-lg font-semibold">添加颜色</h3>
            </div>

            {modalError && <p className="mb-3 text-sm text-red-600">{modalError}</p>}

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label htmlFor="modal-name" className="text-sm text-zinc-500">
                  名称
                </label>
                <input
                  id="modal-name"
                  type="text"
                  value={modalName}
                  maxLength={16}
                  onChange={(e) => setModalName(e.target.value)}
                  placeholder="名称（≤16字符）"
                  autoFocus
                  className="rounded border border-zinc-300 bg-white px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-900"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm text-zinc-500">颜色</label>
                <HexColorPicker
                  color={modalColor}
                  onChange={setModalColor}
                  style={{ width: "100%", height: 140 }}
                />
                {modalColor === "#000000" && (
                  <span className="text-xs text-zinc-400">请不要选择黑色或深色</span>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeModal}
                className="rounded-full border border-zinc-300 px-4 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
              >
                取消
              </button>
              <button
                type="button"
                onClick={saveModal}
                disabled={!modalName.trim() || modalColor === "#000000" || saving}
                className="rounded-full bg-zinc-900 px-5 py-1.5 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-40 dark:bg-white dark:text-black dark:hover:bg-zinc-300"
              >
                {saving ? "保存中…" : "保存"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}