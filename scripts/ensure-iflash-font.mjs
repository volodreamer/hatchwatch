import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

function readB64(dir) {
  const single = join(dir, "iFlash_502.ttf.b64");
  if (existsSync(single)) return readFileSync(single, "utf8");
  const parts = ["aa", "ab"].map((s) => join(dir, `iFlash_502.ttf.b64.${s}`));
  if (parts.every((p) => existsSync(p))) {
    return parts.map((p) => readFileSync(p, "utf8")).join("");
  }
  return null;
}

/** Decode the committed iFlash face so CSS can url() the TTF. */
export function ensureIflashFont(root = join(dirname(fileURLToPath(import.meta.url)), "..")) {
  const dir = join(root, "src/fonts");
  const ttf = join(dir, "iFlash_502.ttf");
  if (existsSync(ttf)) return ttf;
  const b64 = readB64(dir);
  if (!b64) {
    console.warn("[hatchwatch] missing src/fonts/iFlash_502.ttf.b64");
    return ttf;
  }
  mkdirSync(dir, { recursive: true });
  writeFileSync(ttf, Buffer.from(b64.replace(/\s+/g, ""), "base64"));
  return ttf;
}

const entry = process.argv[1];
if (entry) {
  try {
    if (fileURLToPath(import.meta.url) === entry) {
      const out = ensureIflashFont();
      if (!existsSync(out)) {
        console.error("[hatchwatch] failed to materialize iFlash 502");
        process.exit(1);
      }
      console.log("[hatchwatch] iFlash ready:", out);
    }
  } catch {
    /* imported as a module */
  }
}
