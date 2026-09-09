import { esc } from "./html.mjs";

const KEYWORDS = new Set(
  "import from as def return for in if elif else while lambda None True False and or not with yield class pass break continue is".split(
    " "
  )
);

/**
 * Minimal read-only Python highlighting: keywords cyan, numeric literals amber,
 * comments faint. Content is written plain; highlighting is presentation.
 */
export function highlightPython(source) {
  return source
    .split("\n")
    .map((line) => {
      const hash = indexOfComment(line);
      const code = hash === -1 ? line : line.slice(0, hash);
      const comment = hash === -1 ? "" : line.slice(hash);
      return highlightCode(code) + (comment ? `<span class="tok-comment">${esc(comment)}</span>` : "");
    })
    .join("\n");
}

// First '#' that is not inside a string literal.
function indexOfComment(line) {
  let quote = null;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (quote) {
      if (c === quote && line[i - 1] !== "\\") quote = null;
    } else if (c === '"' || c === "'") {
      quote = c;
    } else if (c === "#") {
      return i;
    }
  }
  return -1;
}

function highlightCode(code) {
  // Single pass so a wrapper we just inserted can never be re-tokenised.
  const re = /("[^"]*"|'[^']*')|(\b\d+\.?\d*(?:e-?\d+)?\b)|([A-Za-z_][A-Za-z0-9_]*)|([^"'\w]+)/g;
  let out = "";
  let m;
  while ((m = re.exec(code)) !== null) {
    if (m[1]) out += `<span class="tok-str">${esc(m[1])}</span>`;
    else if (m[2]) out += `<span class="tok-num">${esc(m[2])}</span>`;
    else if (m[3]) out += KEYWORDS.has(m[3]) ? `<span class="tok-kw">${m[3]}</span>` : esc(m[3]);
    else out += esc(m[4]);
  }
  return out;
}
