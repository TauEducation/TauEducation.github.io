import { html, raw } from "../html.mjs";
import { displayMath } from "../math.mjs";
import { xyFit } from "../figures.mjs";
import { highlightPython } from "../code.mjs";
import { exploration } from "./exploration.mjs";

const arrow = raw('<span class="arrow" aria-hidden="true">→</span>');

/* ---------------------------------------------------------------------- hero */

function hero(d) {
  return html`
<section class="hero">
  <img class="hero__wm watermark" src="/assets/tau-mark-light.svg" alt="" aria-hidden="true" />
  <div class="wrap hero__inner">
    <p class="eyebrow eyebrow--hero">
      <span class="eyebrow__brand">${d.eyebrowBrand}</span>
      <span class="eyebrow__rule" aria-hidden="true"></span>
      <span>${d.eyebrowNote}</span>
    </p>
    <h1 class="h1 hero__title">${d.title}</h1>
    <div class="hero__body">
      <p class="lede">${d.lede}</p>
      <div class="hero__cta">
        <a class="btn btn--primary" href="${d.ctas[0].href}"><span>${d.ctas[0].label}</span>${arrow}</a>
        <a class="btn btn--ghost" href="${d.ctas[1].href}"><span>${d.ctas[1].label}</span>${arrow}</a>
      </div>
    </div>
  </div>
</section>`;
}

function pillars(rows) {
  return html`
<section class="pillars" aria-label="El método">
  <div class="wrap tiles tiles--4">
    ${raw(
      rows
        .map(
          (p) => html`
      <div class="tile pillar">
        <span class="pillar__n">${p.n}</span>
        <span class="pillar__t">${p.title}</span>
        <span class="pillar__d">${p.desc}</span>
      </div>`
        )
        .join("")
    )}
  </div>
</section>`;
}

/* ------------------------------------------------------------------ notebook */

function notebook(d) {
  const c = d.cells;
  const gut = (label) => `<div class="nb-gutter">${label}</div>`;

  const mathCells = c.math.display
    .map((tex, i) => displayMath(tex, `notebook.cells.math.display[${i}]`))
    .join("");

  const callouts = c.callouts
    .map(
      (co, i) => `
    <div class="callout callout--${i === 0 ? "assume" : "decide"}">
      <span class="callout__label">${escLite(co.label)}</span>
      <span class="callout__body">${escLite(co.body)}</span>
    </div>`
    )
    .join("");

  const chips = c.output.metrics
    .map((mstr) => `<span class="chip">${escLite(mstr)}</span>`)
    .join("");

  const transfers = c.closing.transfers
    .map(
      (t) => `
    <div class="transfer">
      <span class="transfer__field">${escLite(t.field)}</span>
      <span class="transfer__what">${escLite(t.what)}</span>
      <span class="transfer__q">${escLite(t.question)}</span>
    </div>`
    )
    .join("");

  return html`
<section class="section section--deep notebook-section">
  <img class="lissajous watermark" src="/assets/lissajous.svg" alt="" aria-hidden="true" />
  <div class="wrap">
    <div class="measure reveal">
      <p class="eyebrow">${d.eyebrow}</p>
      <h2 class="h2">${d.sectionTitle}</h2>
      <p class="lede">${d.sectionLede}</p>
    </div>

    <div class="notebook reveal">
      <div class="notebook__bar">
        <span class="dot" aria-hidden="true"></span>
        <span class="notebook__file">${d.filename}</span>
        <span class="notebook__badge">${d.badge}</span>
      </div>

      <div class="nb-row">
        ${raw(gut("md"))}
        <div class="nb-cell">
          <h3 class="h3">${c.prompt.title}</h3>
          <p class="prose">${c.prompt.body}</p>
        </div>
      </div>

      <div class="nb-row">
        ${raw(gut("tex"))}
        <div class="nb-cell">
          <div class="nb-math">${raw(mathCells)}</div>
          <div class="callouts">${raw(callouts)}</div>
        </div>
      </div>

      <div class="nb-row">
        ${raw(gut("py"))}
        <div class="nb-cell">
          <details class="nb-code">
            <summary>
              <span class="nb-code__sign" aria-hidden="true"></span>
              <span class="nb-code__label"><span class="lbl-closed">${c.code.labelClosed}</span><span class="lbl-open">${c.code.labelOpen}</span></span>
              <span class="nb-code__note">${c.code.reassurance}</span>
            </summary>
            <pre class="code"><code>${raw(highlightPython(c.code.source))}</code></pre>
          </details>
        </div>
      </div>

      <div class="nb-row">
        ${raw(gut("out"))}
        <div class="nb-cell">
          ${raw(xyFit(c.output, { reveal: true }))}
          <div class="chips">${raw(chips)}</div>
        </div>
      </div>

      <div class="nb-row">
        ${raw(gut("md"))}
        <div class="nb-cell">
          <p class="eyebrow eyebrow--amber">${c.closing.label}</p>
          <p class="prose">${c.closing.body}</p>
          <div class="transfers">${raw(transfers)}</div>
        </div>
      </div>
    </div>
  </div>
</section>`;
}

/* --------------------------------------------------------------------- areas */

function areas(d) {
  return html`
<section class="section section--paper">
  <div class="wrap">
    <div class="split reveal">
      <div>
        <p class="eyebrow">${d.eyebrow}</p>
        <h2 class="h2">${d.title}</h2>
      </div>
      <p class="lede">${d.lede}</p>
    </div>
    <div class="rows reveal">
      ${raw(
        d.rows
          .map(
            (r) => html`
      <div class="row">
        <span class="row__n">${r.n}</span>
        <span class="row__t">${r.title}</span>
        <span class="row__d">${r.desc}</span>
        <span class="row__arrow" aria-hidden="true">→</span>
      </div>`
          )
          .join("")
      )}
    </div>
  </div>
</section>`;
}

/* -------------------------------------------------------------------- spaces */

function spaces(d) {
  return html`
<section class="section">
  <div class="wrap">
    <p class="eyebrow reveal">${d.eyebrow}</p>
    <h2 class="h2 reveal">${d.title}</h2>
    <div class="spaces reveal">
      ${raw(
        d.cards
          .map(
            (card) => html`
      <a class="space space--${card.accent}" href="${card.href}">
        <span class="space__kick"><span>${card.kicker}</span><span class="dim">${card.kickerRight}</span></span>
        <span class="h3">${card.title}</span>
        <span class="prose">${card.body}</span>
        <span class="space__chips">${raw(card.chips.map((ch) => html`<span>${ch}</span>`).join(""))}</span>
        <span class="space__cta">${card.cta} →</span>
      </a>`
          )
          .join("")
      )}
    </div>
  </div>
</section>`;
}

/* helper: escape without pulling html tag machinery for plain strings */
function escLite(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

export function homePage(d) {
  return [
    hero(d.hero),
    pillars(d.pillars),
    exploration(d.exploration),
    notebook(d.notebook),
    areas(d.areas),
    spaces(d.spaces),
  ].join("\n");
}
