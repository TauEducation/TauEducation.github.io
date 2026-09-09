// Every figure on the site is inline SVG generated from numbers, here, at build
// time. No chart library, no client JS, no raster images.
//
// Two rules, both learned from real defects:
//   1. Never interpolate a value inside an SVG <text>. Emit it as a plain child
//      text node of a <text> element built by string concatenation (that is what
//      we do here) — never via a wrapper element in the SVG namespace.
//   2. Size <text> in viewBox units against the element's real rendered width.
//      These figures cap their on-screen width at the viewBox width, so a unit
//      is at most one screen pixel; the sizes below target ~10px there.

import { esc } from "./html.mjs";

/* ------------------------------------------------------------------ helpers */

const fmt = (n) => Number(n.toFixed(2)).toString();

function pathFrom(points) {
  return points.map((p, i) => `${i ? "L" : "M"}${fmt(p[0])} ${fmt(p[1])}`).join(" ");
}

// Least-squares polynomial fit via normal equations (small, well-conditioned
// for the degrees we use). Returns coefficients [a0, a1, …, ad].
function polyfit(xs, ys, degree) {
  const n = xs.length;
  const d = Math.min(degree, n - 1);
  const A = [];
  const b = [];
  for (let i = 0; i <= d; i++) {
    A[i] = [];
    for (let j = 0; j <= d; j++) {
      let s = 0;
      for (let k = 0; k < n; k++) s += Math.pow(xs[k], i + j);
      A[i][j] = s;
    }
    let sb = 0;
    for (let k = 0; k < n; k++) sb += ys[k] * Math.pow(xs[k], i);
    b[i] = sb;
  }
  return solve(A, b);
}

function solve(A, b) {
  const n = b.length;
  for (let col = 0; col < n; col++) {
    let piv = col;
    for (let r = col + 1; r < n; r++) if (Math.abs(A[r][col]) > Math.abs(A[piv][col])) piv = r;
    [A[col], A[piv]] = [A[piv], A[col]];
    [b[col], b[piv]] = [b[piv], b[col]];
    for (let r = col + 1; r < n; r++) {
      const f = A[r][col] / A[col][col];
      for (let c = col; c < n; c++) A[r][c] -= f * A[col][c];
      b[r] -= f * b[col];
    }
  }
  const x = new Array(n).fill(0);
  for (let r = n - 1; r >= 0; r--) {
    let s = b[r];
    for (let c = r + 1; c < n; c++) s -= A[r][c] * x[c];
    x[r] = s / A[r][r];
  }
  return x;
}

const polyval = (coef, x) => coef.reduce((acc, c, i) => acc + c * Math.pow(x, i), 0);

// Deterministic value noise in [-1, 1] — used only where the content itself
// declares the trace is noisy.
function noise(t) {
  return Math.sin(t * 71.3) * Math.cos(t * 23.7) * 0.5 + Math.sin(t * 191.7) * 0.5;
}

/* -------------------------------------------------------------- XY fit plot */

const XY = { W: 620, H: 260, x0: 52, x1: 596, y0: 216, y1: 16, text: 16 };

/**
 * Observed points + a curve least-squares-fitted to those same points.
 * @param {object} fig  the `xy-fit` content object
 * @param {object} [opts] { reveal:boolean } — draw-on animation class
 */
