import { html, raw } from "../html.mjs";
import { sparkline } from "../figures.mjs";

export function labsPage(d) {
  const cards = d.items
    .map(
      (l) => html`
    <article class="lab reveal">
      <span class="lab__meta"><span>${l.n}</span><span class="dim">${l.field}</span></span>
      <div class="lab__fig">${raw(sparkline(l.figure, `${l.caption} — ${l.title}`))}</div>
      <span class="lab__cap">${l.caption}</span>
      <h2 class="h3">${l.title}</h2>
      <p class="prose">${l.desc}</p>
      <span class="lab__metrics">${raw(l.metrics.map((m) => html`<span>${m}</span>`).join(""))}</span>
    </article>`
    )
    .join("");

  return html`
<section class="section section--hero-tight labs-hero">
  <img class="labs-hero__wm watermark" src="/assets/tau-mark-light.svg" alt="" aria-hidden="true" />
  <div class="wrap">
    <p class="eyebrow eyebrow--cyan">${d.eyebrow}</p>
    <h1 class="h1">${d.title}</h1>
    <p class="lede lede--wide">${d.lede}</p>
  </div>
</section>

<section class="section section--flush-top">
  <div class="wrap">
    <div class="labs-grid">${raw(cards)}</div>
  </div>
</section>

<section class="section section--deep">
  <div class="wrap split split--even reveal">
    <div>
      <h2 class="h2 h2--sm">${d.closing.title}</h2>
      <p class="prose">${d.closing.body}</p>
    </div>
    <a class="btn btn--ghost btn--inline" href="${d.closing.href}"><span>${d.closing.cta}</span><span class="arrow" aria-hidden="true">→</span></a>
  </div>
</section>`;
}
