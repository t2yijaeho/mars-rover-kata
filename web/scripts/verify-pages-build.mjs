import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";

const htmlPath = resolve("dist", "index.html");
const html = await readFile(htmlPath, "utf8");
const failures = [];

if (!html.includes("/mars-rover-kata/assets/")) {
  failures.push("built assets are not rooted at /mars-rover-kata/");
}
if (/["']\/assets\//.test(html)) {
  failures.push("a root-level /assets reference would break on project Pages");
}
if (/fonts\.googleapis\.com|fonts\.gstatic\.com|cdn\.jsdelivr\.net/.test(html)) {
  failures.push("the build contains a runtime CDN dependency");
}
if (!html.includes("Content-Security-Policy")) {
  failures.push("the built page is missing its Content Security Policy");
}

const assetsDirectory = resolve("dist", "assets");
const assetNames = await readdir(assetsDirectory);
for (const assetName of assetNames) {
  const content = await readFile(resolve(assetsDirectory, assetName), "utf8");
  if (content.includes("/api/agent/simulate")) {
    failures.push(`${assetName} contains the local-only API endpoint`);
  }
  if (/OPENAI_API_KEY|sk-[A-Za-z0-9_-]{20,}/.test(content)) {
    failures.push(`${assetName} contains a credential name or key-like value`);
  }
}

if (failures.length > 0) {
  throw new Error(`Pages verification failed:\n- ${failures.join("\n- ")}`);
}

console.log("Pages build verified at /mars-rover-kata/ with no runtime CDN dependency.");
