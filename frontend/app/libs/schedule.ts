export interface CsvRow {
  createdAt: string;
  content: string;
  amountFormatted: string;
  amount: string;
  amountUnit: string;
  uuid: string;
}

export interface ScheduleEntry {
  uuid: string;
  content: string;
  /** Date part of createdAt (YYYY-MM-DD), as recorded in the data's timezone. */
  date: string;
  start: Date;
  end: Date | null;
}

/** Re-quote a CSV field only when it needs it (contains a comma, quote, or newline). */
function quoteCsvField(field: string): string {
  return /[",\r\n]/.test(field) ? `"${field.replace(/"/g, '""')}"` : field;
}

/**
 * Blank any `amountUnit` CSV field that equals "NONE" so it is sent as empty/null.
 * Merges back into CSV form while preserving the other fields' values.
 */
export function normalizeAmountUnit(csv: string): string {
  return csv
    .split(/\r?\n/)
    .map((raw) => {
      const line = raw.trim();
      if (!line || line.startsWith("createdAt,content")) return raw;
      const fields = parseLine(line);
      if (fields.length > 4 && fields[4].trim().toUpperCase() === "NONE") {
        fields[4] = "";
      }
      return fields.map(quoteCsvField).join(",");
    })
    .join("\n");
}

const END_MARKERS = new Set(["完毕", "结束", "完成", "暂停", "终止"]);

/** True when content splits on the first space into two non-empty parts. */
export function hasCategory(content: string): boolean {
  const idx = content.indexOf(" ");
  return idx !== -1 && content.slice(idx + 1).trim().length > 0;
}

/** Category (part before the first space) when present, otherwise the whole content. */
export function colorKey(content: string): string {
  if (!hasCategory(content)) return content;
  return content.slice(0, content.indexOf(" "));
}

export function isEndMarker(content: string): boolean {
  return END_MARKERS.has(content.trim());
}

/** Parse a single CSV line into fields, handling quotes and escaped quotes. */
function parseLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      fields.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  fields.push(current);
  return fields;
}

export function parseCsv(csv: string): CsvRow[] {
  const lines = csv.split(/\r?\n/);
  const rows: CsvRow[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;
    // Skip header row
    if (line.startsWith("createdAt,content")) continue;

    const [createdAt, content, amountFormatted, amount, amountUnit, uuid] =
      parseLine(line);

    if (!createdAt || !content || !uuid) continue;

    rows.push({
      createdAt: createdAt.trim(),
      content: content.trim(),
      amountFormatted: (amountFormatted ?? "").trim(),
      amount: (amount ?? "").trim(),
      amountUnit: (amountUnit ?? "NONE").trim(),
      uuid: uuid.trim(),
    });
  }

  return rows;
}

/**
 * Build schedule segments from CSV rows.
 *
 * Rows are sorted ascending by createdAt. A record whose content is an end
 * marker (完毕/结束) marks the end time of the previous activity and is not
 * shown itself. Each activity's end is the next row's createdAt; if there is no
 * next row, end is null (the entry is flagged as "open"/red).
 */
export function buildSchedule(rows: CsvRow[]): ScheduleEntry[] {
  const sorted = [...rows].sort((a, b) =>
    a.createdAt.localeCompare(b.createdAt)
  );

  const entries: ScheduleEntry[] = [];
  for (let i = 0; i < sorted.length; i++) {
    const row = sorted[i];
    if (isEndMarker(row.content)) continue;

    const next = sorted[i + 1];
    entries.push({
      uuid: row.uuid,
      content: row.content,
      date: row.createdAt.slice(0, 10),
      start: new Date(row.createdAt),
      end: next ? new Date(next.createdAt) : null,
    });
  }
  return entries;
}

const WAKEUP_CONTENT = "起床";

export interface DayActivity {
  start: string;
  end: string | null;
  name: string;
  detail: string | null;
}

export interface DaySchedule {
  wakeupAt: string | null;
  events: DayActivity[];
}

/** HH:mm from the createdAt ISO string, keeping the data's own timezone. */
function formatHm(iso: string): string {
  return iso.slice(11, 16);
}

function splitNameDetail(
  content: string
): { name: string; detail: string | null } {
  const idx = content.indexOf(" ");
  if (idx === -1) return { name: content, detail: null };
  const detail = content.slice(idx + 1).trim();
  return { name: content.slice(0, idx), detail: detail.length ? detail : null };
}

/**
 * Build the API payload for a single day. "起床" records become `wakeupAt`
 * (excluded from events); end markers (完毕/结束) are skipped; every other
 * record is an event whose start/end follow the same rule as buildSchedule
 * (end = next record's time). Content is split on the first space into
 * name/detail.
 */
export function buildDaySchedule(rows: CsvRow[]): DaySchedule {
  const sorted = [...rows].sort((a, b) =>
    a.createdAt.localeCompare(b.createdAt)
  );

  let wakeupAt: string | null = null;
  const events: DayActivity[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const row = sorted[i];
    if (row.content === WAKEUP_CONTENT) {
      if (wakeupAt === null) wakeupAt = formatHm(row.createdAt);
      continue;
    }
    if (isEndMarker(row.content)) continue;

    const next = sorted[i + 1];
    const { name, detail } = splitNameDetail(row.content);
    events.push({
      start: formatHm(row.createdAt),
      end: next ? formatHm(next.createdAt) : null,
      name,
      detail,
    });
  }

  return { wakeupAt, events };
}