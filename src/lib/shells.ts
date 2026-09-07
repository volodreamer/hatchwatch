/**
 * Shell palettes — add or edit colors here, then add "theme.<id>" in i18n.ts.
 *
 * Two-color classic (see yellow-black):
 *   bg        = plastic
 *   primary   = buttons / titles
 *
 * Three-color (copy tama-garden or neon-pop, set tri: true):
 *   bg        = plastic
 *   lcdStroke = thin line around the LCD
 *   accent    = Meal/Snack/Game labels + Upcoming icon
 *   primary   = HATCHWATCH, tile titles (Upcoming, Growth path), button outlines
 *
 * LCD pixel colors never go here — they stay in styles.css @theme.
 */

export type ShellGroup = "classic" | "modern";

export interface ShellDef {
  group: ShellGroup;
  /** Light UI chrome (inputs, toasts). */
  light: boolean;
  /** Three-color layout: LCD stroke, accent keys, primary titles/outlines. */
  tri?: boolean;
  bg: string;
  surface: string;
  surface2: string;
  fg: string;
  muted: string;
  faint: string;
  primary: string;
  primaryFg: string;
  border: string;
  danger: string;
  warn: string;
  ok: string;
  lcdStroke?: string;
  accent?: string;
  pattern?: string;
  patternSize?: string;
}

