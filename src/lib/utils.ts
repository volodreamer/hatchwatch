import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function pad2(n: number) {
  return String(n).padStart(2, "0");
}

export function formatDuration(ms: number): string {
  const sign = ms < 0 ? "-" : "";
  const abs = Math.abs(ms);
  const totalSec = Math.floor(abs / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${sign}${h}h ${pad2(m)}m`;
  if (m > 0) return `${sign}${m}m ${pad2(s)}s`;
  return `${sign}${s}s`;
}

export function formatClock(ts: number): string {
  const d = new Date(ts);
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

export function formatDateTime(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

export function toDatetimeLocalValue(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

export function parseDatetimeLocal(value: string): number {
  const [datePart, timePart] = value.split("T");
  if (!datePart || !timePart) return Date.now();
  const [y, mo, day] = datePart.split("-").map(Number);
  const [hh, mm] = timePart.split(":").map(Number);
  return new Date(y, mo - 1, day, hh, mm || 0, 0, 0).getTime();
}

export function hourLabel(hour: number): string {
  const h = ((hour + 11) % 12) + 1;
  const suffix = hour >= 12 ? "pm" : "am";
  return `${h}:00 ${suffix}`;
}
