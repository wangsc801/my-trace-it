import { useRef } from "react";
import { CircleHelp, X } from "lucide-react";

export default function MetricHelp({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button
        type="button"
        onClick={() => ref.current?.showModal()}
        aria-label={`说明：${label}`}
        className="inline-flex shrink-0 items-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
      >
        <CircleHelp size={14} />
      </button>
      <dialog
        ref={ref}
        className="m-auto w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-5 shadow-xl backdrop:bg-black/40 dark:border-zinc-700 dark:bg-zinc-900"
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold">{label}</h3>
          <button
            type="button"
            onClick={() => ref.current?.close()}
            aria-label="关闭"
            className="rounded p-1 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <X size={16} />
          </button>
        </div>
        <div className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          {children}
        </div>
      </dialog>
    </>
  );
}