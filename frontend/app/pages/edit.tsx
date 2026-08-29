import ContentEditor from "~/components/ContentEditor";

export default function EditPage() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      <h1 className="mb-4 text-2xl font-semibold">编辑记录</h1>
      <ContentEditor />
    </div>
  );
}