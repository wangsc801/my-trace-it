import axios from "axios";
import type {
  AuthUser,
  ColorInput,
  ColorItem,
  RecordRow,
  ResultMessage,
  SaveResult,
} from "~/types/api";

/**
 * API client — replaces the original sqlite server code with HTTP requests.
 *
 * All paths are prefixed with `/api`, matching the Spring Boot backend.
 * Base URL defaults to same-origin (dev is proxied to the backend) and can be
 * overridden with the `VITE_API_BASE_URL` environment variable.
 */

const API_BASE: string =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "";

const http = axios.create({ baseURL: API_BASE });

/* ------------------------------------------------------------------ */
/* Auth (JWT)                                                          */
/* ------------------------------------------------------------------ */

const TOKEN_KEY = "my_trace_it_token";
const SESSION_KEY = "my_trace_it_session";

export interface Session {
  username: string;
  roles: string[];
}

/** localStorage may not exist during server-side rendering — guard all access. */
function read(key: string): string | null {
  return typeof localStorage === "undefined" ? null : localStorage.getItem(key);
}

function write(key: string, value: string): void {
  if (typeof localStorage !== "undefined") localStorage.setItem(key, value);
}

function remove(key: string): void {
  if (typeof localStorage !== "undefined") localStorage.removeItem(key);
}

export function getToken(): string | null {
  return read(TOKEN_KEY);
}

export function setToken(token: string): void {
  write(TOKEN_KEY, token);
}

export function clearToken(): void {
  remove(TOKEN_KEY);
  remove(SESSION_KEY);
}

export function getSession(): Session | null {
  const raw = read(SESSION_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<Session>;
    return typeof parsed.username === "string"
      ? { username: parsed.username, roles: Array.isArray(parsed.roles) ? parsed.roles : [] }
      : null;
  } catch {
    return null;
  }
}

function setSession(session: Session): void {
  write(SESSION_KEY, JSON.stringify(session));
}

function decodeJwtSub(token: string): string | undefined {
  try {
    const part = token.split(".")[1];
    const b64 = part.replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64.padEnd(b64.length + ((4 - (b64.length % 4)) % 4), "=");
    const json = decodeURIComponent(
      atob(padded)
        .split("")
        .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
        .join("")
    );
    const payload = JSON.parse(json) as { sub?: unknown };
    return typeof payload.sub === "string" ? payload.sub : undefined;
  } catch {
    return undefined;
  }
}

/** Current signed-in username: prefer the saved session, fall back to the JWT sub claim. */
export function currentUsername(): string {
  const session = getSession();
  if (session) return session.username;
  const token = getToken();
  return token ? decodeJwtSub(token) ?? "" : "";
}

/** Attach the bearer token to every request when present. */
http.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/** On 401, drop the stale token and bounce to the login page. */
http.interceptors.response.use(
  (res) => res,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      clearToken();
      if (window.location.pathname !== "/login") {
        window.location.assign("/login");
      }
    }
    return Promise.reject(error);
  }
);

export async function login(username: string, password: string): Promise<AuthUser> {
  const { data } = await http.post("/api/auth/login", { username, password });
  setToken(data.token);
  setSession({ username: data.username, roles: data.roles });
  return data as AuthUser;
}

export function logout(): void {
  clearToken();
  window.location.assign("/login");
}

/* ---------- records ---------- */

export async function getRecords(opts: {
  offset?: number;
  limit?: number;
}): Promise<{ rows: RecordRow[]; date: null }> {
  const { data } = await http.get("/api/records", {
    params: { offset: opts.offset, limit: opts.limit },
  });
  return data as { rows: RecordRow[]; date: null };
}

export async function getRecordsByDate(
  date: string,
  includeNextMorning = false
): Promise<{ rows: RecordRow[]; date: string }> {
  const { data } = await http.get("/api/records", {
    params: { date, includeNextMorning: includeNextMorning ? 1 : 0 },
  });
  return data as { rows: RecordRow[]; date: string };
}

export async function getDatesWithData(): Promise<string[]> {
  const { data } = await http.get("/api/records/dates");
  return (data?.dates as string[]) ?? [];
}

export async function updateContent(
  uuid: string,
  content: string
): Promise<ResultMessage> {
  const trimmed = content.trim();
  if (!trimmed) return { ok: false, message: "内容不能为空" };
  const { data } = await http.put(`/api/records/${encodeURIComponent(uuid)}`, {
    content: trimmed,
  });
  return data as ResultMessage;
}

export async function saveSchedule(csv: string): Promise<SaveResult> {
  const { data } = await http.post("/api/records/save", { csv });
  return data as SaveResult;
}

/* ---------- diary ---------- */

export async function getDiary(date: string): Promise<{ content: string }> {
  const { data } = await http.get(`/api/diary/${encodeURIComponent(date)}`);
  return {
    content:
      data && typeof data.content === "string" ? data.content : "",
  };
}

export async function saveDiary(
  date: string,
  content: string
): Promise<ResultMessage> {
  const { data } = await http.put(`/api/diary/${encodeURIComponent(date)}`, {
    content,
  });
  return data as ResultMessage;
}

export async function deleteDiary(date: string): Promise<ResultMessage> {
  const { data } = await http.delete(`/api/diary/${encodeURIComponent(date)}`);
  return data as ResultMessage;
}

/* ---------- colors ---------- */

export async function getColors(): Promise<ColorItem[]> {
  const { data } = await http.get("/api/colors");
  return ((data?.colors as ColorItem[]) ?? []).map((c) =>
    c && typeof c.id === "number" ? c : { ...c, id: 0 }
  );
}

export async function createColor(
  name: string,
  color: string
): Promise<ResultMessage> {
  const { data } = await http.post("/api/colors", { name, color });
  return data as ResultMessage;
}

export async function saveColors(
  upserts: ColorInput[],
  deletes: string[]
): Promise<ResultMessage> {
  const { data } = await http.put("/api/colors", { upserts, deletes });
  return data as ResultMessage;
}

export async function updateColorById(
  id: number,
  color: string
): Promise<ResultMessage> {
  const { data } = await http.put(`/api/colors/${encodeURIComponent(String(id))}`, {
    color,
  });
  return data as ResultMessage;
}

/* ---------- schedule (day payload) ---------- */

export async function getDaySchedule(date: string): Promise<unknown> {
  const { data } = await http.get(`/api/schedules/${encodeURIComponent(date)}`);
  return data;
}

/* ---------- admin ---------- */

export interface AdminCreateUserInput {
  username: string;
  password: string;
  roles?: string[];
}

export async function adminCreateUser(
  input: AdminCreateUserInput
): Promise<unknown> {
  const { data } = await http.post("/api/admin/users", input);
  return data;
}

/* ---------- error helper ---------- */

export function messageFromError(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data;
    if (data && typeof data.message === "string" && data.message) {
      return data.message;
    }
    return err.message || "请求失败";
  }
  if (err instanceof Error && err.message) return err.message;
  return "请求失败";
}