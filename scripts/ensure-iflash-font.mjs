import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/** Decode the committed iFlash face so CSS can url() the TTF. */
export function ensureIflashFont(root = join(dirname(fileURLToPath(import.meta.url)), "..")) {
  const dir = join(root, "src/fonts");
  const ttf = join(dir, "iFlash_502.ttf");
  const b64 = join(dir, "iFlash_502.ttf.b64");
  if (existsSync(ttf)) return ttf;
  if (!existsSync(b64)) {
    console.warn("[hatchwatch] missing src/fonts/iFlash_502.ttf.b64");
    return ttf;
  }
  mkdirSync(dir, { recursive: true });
  writeFileSync(ttf, Buffer.from(readFileSync(b64, "utf8").replace(/\s+/g, ""), "base64"));
  return ttf;
}
