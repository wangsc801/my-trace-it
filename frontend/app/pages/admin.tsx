import { useState } from "react";
import { toast } from "sonner";
import { adminCreateUser, messageFromError } from "~/services/api";

export default function AdminPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = !submitting && username.trim() !== "" && password !== "";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await adminCreateUser({ username: username.trim(), password });
      toast.success("用户已创建");
      setUsername("");
      setPassword("");
    } catch (err) {
      toast.error(messageFromError(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold">管理员面板</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-zinc-700 dark:text-zinc-300">用户名</span>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="off"
            autoFocus
            className="rounded border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-zinc-700 dark:text-zinc-300">
            初始密码
          </span>
          <input
            type="text"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            className="rounded border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>

        <button
          type="submit"
          disabled={!canSubmit}
          className="w-fit rounded-full bg-zinc-900 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-40 dark:bg-white dark:text-black dark:hover:bg-zinc-300"
        >
          {submitting ? "创建中…" : "添加用户"}
        </button>
      </form>

      <p className="mt-4 text-xs text-zinc-400 dark:text-zinc-500">
        新用户默认角色为普通用户（USER）。
      </p>
    </div>
  );
}