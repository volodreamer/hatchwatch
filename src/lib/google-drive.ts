import { parsePet } from "./backup.ts";
import type { Pet } from "./tama/types.ts";

const GSI_SRC = "https://accounts.google.com/gsi/client";
const DRIVE = "https://www.googleapis.com/drive/v3";
const UPLOAD = "https://www.googleapis.com/upload/drive/v3";
const FILE_NAME = "hatchwatch.json";
const SCOPES = "https://www.googleapis.com/auth/drive.appdata https://www.googleapis.com/auth/userinfo.email";
const EMAIL_KEY = "hatchwatch-google-email";

type TokenClient = {
  requestAccessToken: (opts?: { prompt?: string }) => void;
};

type TokenResponse = {
  access_token?: string;
  expires_in?: number | string;
  error?: string;
};

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (cfg: {
            client_id: string;
            scope: string;
            callback: (resp: TokenResponse) => void;
            error_callback?: () => void;
          }) => TokenClient;
          revoke: (token: string, done?: () => void) => void;
        };
      };
    };
  }
}

export type SaveCmp = "none" | "local-only" | "cloud-only" | "same" | "cloud-newer" | "local-newer" | "other-run";

export function googleClientId(): string {
  const v = import.meta.env?.VITE_GOOGLE_CLIENT_ID;
  return typeof v === "string" ? v.trim() : "";
}

export function isGoogleConfigured(): boolean {
  return googleClientId().length > 0;
}

export function rememberedGoogleEmail(): string | null {
  if (typeof localStorage === "undefined") return null;
  return localStorage.getItem(EMAIL_KEY);
}

export function compareSaves(local: Pet | null, remote: Pet | null): SaveCmp {
  if (!local && !remote) return "none";
  if (!remote) return "local-only";
  if (!local) return "cloud-only";
  if (local.id !== remote.id || local.hatchAt !== remote.hatchAt) return "other-run";
  if (remote.lastTickAt > local.lastTickAt) return "cloud-newer";
  if (local.lastTickAt > remote.lastTickAt) return "local-newer";
  return "same";
}

let gsiReady: Promise<void> | null = null;
let tokenClient: TokenClient | null = null;
let accessToken: string | null = null;
let tokenExpiresAt = 0;
let pending: { resolve: (token: string) => void; reject: (err: Error) => void } | null = null;

function loadGsi(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("gsi"));
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  if (gsiReady) return gsiReady;
  gsiReady = new Promise((resolve, reject) => {
    const done = () => {
      if (window.google?.accounts?.oauth2) resolve();
      else reject(new Error("gsi"));
    };
    const existing = document.querySelector(`script[src="${GSI_SRC}"]`);
    if (existing) {
      if (window.google?.accounts?.oauth2) {
        resolve();
        return;
      }
      existing.addEventListener("load", done);
      existing.addEventListener("error", () => reject(new Error("gsi")));
      return;
    }
    const s = document.createElement("script");
    s.src = GSI_SRC;
    s.async = true;
    s.onload = done;
    s.onerror = () => reject(new Error("gsi"));
    document.head.appendChild(s);
  });
  return gsiReady;
}

function ensureClient() {
  if (tokenClient) return;
  const oauth = window.google?.accounts.oauth2;
  if (!oauth) throw new Error("gsi");
  tokenClient = oauth.initTokenClient({
    client_id: googleClientId(),
    scope: SCOPES,
    callback: (resp) => {
      const wait = pending;
      pending = null;
      if (!wait) return;
      if (resp.error || !resp.access_token) {
        wait.reject(new Error(resp.error === "access_denied" ? "denied" : "fail"));
        return;
      }
      accessToken = resp.access_token;
      const sec = Number(resp.expires_in);
      tokenExpiresAt = Date.now() + Math.max(60, Number.isFinite(sec) ? sec : 3600) * 1000;
      wait.resolve(accessToken);
    },
    error_callback: () => {
      const wait = pending;
      pending = null;
      wait?.reject(new Error("denied"));
    },
  });
}

function requestToken(prompt: "" | "select_account" = ""): Promise<string> {
  if (accessToken && Date.now() < tokenExpiresAt - 20_000 && prompt === "") {
    return Promise.resolve(accessToken);
  }
  return loadGsi().then(
    () =>
      new Promise<string>((resolve, reject) => {
        ensureClient();
        pending = { resolve, reject };
        tokenClient!.requestAccessToken({ prompt });
      }),
  );
}

async function authed(url: string, init: RequestInit = {}, retried = false): Promise<Response> {
  const token = await requestToken();
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);
  const res = await fetch(url, { ...init, headers });
  if (res.status === 401 && !retried) {
    accessToken = null;
    tokenExpiresAt = 0;
    return authed(url, init, true);
  }
  return res;
}

async function userEmail(): Promise<string> {
  const res = await authed("https://www.googleapis.com/oauth2/v3/userinfo");
  if (!res.ok) throw new Error("fail");
  const body = (await res.json()) as { email?: string };
  const email = body.email?.trim();
  if (!email) throw new Error("fail");
  localStorage.setItem(EMAIL_KEY, email);
  return email;
}

async function findFileId(): Promise<string | null> {
  const q = encodeURIComponent("name = 'hatchwatch.json' and trashed = false");
  const res = await authed(`${DRIVE}/files?spaces=appDataFolder&fields=files(id)&q=${q}&pageSize=1`);
  if (!res.ok) throw new Error("fail");
  const body = (await res.json()) as { files?: { id?: string }[] };
  return body.files?.[0]?.id ?? null;
}

export async function connectGoogle(): Promise<string> {
  if (!isGoogleConfigured()) throw new Error("need");
  if (accessToken && Date.now() < tokenExpiresAt - 20_000) {
    return rememberedGoogleEmail() ?? userEmail();
  }
  await requestToken("select_account");
  return userEmail();
}

export async function disconnectGoogle(): Promise<void> {
  const token = accessToken;
  accessToken = null;
  tokenExpiresAt = 0;
  if (typeof localStorage !== "undefined") localStorage.removeItem(EMAIL_KEY);
  if (token && window.google?.accounts.oauth2) {
    await new Promise<void>((resolve) => {
      window.google!.accounts.oauth2.revoke(token, () => resolve());
      window.setTimeout(resolve, 1500);
    });
  }
}

export async function saveToGoogle(raw: string): Promise<void> {
  const id = await findFileId();
  if (id) {
    const res = await authed(`${UPLOAD}/files/${id}?uploadType=media`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: raw,
    });
    if (!res.ok) throw new Error("fail");
    return;
  }
  const boundary = `hatchwatch_${Date.now().toString(36)}`;
  const meta = JSON.stringify({
    name: FILE_NAME,
    parents: ["appDataFolder"],
    mimeType: "application/json",
  });
  const body = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${meta}\r\n--${boundary}\r\nContent-Type: application/json\r\n\r\n${raw}\r\n--${boundary}--`;
  const res = await authed(`${UPLOAD}/files?uploadType=multipart`, {
    method: "POST",
    headers: { "Content-Type": `multipart/related; boundary=${boundary}` },
    body,
  });
  if (!res.ok) throw new Error("fail");
}

export async function loadFromGoogle(): Promise<string | null> {
  const id = await findFileId();
  if (!id) return null;
  const res = await authed(`${DRIVE}/files/${id}?alt=media`);
  if (!res.ok) throw new Error("fail");
  return res.text();
}

export function petFromBackupRaw(raw: string | null): Pet | null {
  if (!raw) return null;
  try {
    return parsePet(raw);
  } catch {
    return null;
  }
}
