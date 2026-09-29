import { readdir, readFile, stat } from "node:fs/promises";
import { resolve, extname } from "node:path";
import { execFileSync } from "node:child_process";
const root = resolve(import.meta.dirname, "..");
let checked = 0;
async function walk(dir) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = resolve(dir, e.name);
    if (e.isDirectory()) {
      await walk(p);
      continue;
    }
    if (![".html", ".js", ".css"].includes(extname(p))) continue;
    const s = await readFile(p, "utf8");
    if (extname(p) === ".js") execFileSync(process.execPath, ["--check", p]);
    if (/https:\/\/www\.figma\.com\/api\/mcp\/asset\//.test(s))
      throw Error(`Temporary asset URL in ${p}`);
    for (const m of s.matchAll(/[A-Za-z0-9_-]+\.(?:svg|png|jpe?g)/g)) {
      const a = resolve(root, "dist/assets", m[0]);
      if (!(await stat(a)).size) throw Error(`Empty asset: ${a}`);
    }
    checked++;
  }
}
await walk(resolve(root, "dist"));
console.log(
  `Checked ${checked} HTML/CSS/JS files: syntax and local asset references passed.`,
);
