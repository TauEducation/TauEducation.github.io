// KaTeX, rendered once at build time. The client never sees a `\[ … \]`, never
// downloads KaTeX JS, and never gets a layout shift from math typesetting.

import katex from "katex";

/**
 * Render one TeX string to static HTML.
 * @param {string} tex     KaTeX source (no delimiters)
 * @param {object} [opts]
 * @param {boolean} [opts.display=false]  block vs inline
 * @param {string} [opts.path]  field path, for build errors
 * @returns {string} HTML
 */
export function renderMath(tex, opts = {}) {
  const { display = false, path = "math" } = opts;
  try {
    return katex.renderToString(tex, {
      displayMode: display,
      throwOnError: true,
      strict: (code) => (code === "unicodeTextInMathMode" ? "ignore" : "warn"),
      trust: false,
    });
  } catch (err) {
    throw new Error(`KaTeX failed at ${path}: ${err.message}\n  source: ${tex}`);
  }
}

/** Convenience: a display equation wrapped in the site's overflow-safe shell. */
export function displayMath(tex, path) {
  return `<span class="math math--display">${renderMath(tex, { display: true, path })}</span>`;
}

/** Convenience: inline math. */
export function inlineMath(tex, path) {
  return `<span class="math math--inline">${renderMath(tex, { display: false, path })}</span>`;
}

const ENT = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
const escText = (s) => String(s).replace(/[&<>"']/g, (c) => ENT[c]);

/**
 * Render a plain-text string that may contain `$ … $` inline math spans.
 * Text outside the delimiters is HTML-escaped; the math is typeset.
 */
export function renderProse(text, path = "prose") {
  return String(text)
    .split(/\$([^$]+)\$/)
    .map((chunk, i) => (i % 2 === 0 ? escText(chunk) : inlineMath(chunk, `${path} · $…$`)))
    .join("");
}