export const SHELLS = {
  "tama-garden": {
    group: "modern",
    light: false,
    tri: true,
    bg: "#006269",
    surface: "#0d7a82",
    surface2: "#1a8a91",
    fg: "#e6f6f6",
    muted: "#9ec9cb",
    faint: "#6a9ea0",
    primary: "#a362ce",
    primaryFg: "#f8f0ff",
    border: "#004a50",
    danger: "#e87880",
    warn: "#e0c06a",
    ok: "#7cd9a1",
    lcdStroke: "#ff3d9a",
    accent: "#ffb7ce",
    pattern:
      "radial-gradient(ellipse at 18% 22%, rgb(124 217 161 / 0.22) 0 18px, transparent 19px), radial-gradient(ellipse at 78% 70%, rgb(255 61 154 / 0.28) 0 16px, transparent 17px), radial-gradient(ellipse at 52% 48%, rgb(163 98 206 / 0.22) 0 12px, transparent 13px)",
    patternSize: "160px 160px",
  },
  "neon-pop": {
    group: "modern",
    light: false,
    tri: true,
    bg: "#7b00ae",
    surface: "#8e12c4",
    surface2: "#5a0088",
    fg: "#f8f0ff",
    muted: "#d8b4f0",
    faint: "#b080d0",
    primary: "#39ff14",
    primaryFg: "#081428",
    border: "#9a20cc",
    danger: "#ff6a8a",
    warn: "#ffe14a",
    ok: "#39ff14",
    lcdStroke: "#ff007f",
    accent: "#ff007f",
    pattern:
      "repeating-linear-gradient(135deg, transparent 0 16px, rgb(57 255 20 / 0.16) 16px 18px), repeating-linear-gradient(45deg, transparent 0 28px, rgb(255 0 127 / 0.14) 28px 30px)",
  },

  "pink-yellow": {
    group: "classic",
    light: true,
    bg: "#ff66b2",
    surface: "#ff7cbc",
    surface2: "#ff92c8",
    fg: "#2a1020",
    muted: "#6e2848",
    faint: "#8a4060",
    primary: "#ffe600",
    primaryFg: "#1a1400",
    border: "#e05098",
    danger: "#8e1028",
    warn: "#6a4800",
    ok: "#1c5c38",
  },
  "white-blue": {
    group: "classic",
    light: true,
    bg: "#ffffff",
    surface: "#f4f7fb",
    surface2: "#e8eef6",
    fg: "#142033",
    muted: "#5a6a80",
    faint: "#8a98ac",
    primary: "#0099ff",
    primaryFg: "#f4faff",
    border: "#d0d8e4",
    danger: "#c42020",
    warn: "#a07010",
    ok: "#2a7a40",
  },
  "purple-pink": {
    group: "classic",
    light: false,
    bg: "#8a4fff",
    surface: "#975eff",
    surface2: "#a572ff",
    fg: "#f6f0ff",
    muted: "#d4c4f8",
    faint: "#b8a0e8",
    primary: "#ff52a0",
    primaryFg: "#fff5fa",
    border: "#7a40e8",
    danger: "#ff8a8a",
    warn: "#ffd36a",
    ok: "#8eecb0",
  },
  "white-red": {
    group: "classic",
    light: true,
    bg: "#ffffff",
    surface: "#faf6f5",
    surface2: "#f4e8e6",
    fg: "#1c1010",
    muted: "#6a4848",
    faint: "#987070",
    primary: "#ee0700",
    primaryFg: "#fff6f5",
    border: "#e0d0ce",
    danger: "#b01010",
    warn: "#a07010",
    ok: "#2a7a40",
  },
  "yellow-black": {
    group: "classic",
    light: true,
    bg: "#ffd700",
    surface: "#ffe44d",
    surface2: "#ffee80",
    fg: "#1a1a1a",
    muted: "#4a4208",
    faint: "#6e6418",
    primary: "#1a1a1a",
    primaryFg: "#ffd700",
    border: "#d4b400",
    danger: "#8e1010",
    warn: "#5a3c00",
    ok: "#1c5c28",
  },
  "black-carbon": {
    group: "classic",
    light: false,
    bg: "#000000",
    surface: "#1c1c1c",
    surface2: "#2a2a2a",
    fg: "#f0f0f0",
    muted: "#9a9a9a",
    faint: "#6a6a6a",
    primary: "#1c1c1c",
    primaryFg: "#f5f5f5",
    border: "#3a3a3a",
    danger: "#e07070",
    warn: "#e0c060",
    ok: "#80d090",
  },

  "candy-swirl": {
    group: "modern",
    light: true,
    bg: "#fff7fb",
    surface: "#ffffff",
    surface2: "#ffe8f4",
    fg: "#4a2040",
    muted: "#8a6080",
    faint: "#b090a8",
    primary: "#ff7eb3",
    primaryFg: "#3a1028",
    border: "#f0d0e4",
    danger: "#c43050",
    warn: "#c09020",
    ok: "#3a9a68",
    pattern:
      "repeating-conic-gradient(from 20deg at 50% 0%, #ffd6ea 0deg 18deg, #d6f3ff 18deg 36deg, #fff4c4 36deg 54deg, #e0ffd8 54deg 72deg)",
    patternSize: "220% 180%",
  },
  "argyle-heart": {
    group: "modern",
    light: true,
    bg: "#f4e8ee",
    surface: "#fff8fb",
    surface2: "#ead4dc",
    fg: "#3a2030",
    muted: "#7a5868",
    faint: "#a08090",
    primary: "#c45a7a",
    primaryFg: "#fff6f8",
    border: "#e0c8d0",
    danger: "#b03040",
    warn: "#a07820",
    ok: "#3a7a50",
    pattern:
      "repeating-linear-gradient(45deg, transparent 0 14px, rgb(196 90 122 / 0.16) 14px 16px), repeating-linear-gradient(-45deg, transparent 0 14px, rgb(90 140 180 / 0.12) 14px 16px), radial-gradient(circle at 12px 12px, rgb(196 90 122 / 0.35) 2px, transparent 3px)",
    patternSize: "32px 32px",
  },
  "flower-perfume": {
    group: "modern",
    light: true,
    bg: "#f6e8f4",
    surface: "#fff6fc",
    surface2: "#edd4ea",
    fg: "#402040",
    muted: "#806080",
    faint: "#a888a8",
    primary: "#d080c0",
    primaryFg: "#301028",
    border: "#e4cce0",
    danger: "#c04060",
    warn: "#b08820",
    ok: "#4a8a68",
    pattern:
      "radial-gradient(circle at 20% 20%, rgb(232 160 200 / 0.45) 0 8px, transparent 9px), radial-gradient(circle at 80% 30%, rgb(200 180 232 / 0.4) 0 10px, transparent 11px), radial-gradient(circle at 40% 75%, rgb(255 200 220 / 0.5) 0 7px, transparent 8px), radial-gradient(circle at 70% 80%, rgb(216 168 216 / 0.4) 0 9px, transparent 10px)",
    patternSize: "180px 180px",
  },
  "gingham-avocado": {
    group: "modern",
    light: true,
    bg: "#c8e8a8",
    surface: "#d8f0bc",
    surface2: "#e8f8d0",
    fg: "#243818",
    muted: "#4a6840",
    faint: "#6a8860",
    primary: "#5a8a30",
    primaryFg: "#f4ffe8",
    border: "#a8d080",
    danger: "#b04030",
    warn: "#8a6810",
    ok: "#2a6a38",
    pattern:
      "repeating-linear-gradient(0deg, transparent 0 10px, rgb(40 80 20 / 0.1) 10px 20px), repeating-linear-gradient(90deg, transparent 0 10px, rgb(40 80 20 / 0.1) 10px 20px)",
  },
  "pastel-checkers": {
    group: "modern",
    light: true,
    bg: "#d8c0f0",
    surface: "#e8d8f8",
    surface2: "#f4ecfc",
    fg: "#302048",
    muted: "#685888",
    faint: "#9080a8",
    primary: "#b070d8",
    primaryFg: "#fff8ff",
    border: "#c4a8e0",
    danger: "#c04060",
    warn: "#b08820",
    ok: "#3a8a68",
    pattern: "repeating-conic-gradient(#c8a8e8 0% 25%, #eadcf8 0% 50%)",
    patternSize: "28px 28px",
  },
  diner: {
    group: "modern",
    light: true,
    bg: "#f08a40",
    surface: "#f4a060",
    surface2: "#f8b480",
    fg: "#2a1408",
    muted: "#6e3c1c",
    faint: "#8a5830",
    primary: "#c43018",
    primaryFg: "#fff4e8",
    border: "#d07030",
    danger: "#8e1808",
    warn: "#6a4008",
    ok: "#2a5c28",
    pattern:
      "repeating-linear-gradient(90deg, rgb(255 244 220 / 0.28) 0 14px, rgb(180 40 20 / 0.16) 14px 28px)",
  },
  "paper-collage": {
    group: "modern",
    light: true,
    bg: "#f6f1e6",
    surface: "#fffdf8",
    surface2: "#ebe4d4",
    fg: "#2a2418",
    muted: "#6a6458",
    faint: "#948c7c",
    primary: "#4a6aa0",
    primaryFg: "#f4f8ff",
    border: "#ddd4c4",
    danger: "#b04030",
    warn: "#a07820",
    ok: "#3a7a50",
    pattern:
      "linear-gradient(12deg, rgb(244 220 180 / 0.55) 0 14%, transparent 14% 100%), linear-gradient(-18deg, transparent 62%, rgb(220 236 200 / 0.55) 62% 78%, transparent 78%), linear-gradient(8deg, transparent 36%, rgb(240 200 212 / 0.45) 36% 50%, transparent 50%), linear-gradient(-6deg, transparent 82%, rgb(200 216 236 / 0.5) 82% 94%, transparent 94%)",
    patternSize: "100% 100%",
  },
  "space-astronaut": {
    group: "modern",
    light: false,
    bg: "#0a1a48",
    surface: "#12245c",
    surface2: "#1a3070",
    fg: "#e8eefc",
    muted: "#9aacd0",
    faint: "#6a80b0",
    primary: "#7ec8ff",
    primaryFg: "#081428",
    border: "#243868",
    danger: "#ff7a8a",
    warn: "#ffd36a",
    ok: "#80e0a8",
    pattern:
      "radial-gradient(1px 1px at 12% 18%, #fff, transparent), radial-gradient(1px 1px at 28% 72%, #fff, transparent), radial-gradient(1.5px 1.5px at 46% 30%, #fff, transparent), radial-gradient(1px 1px at 62% 84%, #dce8ff, transparent), radial-gradient(1px 1px at 74% 22%, #fff, transparent), radial-gradient(2px 2px at 88% 58%, #fff, transparent), radial-gradient(1px 1px at 8% 90%, #c8d8ff, transparent), radial-gradient(1px 1px at 90% 10%, #fff, transparent)",
    patternSize: "180px 180px",
  },
} as const satisfies Record<string, ShellDef>;

