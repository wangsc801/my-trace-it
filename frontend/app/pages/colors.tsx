import { getColors } from "~/services/api";
import { useAsync } from "~/hooks/useAsync";
import ColorManager from "~/components/ColorManager";

export default function ColorsPage() {
  const { data, loading } = useAsync(() => getColors(), []);

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-8">
        <p className="text-sm text-zinc-400">加载中…</p>
      </div>
    );
  }

  const colors = data ?? [];

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      <h1 className="mb-4 text-2xl font-semibold">颜色管理</h1>
      <ColorManager
        initialColors={colors.map((c) => ({
          id: c.id,
          name: c.name,
          color: c.color,
        }))}
      />
    </div>
  );
}