import { readFileSync, writeFileSync, mkdirSync, rmSync, readdirSync, copyFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { createValidator } from "../src/lib/validate.mjs";
import { document } from "../src/lib/templates/layout.mjs";
import { homePage } from "../src/lib/templates/home.mjs";
import { coursePage } from "../src/lib/templates/course.mjs";
import { labsPage } from "../src/lib/templates/labs.mjs";
import { notFoundPage } from "../src/lib/templates/notfound.mjs";
import { site, routes, COURSE_SLUG } from "../src/site.config.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..");
const SRC = join(ROOT, "src");
const DIST = join(ROOT, "dist");
const NODE_MODULES = join(ROOT, "node_modules");

const VALIDATE_ONLY = process.argv.includes("--validate-only");
const log = (...a) => console.log("  ", ...a);

function readJSON(p) {
  return JSON.parse(readFileSync(p, "utf8"));
}
function write(rel, contents) {
  const out = join(DIST, rel);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, contents);
  log("·", rel, typeof contents === "string" ? `(${contents.length} B)` : "");
}
function copyInto(fromFile, relDir) {
  const base = fromFile.split(/[\\/]/).pop();
  const out = join(DIST, relDir, base);
  mkdirSync(dirname(out), { recursive: true });
  copyFileSync(fromFile, out);
}

/* ------------------------------------------------------------- validation */

const schema = readJSON(join(SRC, "content/schema.json"));
const validator = createValidator(schema);

const content = {
  home: readJSON(join(SRC, "content/home.json")),
  labs: readJSON(join(SRC, "content/labs.json")),
  notfound: readJSON(join(SRC, "content/notfound.json")),
  course: readJSON(join(SRC, "content/course-fundamentos-matematicos-machine-learning.json")),
};

console.log("Validating content…");
validator.validate("home", content.home, "home.json");
validator.validate("labs", content.labs, "labs.json");
validator.validate("notfound", content.notfound, "notfound.json");
validator.validate("course", content.course, "course-fundamentos-matematicos-machine-learning.json");
if (content.course.slug !== COURSE_SLUG) {
  throw new Error(`course slug "${content.course.slug}" != configured "${COURSE_SLUG}"`);
}
log("all four files valid");

if (VALIDATE_ONLY) {
  console.log("\nContent OK.");
  process.exit(0);
}

/* ------------------------------------------------------------------ build */

console.log("\nBuilding pages…");
rmSync(DIST, { recursive: true, force: true });
mkdirSync(DIST, { recursive: true });

const footerData = content.home.footer;

write(
  routes.home.out,
  document({ route: routes.home, body: homePage(content.home), footerData })
);
write(
  routes.course.out,
  document({ route: routes.course, body: coursePage(content.course), footerData })
);
write(
  routes.labs.out,
  document({ route: routes.labs, body: labsPage(content.labs), footerData })
);
write(
  routes.notfound.out,
  document({ route: routes.notfound, body: notFoundPage(content.notfound), footerData })
);

/* ------------------------------------------------------------------ assets */

console.log("\nAssets…");

// stylesheet: concat src/styles/*.css in filename order
const styleDir = join(SRC, "styles");
const styleFiles = readdirSync(styleDir).filter((f) => f.endsWith(".css") && f !== "fonts.css").sort();
const bundledCss = styleFiles.map((f) => `/* ${f} */\n` + readFileSync(join(styleDir, f), "utf8")).join("\n");
write("assets/styles.css", bundledCss);
write("assets/fonts.css", readFileSync(join(styleDir, "fonts.css"), "utf8"));

// self-hosted display/text/mono fonts
for (const f of readdirSync(join(SRC, "fonts"))) {
  if (f.endsWith(".woff2")) copyInto(join(SRC, "fonts", f), "assets/fonts");
}

// KaTeX: css with woff/ttf sources stripped, woff2 fonts only
const katexCssRaw = readFileSync(join(NODE_MODULES, "katex/dist/katex.min.css"), "utf8");
const katexCss = katexCssRaw.replace(
  /,url\(fonts\/[^)]+\.woff\)\s*format\(["']woff["']\),url\(fonts\/[^)]+\.ttf\)\s*format\(["']truetype["']\)/g,
  ""
);
write("assets/katex.min.css", katexCss);
const katexFontsDir = join(NODE_MODULES, "katex/dist/fonts");
for (const f of readdirSync(katexFontsDir)) {
  if (f.endsWith(".woff2")) copyInto(join(katexFontsDir, f), "assets/fonts");
}

// client script
write("assets/app.js", readFileSync(join(SRC, "js/app.js"), "utf8"));

// marks + icons
copyInto(join(SRC, "assets/tau-mark.svg"), "assets");
copyInto(join(SRC, "assets/tau-mark-light.svg"), "assets");
copyInto(join(SRC, "assets/favicon.svg"), "assets");
copyFileSync(join(SRC, "assets/icon-round.png"), join(DIST, "assets/apple-touch-icon.png"));
copyFileSync(join(SRC, "assets/banner-light.png"), join(DIST, "assets/og-image.png"));

// decorative Lissajous curve behind the notebook section
write("assets/lissajous.svg", lissajousSvg());

/* -------------------------------------------------------------- root files */

console.log("\nRoot files…");
write("CNAME", site.domain + "\n");
write(".nojekyll", "");
write("robots.txt", `User-agent: *\nAllow: /\n\nSitemap: ${site.origin}/sitemap.xml\n`);
write("sitemap.xml", sitemap());

console.log("\n✓ Built to dist/");

/* ----------------------------------------------------------------- helpers */

function lissajousSvg() {
  let d = "";
  for (let i = 0; i <= 900; i++) {
    const t = (i / 900) * Math.PI * 2;
    const x = 450 + 400 * Math.sin(3 * t + 1.2);
    const y = 250 + 210 * Math.sin(4 * t);
    d += (i ? " L" : "M") + x.toFixed(1) + " " + y.toFixed(1);
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 500"><path d="${d}" fill="none" stroke="#6fc0d8" stroke-width="1.1"/></svg>\n`;
}

function sitemap() {
  const urls = [routes.home, routes.course, routes.labs].map(
    (r) => `  <url><loc>${site.origin}${r.path}</loc></url>`
  );
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`;
}
