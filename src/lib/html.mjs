// Tiny HTML helpers. No framework, no client runtime — just string building.

const ENT = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

/** Escape text for use in element content or double-quoted attributes. */
export function esc(value) {
  return String(value == null ? "" : value).replace(/[&<>"']/g, (c) => ENT[c]);
}

/** Join class names, dropping falsy entries. */
export function cx(...names) {
  return names.filter(Boolean).join(" ");
}

/**
 * Tagged template that escapes every interpolation by default.
 * Wrap a value in `raw()` to opt out (already-safe HTML: KaTeX output, SVG).
 */
export function html(strings, ...values) {
  let out = strings[0];
  for (let i = 0; i < values.length; i++) {
    out += renderValue(values[i]) + strings[i + 1];
  }
  return out;
}

function renderValue(v) {
  if (v == null || v === false) return "";
  if (v instanceof Raw) return v.value;
  if (Array.isArray(v)) return v.map(renderValue).join("");
  return esc(v);
}

class Raw {
  constructor(value) {
    this.value = value;
  }
}

/** Mark a string as trusted HTML so `html` will not escape it. */
export function raw(value) {
  return new Raw(Array.isArray(value) ? value.join("") : String(value));
}

/** Collapse runs of whitespace between tags — keeps built pages compact. */
export function collapse(str) {
  return str.replace(/>\s+</g, "><").trim();
}
