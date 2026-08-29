import { Link } from "react-router";
import { BarChart3, CalendarDays, Upload } from "lucide-react";

const FEATURES = [
  {
    href: "/add",
    icon: Upload,
    title: "导入日程",
    desc: "上传 CSV，记录每天的时间安排",
  },
  {
    href: "/browse",
    icon: CalendarDays,
    title: "按日期浏览",
    desc: "用时间轴回看每一天的活动",
  },
  {
    href: "/report",
    icon: BarChart3,
    title: "对比分析",
    desc: "对比两天数据，洞察时间去向",
  },
];

export default function Home() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-10 px-4 py-14 text-center">
      <img
        src="/trace-it-android.png"
        alt="Trace It"
        className="h-16 w-16 rounded-2xl shadow-sm"
      />
      <div className="space-y-3">
        <h1 className="text-3xl font-bold">Trace It</h1>
        <p className="text-zinc-500 dark:text-zinc-400">
          记录、管理并回看你的时间日程。
        </p>
      </div>

      <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-3">
        {FEATURES.map((f) => {
          const Icon = f.icon;
          return (
            <Link
              key={f.href}
              to={f.href}
              className="flex flex-col items-start gap-2 rounded-lg border border-zinc-200 p-5 text-left transition hover:border-zinc-400 hover:shadow-sm dark:border-zinc-800 dark:hover:border-zinc-600"
            >
              <Icon size={20} className="text-zinc-700 dark:text-zinc-300" />
              <span className="text-sm font-semibold">{f.title}</span>
              <span className="text-sm text-zinc-500 dark:text-zinc-400">
                {f.desc}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}