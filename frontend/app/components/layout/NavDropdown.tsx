import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { ChevronDown, LifeBuoy, Palette, Pencil, Settings } from "lucide-react";

const SUB_NAV = [
  { href: "/edit", label: "编辑记录", icon: Pencil },
  { href: "/colors", label: "颜色管理", icon: Palette },
  { href: "/help", label: "帮助", icon: LifeBuoy },
];

export default function NavDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
      >
        <Settings size={15} />
        <span className="hidden sm:inline">管理</span>
        <ChevronDown
          size={14}
          className={`transition-transform duration-150 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 min-w-36 rounded-lg border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
          {SUB_NAV.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
              >
                <Icon size={15} />
                {item.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}