export type ThemeId = keyof typeof SHELLS;

export const CLASSIC_THEMES = (Object.keys(SHELLS) as ThemeId[]).filter(
  (id) => SHELLS[id].group === "classic",
);
export const MODERN_THEMES = (Object.keys(SHELLS) as ThemeId[]).filter(
  (id) => SHELLS[id].group === "modern",
);
export const SHELL_THEMES = Object.keys(SHELLS) as ThemeId[];

export const DEFAULT_THEME: ThemeId = "yellow-black";

const LEGACY: Record<string, ThemeId> = {
  green: "tama-garden",
  white: "white-blue",
  yellow: "yellow-black",
  blue: "white-blue",
  pink: "pink-yellow",
  orange: "diner",
  purple: "purple-pink",
  smoke: "black-carbon",
  "garden-test": "tama-garden",
};

const COLOR_VARS: [keyof ShellDef, string][] = [
  ["bg", "--color-bg"],
  ["surface", "--color-surface"],
  ["surface2", "--color-surface-2"],
  ["fg", "--color-fg"],
  ["muted", "--color-muted"],
  ["faint", "--color-faint"],
  ["primary", "--color-primary"],
  ["primaryFg", "--color-primary-fg"],
  ["border", "--color-border"],
  ["danger", "--color-danger"],
  ["warn", "--color-warn"],
  ["ok", "--color-ok"],
];

export function isThemeId(value: unknown): value is ThemeId {
  return typeof value === "string" && value in SHELLS;
}

export function normalizeTheme(value: unknown): ThemeId {
  if (isThemeId(value)) return value;
  if (typeof value === "string" && value in LEGACY) return LEGACY[value];
  return DEFAULT_THEME;
}

export function isLightTheme(id: ThemeId): boolean {
  return SHELLS[id].light;
}

export function isTriShell(id: ThemeId): boolean {
  return Boolean(SHELLS[id].tri);
}

export function applyTheme(id: ThemeId) {
  if (typeof document === "undefined") return;
  const next = normalizeTheme(id);
  const shell = SHELLS[next];
  const root = document.documentElement;
  root.dataset.theme = next;
  root.dataset.scheme = shell.light ? "light" : "dark";
  root.dataset.shell = shell.tri ? "tri" : "duo";
  for (const [key, css] of COLOR_VARS) {
    const value = shell[key];
    if (typeof value === "string") root.style.setProperty(css, value);
  }
  if (shell.lcdStroke) root.style.setProperty("--color-lcd-stroke", shell.lcdStroke);
  else root.style.removeProperty("--color-lcd-stroke");
  if (shell.accent) root.style.setProperty("--color-accent", shell.accent);
  else root.style.removeProperty("--color-accent");
  root.style.setProperty("--shell-pattern", shell.pattern ?? "none");
  root.style.setProperty("--shell-pattern-size", shell.patternSize ?? "auto");
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", shell.bg);
}
