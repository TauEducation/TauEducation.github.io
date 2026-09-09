import { html, raw } from "../html.mjs";
import { displayMath } from "../math.mjs";
import { removableDiscontinuity } from "../figures.mjs";

const arrow = raw('<span class="arrow" aria-hidden="true">→</span>');

export function notFoundPage(d) {
  const exits = d.exits
    .map(
      (e, i) => html`
    <a class="btn ${i === 0 ? "btn--primary" : "btn--ghost"}" href="${e.href}"><span>${e.label}</span>${arrow}</a>`
    )
    .join("");

  const eq = displayMath(d.equation, "notfound.equation");
  // The pulsing halo is motion; the build emits it and CSS/JS suppress it under
  // prefers-reduced-motion.
  const figure = removableDiscontinuity(d.figure, eq, { motion: true });

  return html`
<section class="section notfound">
  <img class="notfound__wm watermark" src="/assets/tau-mark-light.svg" alt="" aria-hidden="true" />
  <div class="wrap split split--even">
    <div>
      <p class="eyebrow eyebrow--amber">${d.eyebrow}</p>
      <h1 class="h1">${d.title}</h1>
      <p class="lede">${d.body}</p>
      <div class="notfound__exits">${raw(exits)}</div>
    </div>
    <div class="notfound__fig">${raw(figure)}</div>
  </div>
</section>`;
}
