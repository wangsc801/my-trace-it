/** Shared API/domain types used by services and pages. */
export interface RecordRow {
  uuid: string;
  createdAt: string;
  content: string;
  amountFormatted?: string | null;
  amount?: number | string | null;
  amountUnit?: string | null;
}

export interface SaveResult {
  ok: boolean;
  parsed: number;
  compared: number;
  modified: number;
  inserted: number;
  message: string;
}

export interface ResultMessage {
  ok: boolean;
  message: string;
}

export interface ColorItem {
  id: number;
  name: string;
  color: string;
  seq: number;
}

export interface ColorInput {
  name: string;
  color: string;
  seq: number;
}

export interface AuthUser {
  token: string;
  username: string;
  roles: string[];
}

export interface DaySchedulePayload {
  date: string;
  wakeup_at: string | null;
  events: {
    start: string;
    end: string | null;
    activity: { name: string; detail: string };
  }[];
}