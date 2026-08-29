import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { ChevronDown, KeyRound, LogOut, Shield, UserRound } from "lucide-react";
import { currentUsername, getSession, logout } from "~/services/api";

export default function UserMenu() {
  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  // Read session-only state after mount so SSR/first paint match the fallback
  // ("账号" / regular-user menu), avoiding a hydration mismatch.
  useEffect(() => {
    setUsername(currentUsername());
    const session = getSession();
    setIsAdmin(
      (session?.roles ?? []).some((r) => r.toUpperCase() === "ADMIN")
    );
  }, []);

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
      >
        <span className="hidden max-w-24 truncate sm:inline">{username || "账号"}</span>
        <UserRound size={15} className="sm:hidden" />
        <ChevronDown
          size={14}
          className={`transition-transform duration-150 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 min-w-32 rounded-lg border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
          <div className="px-3 py-2 text-center text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {username || "账号"}
          </div>
          <div className="my-1 border-t border-zinc-200 dark:border-zinc-700" />
          {isAdmin ? (
            <Link
              to="/admin"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
            >
              <Shield size={15} />
              管理员面板
            </Link>
          ) : (
            <Link
              to="/change-password"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
            >
              <KeyRound size={15} />
              修改密码
            </Link>
          )}
          <div className="my-1 border-t border-zinc-200 dark:border-zinc-700" />
          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
          >
            <LogOut size={15} />
            登出
          </button>
        </div>
      )}
    </div>
  );
}