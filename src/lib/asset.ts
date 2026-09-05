/** Public file under Vite `base` (`/` locally, `/hatchwatch/` on GitHub Pages). */
export function asset(path: string): string {
  const base = import.meta.env.BASE_URL || "/";
  const clean = path.replace(/^\//, "");
  return `${base.endsWith("/") ? base : `${base}/`}${clean}`;
}

export function routerBasepath(): string | undefined {
  const base = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");
  return base || undefined;
}
