export const CLASSIC_THEMES = [
  "pink-yellow",
  "white-blue",
  "purple-pink",
  "white-red",
  "yellow-black",
  "black-carbon",
] as const;

export const MODERN_THEMES = [
  "candy-swirl",
  "neon-pop",
  "argyle-heart",
  "flower-perfume",
  "tama-garden",
  "gingham-avocado",
  "pastel-checkers",
  "diner",
  "paper-collage",
  "space-astronaut",
] as const;

export const SHELL_THEMES = [...CLASSIC_THEMES, ...MODERN_THEMES] as const;

export type ThemeId = (typeof SHELL_THEMES)[number];

export const DEFAULT_THEME: ThemeId = "yellow-black";

const LIGHT: ReadonlySet<ThemeId> = new Set([
  "pink-yellow",
  "white-blue",
  "white-red",
  "yellow-black",
  "candy-swirl",
  "argyle-heart",
  "flower-perfume",
  "tama-garden",
  "gingham-avocado",
  "pastel-checkers",
  "diner",
  "paper-collage",
]);

const LEGACY: Record<string, ThemeId> = {
  green: "tama-garden",
  white: "white-blue",
  yellow: "yellow-black",
  blue: "white-blue",
  pink: "pink-yellow",
  orange: "diner",
  purple: "purple-pink",
  smoke: "black-carbon",
};

export function isThemeId(value: unknown): value is ThemeId {
  return typeof value === "string" && (SHELL_THEMES as readonly string[]).includes(value);
}

export function normalizeTheme(value: unknown): ThemeId {
  if (isThemeId(value)) return value;
  if (typeof value === "string" && value in LEGACY) return LEGACY[value];
  return DEFAULT_THEME;
}

export function isLightTheme(id: ThemeId): boolean {
  return LIGHT.has(id);
}

export function applyTheme(id: ThemeId) {
  if (typeof document === "undefined") return;
  const next = normalizeTheme(id);
  document.documentElement.dataset.theme = next;
  document.documentElement.dataset.scheme = isLightTheme(next) ? "light" : "dark";
  const meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) return;
  const bg = getComputedStyle(document.documentElement).getPropertyValue("--color-bg").trim();
  if (bg) meta.setAttribute("content", bg);
}