export function xyFit(fig, opts = {}) {
  const { x, y, observed } = fig;
  const sx = (vx) => XY.x0 + ((vx - x.min) / (x.max - x.min)) * (XY.x1 - XY.x0);
  const sy = (vy) => XY.y0 - ((vy - y.min) / (y.max - y.min)) * (XY.y0 - XY.y1);

  const coef = polyfit(observed.map((p) => p[0]), observed.map((p) => p[1]), 3);
  const N = 96;
  const curve = [];
  for (let i = 0; i <= N; i++) {
    const vx = x.min + ((x.max - x.min) * i) / N;
    const vy = Math.max(y.min, Math.min(y.max, polyval(coef, vx)));
    curve.push([sx(vx), sy(vy)]);
  }

  const grid = y.ticks
    .map((t) => `<line x1="${XY.x0}" y1="${fmt(sy(t))}" x2="${XY.x1}" y2="${fmt(sy(t))}" class="fig-grid"/>`)
    .join("");
  const tickText = y.ticks
    .map((t) => `<text x="${XY.x0 - 8}" y="${fmt(sy(t) + XY.text * 0.34)}" text-anchor="end" class="fig-tick">${esc(t)}</text>`)
    .join("");
  const dots = observed
    .map((p) => `<circle cx="${fmt(sx(p[0]))}" cy="${fmt(sy(p[1]))}" r="3" class="fig-obs"/>`)
    .join("");

  const drawn = opts.reveal ? " fig-model--draw" : "";
  const desc = `${esc(fig.caption)}. ${observed.length} puntos observados y una curva ajustada.`;

  return `
<figure class="fig">
  <figcaption class="fig-cap"><span>${esc(fig.caption)}</span><span>${esc(fig.figLabel)}</span></figcaption>
  <svg viewBox="0 0 ${XY.W} ${XY.H}" class="fig-svg fig-svg--xy" role="img" aria-label="${esc(desc)}" preserveAspectRatio="xMidYMid meet">
    <line x1="${XY.x0}" y1="${XY.y1}" x2="${XY.x0}" y2="${XY.y0}" class="fig-axis"/>
    <line x1="${XY.x0}" y1="${XY.y0}" x2="${XY.x1}" y2="${XY.y0}" class="fig-axis"/>
    ${grid}
    ${tickText}
    <path d="${pathFrom(curve)}" class="fig-model${drawn}" pathLength="1"/>
    ${dots}
    <text x="${(XY.x0 + XY.x1) / 2}" y="${XY.H - 8}" text-anchor="middle" class="fig-tick">${esc(x.label)}</text>
  </svg>
</figure>`;
}

/* --------------------------------------------------------------- sparkline */

const SP = { W: 300, H: 90, base: 80, top: 12 };

const SHAPES = {
  "sir-bump": (t) => {
    const z = (t - 0.4) * 6.6;
    return Math.exp(-z * z) * (1 - 0.16 * t);
  },
  "inverse-sqrt": (t) => 0.92 / Math.sqrt(1 + 60 * t) + 0.04,
  "monotone-decay": (t) => 0.94 * Math.exp(-2.1 * t) + 0.03,
  "oscillation-damped": (t) => 0.5 + 0.46 * Math.exp(-2.4 * t) * Math.cos(t * Math.PI * 6.2),
  "noisy-vs-smooth": (t) => 0.5 + 0.4 * Math.sin(t * Math.PI * 1.65) * Math.exp(-0.55 * t),
  "trending-residuals": (t) => 0.5 + (t - 0.5) * 0.7,
};

function sparkPath(fn, steps = 120) {
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const v = Math.max(0, Math.min(1, fn(t)));
    pts.push([t * SP.W, SP.base - (SP.base - SP.top) * v]);
  }
  return pathFrom(pts);
}

/**
 * One sparkline, its shape chosen by the content to be true for that lab.
 * @param {object} figure  { kind:"sparkline", shape, second }
 * @param {string} caption for the aria label
 */
export function sparkline(figure, caption) {
  const base = SHAPES[figure.shape];
  if (!base) throw new Error(`Unknown sparkline shape "${figure.shape}"`);

  let extra = "";
  if (figure.shape === "trending-residuals") {
    // a scatter band with a slope — the honest picture of a wrong model
    let dots = "";
    for (let i = 0; i <= 26; i++) {
      const t = i / 26;
      const v = Math.max(0, Math.min(1, base(t) + noise(t + 0.13) * 0.16));
      dots += `<circle cx="${fmt(t * SP.W)}" cy="${fmt(SP.base - (SP.base - SP.top) * v)}" r="1.6" class="spark-resid"/>`;
    }
    extra = `<path d="${sparkPath(base, 2)}" class="spark spark--trend"/>${dots}`;
  }

  let second = "";
  if (figure.second === "noisy" && figure.shape === "noisy-vs-smooth") {
    second = `<path d="${sparkPath((t) => base(t) + noise(t) * 0.12, 200)}" class="spark spark--second"/>`;
  }

  const primary =
    figure.shape === "trending-residuals"
      ? ""
      : `<path d="${sparkPath(base)}" class="spark spark--primary"/>`;

  return `
<svg viewBox="0 0 ${SP.W} ${SP.H}" class="spark-svg" role="img" aria-label="${esc(caption)}">
  <line x1="0" y1="${SP.base}" x2="${SP.W}" y2="${SP.base}" class="fig-grid"/>
  ${second}
  ${extra}
  ${primary}
</svg>`;
}

