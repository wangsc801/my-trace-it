import SchedulePreview from "~/components/SchedulePreview";

export default function AddPage() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold">添加 CSV 数据</h1>
      <SchedulePreview />
    </div>
  );
}