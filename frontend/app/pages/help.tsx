type ApiItem = {
  name: string;
  signature: string;
  desc: string;
  params: { name: string; type: string; desc: string }[];
  returns: string;
};

const APIS: ApiItem[] = [
  {
    name: "GET /records",
    signature: "GET /records?date=YYYY-MM-DD&includeNextMorning=1&offset=0&limit=30",
    desc: "获取日程记录。未指定 date 时按 createdAt 倒序分页返回（用于编辑页懒加载）；指定 date 时一次性返回该日期全部记录。includeNextMorning=1 时额外包含次日凌晨 03:00 前的记录（处理跨零点活动的结束时间）。",
    params: [
      { name: "date", type: "string (query, 可选)", desc: "YYYY-MM-DD；提供后忽略 offset/limit，返回当天全部记录" },
      { name: "includeNextMorning", type: "0|1 (query, 可选)", desc: "是否额外返回次日小时 < 4 的记录" },
      { name: "offset", type: "number (query, 默认 0)", desc: "分页偏移量，仅在未指定 date 时生效" },
      { name: "limit", type: "number (query, 默认 30, 上限 200)", desc: "每页条数，仅在未指定 date 时生效" },
    ],
    returns: "{ rows: { uuid, createdAt, content }[], date: string | null }",
  },
  {
    name: "GET /records/dates",
    signature: "GET /records/dates",
    desc: "获取所有有记录存在的日期（去重、升序），用于日历高亮。",
    params: [],
    returns: "{ dates: string[] }",
  },
  {
    name: "PUT /records/:uuid",
    signature: "PUT /records/:uuid   body { content }",
    desc: "更新某条记录的内容（编辑页使用）。",
    params: [
      { name: "uuid", type: "string (path)", desc: "记录的唯一标识" },
      { name: "content", type: "string (body)", desc: "新的内容，非空" },
    ],
    returns: "{ ok, message }",
  },
  {
    name: "POST /records/save",
    signature: "POST /records/save   body { csv }",
    desc: "批量导入 CSV：解析、按 uuid 比对既有记录、插入新增、更新内容/时间变化。",
    params: [
      { name: "csv", type: "string (body)", desc: "Trace It 导出的 CSV 全文" },
    ],
    returns: "{ ok, parsed, compared, modified, inserted, message }",
  },
  {
    name: "GET /diary/:date · PUT /diary/:date · DELETE /diary/:date",
    signature: "GET|PUT|DELETE /diary/2026-08-14",
    desc: "每天的日记：读取、保存（upsert）、软删除。",
    params: [
      { name: "date", type: "string (path)", desc: "YYYY-MM-DD，必填" },
    ],
    returns: "GET → { content }；PUT/DELETE → { ok, message }",
  },
  {
    name: "GET /colors · POST /colors · PUT /colors · PUT /colors/:id",
    signature: "GET /colors | POST /colors {name,color} | PUT /colors {upserts,deletes} | PUT /colors/:id {color}",
    desc: "颜色管理：列出（non-deleted、按 seq 排序）、新增、批量保存/删除/重排序、更新单个颜色。",
    params: [
      { name: "upserts", type: "object[] (body)", desc: "[{ name, color, seq }]，按 name upsert" },
      { name: "deletes", type: "string[] (body)", desc: "要软删除的颜色名称列表" },
    ],
    returns: "GET → { colors: [{ id, name, color, seq }] }；其余 → { ok, message }",
  },
  {
    name: "GET /schedules/:date",
    signature: "GET /schedules/2026-08-14",
    desc: "获取某一天的聚合日程（起床时间 + 起止分段事件）。",
    params: [
      { name: "date", type: "string (path)", desc: "YYYY-MM-DD，必填" },
    ],
    returns: "{ date, wakeup_at: string|null, events: { start, end, activity: { name, detail } }[] }",
  },
];

export default function HelpPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-semibold">API 说明</h1>
      <p className="mb-8 text-sm text-zinc-500">
        前端通过 axios 调用上述后端接口；接口返回 JSON。后端可用任意关系型数据库实现。
      </p>

      <div className="flex flex-col gap-6">
        {APIS.map((api) => (
          <article
            key={api.name}
            className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
          >
            <h2 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {api.name}
            </h2>
            <pre className="mb-3 overflow-auto rounded bg-zinc-50 p-2 font-mono text-xs text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
              {api.signature}
            </pre>
            <p className="mb-3 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              {api.desc}
            </p>

            {api.params.length > 0 && (
              <div className="mb-3">
                <h3 className="mb-1.5 text-xs font-medium uppercase tracking-wide text-zinc-400">
                  参数
                </h3>
                <ul className="flex flex-col gap-1.5">
                  {api.params.map((p) => (
                    <li
                      key={p.name}
                      className="flex flex-col gap-0.5 text-sm sm:flex-row sm:gap-2"
                    >
                      <code className="shrink-0 font-mono text-xs text-emerald-700 dark:text-emerald-400">
                        {p.name}
                      </code>
                      <span className="shrink-0 text-xs text-zinc-400">
                        {p.type}
                      </span>
                      <span className="text-zinc-600 dark:text-zinc-400">
                        {p.desc}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <h3 className="mb-1.5 text-xs font-medium uppercase tracking-wide text-zinc-400">
                返回
              </h3>
              <p className="font-mono text-xs leading-5 text-zinc-600 dark:text-zinc-400">
                {api.returns}
              </p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}