/* ----------------------------------------- exploration figure (home, morphing) */

// One SVG that holds the same data twice: as table rows and as points on an
// axis. The client toggles `data-view` and CSS transitions each datum's <g>
// between its two positions — the morph IS the change of representation.
// With no JS the builder emits both a table SVG and a plot SVG (see template).

const EX = { W: 600, H: 252, rowTop: 38, rowH: 40, axisY: 200, x0: 60, x1: 552 };

export function explorationFigure(fig, opts = {}) {
  const { axis, points, cluster = [], center } = fig;
  const view = opts.view || "morph"; // "table" | "plot" | "morph"
  const sx = (v) => EX.x0 + ((v - axis.min) / (axis.max - axis.min)) * (EX.x1 - EX.x0);
  const clusterSet = new Set(cluster);

  // point values read as a set, so give them consistent decimals; axis ticks are
  // round numbers, so let them keep their natural form
  const dec = Math.max(0, ...points.map((p) => (String(p.value).split(".")[1] || "").length));
  const val = (n) => n.toFixed(dec);
  const tickVal = (n) => Number(n.toFixed(4)).toString();

  // stagger the value labels so near-equal points do not overprint: walking
  // left to right, each label climbs a tier while it would still collide with a
  // recent one; up to three tiers, then it resets.
  const order = points
    .map((p, i) => ({ i, x: sx(p.value) }))
    .sort((a, b) => a.x - b.x);
  const tierByIndex = {};
  const recent = []; // { x, tier } within collision distance
  for (const { i, x } of order) {
    while (recent.length && x - recent[0].x >= 40) recent.shift();
    const taken = new Set(recent.map((r) => r.tier));
    let tier = 0;
    while (tier < 2 && taken.has(tier)) tier++;
    tierByIndex[i] = tier;
    recent.push({ x, tier });
  }

  const pts = points
    .map((p, i) => {
      const tableY = EX.rowTop + 14 + i * EX.rowH;
      const plotX = sx(p.value);
      const inCluster = clusterSet.has(p.id);
      return `
  <g class="ex-pt${inCluster ? " ex-pt--cluster" : ""}" data-id="${esc(p.id)}" data-tier="${tierByIndex[i]}"
     style="--table-x:${EX.x0}px;--table-y:${fmt(tableY)}px;--plot-x:${fmt(plotX)}px;--plot-y:${EX.axisY}px">
    <rect class="ex-mark ex-mark--sq" x="-6" y="-6" width="12" height="12"/>
    <circle class="ex-mark ex-mark--dot" r="5"/>
    <text class="ex-label">${esc(p.label)}</text>
    <text class="ex-value">${esc(val(p.value))}</text>
  </g>`;
    })
    .join("");

  const rules = points
    .map((_, i) => {
      const y = EX.rowTop + i * EX.rowH + EX.rowH;
      return `<line class="ex-rule" x1="${EX.x0}" y1="${fmt(y)}" x2="${EX.x1}" y2="${fmt(y)}"/>`;
    })
    .join("");

  const ticks = axis.ticks
    .map(
      (t) =>
        `<g class="ex-tick"><line x1="${fmt(sx(t))}" y1="${EX.axisY - 5}" x2="${fmt(sx(t))}" y2="${EX.axisY + 5}"/>` +
        `<text x="${fmt(sx(t))}" y="${EX.axisY + 22}" text-anchor="middle">${esc(tickVal(t))}</text></g>`
    )
    .join("");

  const clusterVals = points.filter((p) => clusterSet.has(p.id)).map((p) => p.value);
  const band =
    clusterVals.length > 1
      ? `<rect class="ex-band" x="${fmt(sx(Math.min(...clusterVals)))}" y="${EX.axisY - 26}" width="${fmt(
          sx(Math.max(...clusterVals)) - sx(Math.min(...clusterVals))
        )}" height="52" rx="0"/>`
      : "";

  const centerLine =
    center != null
      ? `<line class="ex-center" x1="${fmt(sx(center))}" y1="${EX.rowTop + 6}" x2="${fmt(sx(center))}" y2="${EX.axisY + 8}"/>` +
        `<text class="ex-center-label" x="${fmt(sx(center) + 7)}" y="${EX.rowTop + 12}" text-anchor="start">x&#772;</text>`
      : "";

  // marker the client moves to the estimate chosen in the decision phase
  const pick = `<line class="ex-pick" x1="0" y1="${EX.rowTop}" x2="0" y2="${EX.axisY + 6}"/>`;

  return `
<svg class="ex-fig-svg" viewBox="0 0 ${EX.W} ${EX.H}" data-view="${view}" role="img"
     aria-label="${esc(axis.label)}: los mismos ${points.length} valores como tabla y como puntos sobre un eje"
     preserveAspectRatio="xMidYMid meet">
  <g class="ex-rules">${rules}</g>
  <line class="ex-axis" x1="${EX.x0}" y1="${EX.axisY}" x2="${EX.x1}" y2="${EX.axisY}"/>
  <g class="ex-ticks">${ticks}</g>
  <text class="ex-axis-label" x="${(EX.x0 + EX.x1) / 2}" y="${EX.H - 6}" text-anchor="middle">${esc(axis.label)}</text>
  ${band}
  ${centerLine}
  ${pick}
  ${pts}
</svg>`;
}

