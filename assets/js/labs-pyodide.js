/* ===========================================================================
   tau.education — OPTIONAL: run the Tau Labs notebook with real Python.
   Loaded on demand by labs.js only when the visitor clicks
   "Ejecutar con Python real". Pulls Pyodide + numpy/scipy/pandas from the CDN
   configured in config.js (integrations.pyodideIndexUrl).
   =========================================================================== */

import { config } from "./config.js";

let pyodidePromise = null;

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src; s.onload = resolve; s.onerror = () => reject(new Error("No se pudo cargar " + src));
    document.head.appendChild(s);
  });
}

async function getPyodide(onStatus) {
  if (pyodidePromise) return pyodidePromise;
  pyodidePromise = (async () => {
    const base = config.integrations.pyodideIndexUrl.replace(/\/?$/, "/");
    onStatus("Descargando Pyodide…");
    await loadScript(base + "pyodide.js");
    const pyodide = await globalThis.loadPyodide({ indexURL: base });
    onStatus("Cargando numpy, scipy y pandas…");
    await pyodide.loadPackage(["numpy", "scipy", "pandas"]);
    return pyodide;
  })();
  return pyodidePromise;
}

const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));

export async function runNotebook({ data, nb, button }) {
  const setStatus = (t) => { button.textContent = t; };

  // panel
  let panel = nb.querySelector("#py-panel");
  if (!panel) {
    panel = document.createElement("section");
    panel.id = "py-panel";
    panel.className = "nb-section";
    panel.innerHTML = `<div class="nb-label">Ejecución con Python real</div>
      <p class="nb-note" id="py-status">Preparando…</p><div id="py-cells"></div>`;
    nb.appendChild(panel);
    panel.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  const status = panel.querySelector("#py-status");
  const cells = panel.querySelector("#py-cells");
  cells.innerHTML = "";

  const pyodide = await getPyodide((t) => { status.textContent = t; setStatus(t); });

  status.textContent = "Cargando el dataset…";
  const csv = await (await fetch(data.compute.csv)).text();
  pyodide.FS.mkdirTree("data");
  pyodide.FS.writeFile("data/bloque_termico.csv", csv);

  // fetch the real notebook and pull its code cells
  const ipynb = await (await fetch(data.ipynb)).json();
  const codeCells = ipynb.cells.filter((c) => c.cell_type === "code");

  // stdout capture
  pyodide.runPython(`
import sys, io
class _Cap(io.StringIO):
    def __init__(self): super().__init__(); self.buf = ""
    def write(self, s): self.buf += s; return len(s)
_cap = _Cap()
`);

  setStatus("Ejecutando…");
  let n = 1;
  for (const cell of codeCells) {
    const src = Array.isArray(cell.source) ? cell.source.join("") : cell.source;
    const box = document.createElement("div");
    box.className = "nb-code";
    box.innerHTML = `<span class="nb-prompt nb-prompt--in" aria-hidden="true">In [${n}]:</span><pre><code>${esc(src)}</code></pre>`;
    cells.appendChild(box);

    let out = "", err = "";
    try {
      pyodide.runPython("_cap.buf = ''; _stdout_bak = sys.stdout; sys.stdout = _cap");
      const result = await pyodide.runPythonAsync(src);
      pyodide.runPython("sys.stdout = _stdout_bak");
      out = pyodide.runPython("_cap.buf");
      if (result !== undefined && result !== null) {
        const r = typeof result?.toString === "function" ? result.toString() : String(result);
        if (r && r !== "undefined") out += (out && !out.endsWith("\n") ? "\n" : "") + r;
      }
    } catch (e) {
      pyodide.runPython("sys.stdout = _stdout_bak");
      err = String(e).split("\n").slice(-4).join("\n");
    }
    if (out || err) {
      const ob = document.createElement("div");
      ob.className = "nb-code nb-code--out";
      ob.innerHTML = `<span class="nb-prompt nb-prompt--out" aria-hidden="true">Out[${n}]:</span><pre>${esc(err || out)}</pre>`;
      cells.appendChild(ob);
    }
    n++;
  }

  status.textContent = "Ejecución completa. Los números provienen de Python (numpy/scipy/pandas) en tu navegador.";
  button.textContent = "Volver a ejecutar";
  button.disabled = false;
}
