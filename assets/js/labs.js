/* ===========================================================================
   tau.education — Tau Labs class renderer + in-browser recompute.

   1. Renders the notebook from data/labs/<slug>.json (single source of truth).
   2. On load, if the CSV can be fetched, re-runs the actual computation in
      pure JavaScript (Gauss-Newton fit + bisection + sensitivity) and marks the
      affected cells as "recalculado en tu navegador". Falls back silently to
      the curated values when fetch is unavailable (e.g. opened via file://).
   3. "Ejecutar con Python real" lazily loads Pyodide (assets/js/labs-pyodide.js)
      only when the user clicks it.
   =========================================================================== */

import { config } from "./config.js";

const $ = (sel, root = document) => root.querySelector(sel);
const el = (tag, cls, html) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (html != null) n.innerHTML = html;
  return n;
};
const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));

/* --- tiny Python highlighter ------------------------------------------------ */
const KW = /\b(import|from|as|def|return|for|in|if|else|elif|lambda|assert|while|and|or|not|None|True|False|range|print|class)\b/g;
function pyHighlight(src) {
  const lines = src.split("\n").map((line) => {
    const ci = line.indexOf("#");
    let code = ci >= 0 ? line.slice(0, ci) : line;
    let comment = ci >= 0 ? line.slice(ci) : "";
    code = esc(code)
      .replace(/(&quot;[^&]*&quot;|&#39;[^&]*&#39;|"[^"]*"|'[^']*')/g, '<span class="tok-str">$1</span>')
      .replace(KW, '<span class="tok-kw">$1</span>');
    if (comment) comment = `<span class="tok-com">${esc(comment)}</span>`;
    return code + comment;
  });
  return lines.join("\n");
}

/* --- numerics ------------------------------------------------------------- */
// T(t) = Ts + A * exp(-k t)
function fitNewtonCooling(t, y, Ts, A0 = 32, k0 = 0.007, iters = 60) {
  let A = A0, k = k0;
  for (let it = 0; it < iters; it++) {
    let JtJ00 = 0, JtJ01 = 0, JtJ11 = 0, Jtr0 = 0, Jtr1 = 0;
    for (let i = 0; i < t.length; i++) {
      const e = Math.exp(-k * t[i]);
      const r = Ts + A * e - y[i];
      const dA = e;
      const dk = -A * t[i] * e;
      JtJ00 += dA * dA; JtJ01 += dA * dk; JtJ11 += dk * dk;
      Jtr0 += dA * r; Jtr1 += dk * r;
    }
    const det = JtJ00 * JtJ11 - JtJ01 * JtJ01;
    if (!isFinite(det) || Math.abs(det) < 1e-18) break;
    const dAstep = (JtJ11 * Jtr0 - JtJ01 * Jtr1) / det;
    const dkstep = (JtJ00 * Jtr1 - JtJ01 * Jtr0) / det;
    A -= dAstep; k -= dkstep;
    if (Math.abs(dAstep) < 1e-9 && Math.abs(dkstep) < 1e-12) break;
  }
  // R^2 and max residual
  const mean = y.reduce((s, v) => s + v, 0) / y.length;
  let ssRes = 0, ssTot = 0, maxAbs = 0;
  for (let i = 0; i < t.length; i++) {
    const pred = Ts + A * Math.exp(-k * t[i]);
    const r = y[i] - pred;
    ssRes += r * r; ssTot += (y[i] - mean) ** 2;
    maxAbs = Math.max(maxAbs, Math.abs(r));
  }
  return { A, k, r2: 1 - ssRes / ssTot, maxResid: maxAbs };
}

function bisect(fn, a, b, iters) {
  const steps = [];
  let fa = fn(a);
  for (let n = 0; n < iters; n++) {
    const m = (a + b) / 2;
    const fm = fn(m);
    steps.push({ n, a, b, m });
    if (fa * fm <= 0) { b = m; } else { a = m; fa = fm; }
  }
  return { root: (a + b) / 2, steps };
}

function clockFromOffset(clockStr, minutes) {
  const [h, m] = clockStr.split(":").map(Number);
  let total = h * 3600 + m * 60 + Math.round(minutes * 60);
  total = ((total % 86400) + 86400) % 86400;
  const hh = Math.floor(total / 3600);
  const mm = Math.floor((total % 3600) / 60);
  const ss = total % 60;
  return [hh, mm, ss].map((x) => String(x).padStart(2, "0")).join(":");
}

function parseCSV(text) {
  const rows = text.trim().split(/\r?\n/);
  rows.shift(); // header t_min,T_bloque_C
  const t = [], y = [];
  for (const line of rows) {
    const [a, b] = line.split(",").map(Number);
    if (isFinite(a) && isFinite(b)) { t.push(a); y.push(b); }
  }
  return { t, y };
}

/* --- figure ------------------------------------------------------------- */
function figureSVG(t, y, fit, Ts) {
  const W = 620, H = 200, x0 = 46, x1 = 610, yTop = 20, yBot = 155;
  const tMax = Math.max(...t);
  const yMin = Math.min(...y) - 2, yMax = Math.max(...y) + 2;
  const sx = (tv) => x0 + (tv / tMax) * (x1 - x0);
  const sy = (yv) => yBot - ((yv - yMin) / (yMax - yMin)) * (yBot - yTop);
  let curve = "";
  for (let i = 0; i <= 80; i++) {
    const tv = (i / 80) * tMax;
    const yv = Ts + fit.A * Math.exp(-fit.k * tv);
    curve += (i === 0 ? "M" : "L") + sx(tv).toFixed(1) + " " + sy(yv).toFixed(1) + " ";
  }
  const pts = t.map((tv, i) => `<circle cx="${sx(tv).toFixed(1)}" cy="${sy(y[i]).toFixed(1)}" r="2.6"/>`).join("");
  const gy = [yMin, (yMin + yMax) / 2, yMax];
  const ylab = gy.map((v) => `<text x="8" y="${(sy(v) + 4).toFixed(0)}">${v.toFixed(0)}</text>`).join("");
  const gridY = [0, 0.33, 0.66, 1].map((f) => {
    const yy = (yTop + f * (yBot - yTop)).toFixed(0);
    return `M${x0} ${yy}H${x1}`;
  }).join("");
  const xt = [0, 0.5, 1].map((f) => {
    const tv = f * tMax;
    return `<text x="${(sx(tv) - 6).toFixed(0)}" y="174">${tv.toFixed(0)}</text>`;
  }).join("");
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Temperatura contra tiempo: datos y ajuste">
    <g stroke="var(--line-10)" stroke-width="1" fill="none"><path d="${gridY}"/></g>
    <path d="M${x0} ${yTop}V${yBot}H${x1}" stroke="var(--line-30)" stroke-width="1" fill="none"/>
    <path d="${curve.trim()}" stroke="var(--accent)" stroke-width="1.6" fill="none"/>
    <g fill="var(--light)">${pts}</g>
    <g font-family="var(--font-mono)" font-size="10" fill="var(--fg-meta)">${ylab}${xt}</g>
  </svg>`;
}

/* --- cell renderers ---------------------------------------------------- */
function renderCell(cell) {
  switch (cell.type) {
    case "markdown": {
      const wrap = el("div", cell.boxed ? "nb-md nb-pause" : "nb-md");
      if (cell.h2) wrap.appendChild(el("h2", null, esc(cell.h2)));
      (cell.p || []).forEach((p) => wrap.appendChild(el("p", null, esc(p))));
      return wrap;
    }
    case "chips": {
      const w = el("div", "flex-wrap");
      w.style.margin = "0 0 22px";
      cell.items.forEach((c) => w.appendChild(el("span", "chip", esc(c))));
      return w;
    }
    case "pause":
      return el("div", "nb-pause", `<p><b>Antes de continuar:</b> ${esc(cell.text)}</p>`);
    case "code": {
      const w = el("div", "nb-code");
      w.innerHTML = `<span class="nb-prompt nb-prompt--in" aria-hidden="true">In [${cell.n}]:</span>
        <pre><code>${pyHighlight(cell.source)}</code></pre>`;
      return w;
    }
    case "output": {
      const w = el("div", "nb-code nb-code--out");
      w.dataset.out = cell.kind || "";
      w.innerHTML = `<span class="nb-prompt nb-prompt--out" aria-hidden="true">Out[${cell.n}]:</span>
        <pre>${esc(cell.source)}</pre>`;
      return w;
    }
    case "table": {
      const w = el("div", "nb-code nb-code--out");
      const cols = cell.columns.length;
      const head = cell.columns.map((c) => `<span class="head">${esc(c)}</span>`).join("");
      const body = cell.rows.map((r) =>
        r.map((v, i) => `<span class="${i === 0 ? "idx" : ""}">${esc(v)}</span>`).join("")
      ).join("");
      w.innerHTML = `<span class="nb-prompt nb-prompt--out" aria-hidden="true">Out[${cell.n}]:</span>
        <div class="nb-table"><div class="nb-table__grid" style="grid-template-columns:56px repeat(${cols - 1},1fr)">${head}${body}</div></div>`;
      return w;
    }
    case "note":
      return el("p", "nb-note", esc(cell.text));
    case "formula":
      return el("div", "nb-formula", `<div class="eq">${cell.eq}</div><div class="solved">${cell.solved}</div>`);
    case "boxes": {
      const w = el("div", "nb-boxes");
      cell.items.forEach((b) => w.appendChild(el("div", "nb-box",
        `<div class="nb-box__label">${esc(b.label)}</div><p>${esc(b.text)}</p>`)));
      return w;
    }
    case "figure": {
      const w = el("div", "nb-figure");
      w.dataset.figure = "1";
      w.innerHTML = `<div class="nb-figure__head"><span>${esc(cell.caption)}</span><span>${esc(cell.fig)}</span></div>
        <div data-figure-body><p class="nb-note">La figura se dibuja con los datos al servir el sitio.</p></div>`;
      return w;
    }
    case "result": {
      const w = el("div", "nb-result-grid");
      w.innerHTML = `
        <div class="nb-result" data-result>
          <div class="nb-result__label">RESULTADO</div><p>${cell.text}</p>
        </div>
        <div class="nb-aside">
          <div class="nb-aside__label">${esc(cell.aside.label)}</div><p>${esc(cell.aside.text)}</p>
        </div>`;
      return w;
    }
    case "sensitivity": {
      const w = el("div", "nb-cells-3");
      w.dataset.sensitivity = "1";
      cell.items.forEach((s) => w.appendChild(el("div", null,
        `<div class="k">${esc(s.k)}</div><div class="v">${esc(s.v)}</div>`)));
      return w;
    }
    case "transfer": {
      const w = el("div", "nb-transfer");
      cell.items.forEach((c) => w.appendChild(el("div", null,
        `<div class="k">${esc(c.k)}</div><h3>${esc(c.titulo)}</h3><p>${esc(c.pregunta)}</p>`)));
      return w;
    }
    default:
      return el("div");
  }
}

/* --- main ------------------------------------------------------------- */
export async function initLabsClass(rootSel = "#labs-notebook") {
  const nbHost = $(rootSel);
  if (!nbHost) return;
  const slug = nbHost.dataset.class;
  let data;
  try {
    data = await (await fetch(`/data/labs/${slug}.json`)).json();
  } catch {
    nbHost.innerHTML = `<div class="nb-section"><p class="nb-md">No se pudo cargar la clase. <a href="/data/labs/${slug}.ipynb" download>Descargar el cuaderno (.ipynb)</a>.</p></div>`;
    return;
  }

  document.title = `${data.meta.h1Mobile} · Tau Labs`;

  // hero
  const hero = $("#labs-hero");
  if (hero) {
    hero.innerHTML = `
      <p class="eyebrow">${esc(data.meta.eyebrow)}</p>
      <h1 class="h1-page">${esc(data.meta.h1)}</h1>
      <p class="lead" style="margin-top:26px">${esc(data.meta.lead)}</p>
      <div class="labs-meta">${data.meta.chips.map((c, i) =>
        `<span class="${i === data.meta.chips.length - 1 ? "has-dataset" : ""}">${esc(c)}</span>`).join("")}</div>`;
  }

  // rail
  const rail = $("#labs-rail");
  rail.innerHTML = `
    <div class="labs-rail__label">Estructura</div>
    <div class="labs-rail__list">
      ${data.sections.map((s, i) => `
        <a href="#${s.id}"${i === 0 ? ' class="is-active"' : ""}>
          <span>${String(i + 1).padStart(2, "0")}</span>${esc(data.rail[i])}
        </a>`).join("")}
    </div>
    <div class="labs-rail__foot">${data.sections.length} etapas<br>${esc(data.runtime)}</div>`;

  // notebook
  const nb = $("#labs-notebook");
  nb.innerHTML = `
    <div class="notebook__bar">
      <span>${esc(data.notebookPath)}</span>
      <div class="notebook__actions">
        <a class="nb-action" href="${esc(data.ipynb)}" download>Descargar .ipynb</a>
        <button class="nb-action nb-action--accent" type="button" data-run-python>Ejecutar con Python real</button>
      </div>
    </div>`;
  data.sections.forEach((s) => {
    const sec = el("section", "nb-section");
    sec.id = s.id;
    sec.appendChild(el("div", "nb-label", esc(s.label)));
    s.cells.forEach((c) => sec.appendChild(renderCell(c)));
    nb.appendChild(sec);
  });

  // scroll-spy
  const links = [...rail.querySelectorAll("a")];
  const byId = new Map(links.map((a) => [a.getAttribute("href").slice(1), a]));
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        links.forEach((a) => a.classList.remove("is-active"));
        byId.get(e.target.id)?.classList.add("is-active");
      }
    });
  }, { rootMargin: "-30% 0px -60% 0px" });
  data.sections.forEach((s) => io.observe(document.getElementById(s.id)));

  // Python (Pyodide) button
  nb.querySelector("[data-run-python]").addEventListener("click", async (ev) => {
    const btn = ev.currentTarget;
    btn.disabled = true;
    btn.textContent = "Cargando Python…";
    try {
      const mod = await import("./labs-pyodide.js");
      await mod.runNotebook({ data, nb, button: btn });
    } catch (err) {
      btn.disabled = false;
      btn.textContent = "No se pudo cargar Python — reintentar";
      console.error(err);
    }
  });

  // --- in-browser recompute (pure JS) ---
  recompute(data, nb).catch((e) => console.info("Recompute no disponible:", e.message));
}

async function recompute(data, nb) {
  const c = data.compute;
  const res = await fetch(c.csv);
  if (!res.ok) throw new Error("CSV " + res.status);
  const { t, y } = parseCSV(await res.text());

  const state = { Ts: c.tSala };
  const apply = () => {
    const fit = fitNewtonCooling(t, y, state.Ts, c.p0.A, c.p0.k);
    const T = (tv) => state.Ts + fit.A * Math.exp(-fit.k * tv);
    const { root, steps } = bisect((tv) => T(tv) - c.target, c.bisectBracket[0], c.bisectBracket[1], c.bisectIters);
    const clock = clockFromOffset(c.firstMeasurementClock, root);

    // fit output cell
    const fitCell = nb.querySelector('[data-out="fit"] pre');
    if (fitCell) fitCell.textContent =
      `A = ${fit.A.toFixed(3)} °C   k = ${fit.k.toFixed(6)} min⁻¹\n` +
      `R² = ${fit.r2.toFixed(5)}   max|residuo| = ${fit.maxResid.toFixed(3)} °C`;

    // iteration output cell
    const itCell = nb.querySelector('[data-out="iterations"] pre');
    if (itCell) {
      const m = (v, d = 4) => v.toFixed(d).replace("-", "−");
      const show = [0, 4, 8, 12, steps.length - 1];
      itCell.textContent = "n   intervalo (min)              medio\n" +
        show.map((i) => {
          const s = steps[i];
          return `${String(s.n).padEnd(3)} [${m(s.a)}, ${m(s.b)}]`.padEnd(34) + m(s.m);
        }).join("\n");
    }

    // result cell
    const rc = nb.querySelector("[data-result] p");
    if (rc) rc.innerHTML =
      `El corte ocurrió ≈<b>${Math.abs(root).toFixed(2)} min</b> antes del reinicio: alrededor de las <b>${clock}</b>.`;

    // sensitivity
    const sens = nb.querySelector("[data-sensitivity]");
    if (sens) {
      const rootAt = (Ts, mask) => {
        const tt = [], yy = [];
        for (let i = 0; i < t.length; i++) if (!mask || t[i] <= 120) { tt.push(t[i]); yy.push(y[i]); }
        const f = fitNewtonCooling(tt, yy, Ts, c.p0.A, c.p0.k);
        const { root: r } = bisect((tv) => Ts + f.A * Math.exp(-f.k * tv) - c.target, c.bisectBracket[0], c.bisectBracket[1], c.bisectIters);
        return r;
      };
      const rLo = rootAt(state.Ts - c.tSalaSigma, false);
      const rHi = rootAt(state.Ts + c.tSalaSigma, false);
      const r120 = rootAt(state.Ts, true);
      const fmt = (v) => v.toFixed(1).replace("-", "−");
      const vs = sens.querySelectorAll(".v");
      if (vs[1]) vs[1].textContent = `${fmt(rLo)} a ${fmt(rHi)} min`;
      if (vs[2]) vs[2].textContent = `${fmt(r120)} min`;
    }

    // figure
    const figBody = nb.querySelector("[data-figure] [data-figure-body]");
    if (figBody) figBody.innerHTML = figureSVG(t, y, fit, state.Ts);
  };

  apply();

  // badge + T_sala slider on the validation section
  const badge = el("p", "nb-interactive-note",
    "Estas celdas se recalcularon en tu navegador con los datos reales (ajuste Gauss-Newton + bisección). " +
    "Mueve T_sala para ver la sensibilidad del resultado.");
  const sensCell = nb.querySelector("[data-sensitivity]");
  if (sensCell) {
    sensCell.before(badge);
    const slider = el("div", "nb-slider",
      `<span>T_sala</span>
       <input type="range" min="${(c.tSala - 1).toFixed(1)}" max="${(c.tSala + 1).toFixed(1)}" step="0.1" value="${c.tSala}">
       <output>${c.tSala.toFixed(1)} °C</output>`);
    badge.after(slider);
    const input = slider.querySelector("input");
    const out = slider.querySelector("output");
    input.addEventListener("input", () => {
      state.Ts = parseFloat(input.value);
      out.textContent = state.Ts.toFixed(1) + " °C";
      apply();
    });
  }
}
