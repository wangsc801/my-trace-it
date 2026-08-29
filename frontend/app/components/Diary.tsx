import { useState, useTransition } from "react";
import ReactMarkdown from "react-markdown";
import { saveDiary, deleteDiary } from "~/services/api";

export default function Diary({
  date,
  initialContent,
}: {
  date: string;
  initialContent: string;
}) {
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState(initialContent);
  const [pending, startTransition] = useTransition();
  const [removed, setRemoved] = useState(false);

  if (removed) {
    return (
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium">日记</h2>
        </div>
        <button
          type="button"
          onClick={() => setRemoved(false)}
          className="w-fit rounded-full border border-zinc-300 px-4 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          新建日记
        </button>
      </section>
    );
  }

  function handleSave() {
    startTransition(async () => {
      await saveDiary(date, content);
      setEditing(false);
    });
  }

  function handleDelete() {
    startTransition(async () => {
      await deleteDiary(date);
      setRemoved(true);
    });
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium">日记</h2>
        {editing ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={pending}
              className="rounded-full bg-zinc-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-40 dark:bg-white dark:text-black dark:hover:bg-zinc-300"
            >
              {pending ? "保存中…" : "保存"}
            </button>
            <button
              type="button"
              onClick={() => {
                setContent(initialContent);
                setEditing(false);
              }}
              className="rounded-full border border-zinc-300 px-4 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              取消
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="rounded-full border border-zinc-300 px-4 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              编辑
            </button>
            {initialContent && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={pending}
                className="rounded-full border border-red-300 px-4 py-1.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-40 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
              >
                删除
              </button>
            )}
          </div>
        )}
      </div>

      {editing ? (
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={10}
          placeholder="用 Markdown 写今天的日记…"
          className="w-full rounded-lg border border-zinc-300 bg-white p-3 text-sm leading-6 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:ring-zinc-500"
        />
      ) : initialContent ? (
        <div className="diary-markdown rounded-lg border border-zinc-200 bg-white p-4 text-sm leading-6 dark:border-zinc-800 dark:bg-zinc-900">
          <ReactMarkdown>{initialContent}</ReactMarkdown>
        </div>
      ) : (
        <p className="text-sm text-zinc-400">这一天还没有日记。</p>
      )}
    </section>
  );
}