/* ----------------------------------------------- removable discontinuity (404) */

const ND = { W: 560, H: 300, x0: 48, y0: 252, yTop: 20, gap: 292, hole: 128 };

export function removableDiscontinuity(fig, equationHtml, opts = {}) {
  const lineY = (px) => ND.y0 - ((px - ND.x0) / (536 - ND.x0)) * 200 - 8;
  const left = [];
  const right = [];
  for (let i = 0; i <= 40; i++) {
    left.push([ND.x0 + 12 + ((ND.gap - ND.x0 - 24) * i) / 40, 0]);
    right.push([ND.gap + 6 + ((536 - ND.gap - 6) * i) / 40, 0]);
  }
  left.forEach((p) => (p[1] = lineY(p[0])));
  right.forEach((p) => (p[1] = lineY(p[0])));

  const halo = opts.motion
    ? `<circle cx="${ND.gap}" cy="${ND.hole}" r="7" class="nf-halo"/>`
    : "";
  const drawn = opts.motion ? " fig-model--draw" : "";

  return `
<figure class="fig">
  <figcaption class="fig-cap"><span>${esc(fig.caption)}</span><span>${esc(fig.figLabel)}</span></figcaption>
  <svg viewBox="0 0 ${ND.W} ${ND.H}" class="fig-svg fig-svg--nf" role="img"
       aria-label="${esc(fig.caption)}. La curva llega desde ambos lados; el valor en el hueco no está definido." preserveAspectRatio="xMidYMid meet">
    <line x1="${ND.x0}" y1="${ND.yTop}" x2="${ND.x0}" y2="${ND.y0}" class="fig-axis"/>
    <line x1="${ND.x0}" y1="${ND.y0}" x2="536" y2="${ND.y0}" class="fig-axis"/>
    <line x1="${ND.gap}" y1="${ND.yTop}" x2="${ND.gap}" y2="${ND.y0}" class="nf-gap"/>
    <path d="${pathFrom(left)}" class="nf-branch${drawn}" pathLength="1"/>
    <path d="${pathFrom(right)}" class="nf-branch${drawn}" pathLength="1"/>
    ${halo}
    <circle cx="${ND.gap}" cy="${ND.hole}" r="6.5" class="nf-hole"/>
    <text x="${ND.gap + 16}" y="${ND.hole - 4}" class="nf-label">${esc(fig.holeLabel)}</text>
    <text x="${ND.gap}" y="${ND.y0 + 26}" text-anchor="middle" class="fig-tick">${esc(fig.axisNote)}</text>
  </svg>
  <div class="fig-eq">${equationHtml}</div>
</figure>`;
}
