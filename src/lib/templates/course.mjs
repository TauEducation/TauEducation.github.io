import { html, raw } from "../html.mjs";
import { displayMath } from "../math.mjs";

export function coursePage(d) {
  const facts = d.facts
    .map(
      (f) => html`
    <div class="tile fact">
      <span class="fact__k">${f.key}</span>
      <span class="fact__v">${f.value}</span>
    </div>`
    )
    .join("");

  const outcomes = d.outcomes
    .map(
      (o) => html`
    <li class="outcome"><span class="outcome__n">${o.n}</span><span>${o.text}</span></li>`
    )
    .join("");

  const modules = d.modules.rows
    .map(
      (m) => html`
    <div class="module">
      <span class="module__n">${m.n}</span>
      <span class="module__t">${m.title}</span>
      <span class="module__d">${m.desc}</span>
      <span class="module__tag">${m.tag}</span>
    </div>`
    )
    .join("");

  const cards = d.programming.cards
    .map(
      (c) => html`
    <div class="prereq">
      <span class="prereq__k">${c.key}</span>
      <span class="prereq__v">${c.value}</span>
    </div>`
    )
    .join("");

  return html`
<section class="section section--hero-tight course-hero">
  <img class="course-hero__wm watermark" src="/assets/tau-mark-light.svg" alt="" aria-hidden="true" />
  <div class="wrap">
    <p class="eyebrow">${d.eyebrow}</p>
    <h1 class="h1">${d.title}</h1>
    <p class="lede lede--wide">${d.lede}</p>
    <div class="tiles tiles--4 course-facts">${raw(facts)}</div>
  </div>
</section>

<section class="section">
  <div class="wrap split split--even">
    <div class="reveal">
      <h2 class="h2 h2--sm">Qué vas a poder hacer</h2>
      <ol class="outcomes">${raw(outcomes)}</ol>
    </div>
    <div class="reveal">
      <h2 class="h2 h2--sm">${d.thread.title}</h2>
      <div class="thread">
        <div class="thread__eq">${raw(displayMath(d.thread.equation, "thread.equation"))}</div>
        <p class="thread__note">${d.thread.note}</p>
      </div>
      <p class="prose">${d.thread.body}</p>
    </div>
  </div>
</section>

<section class="section section--deep">
  <div class="wrap">
    <div class="module-head reveal">
      <h2 class="h2 h2--sm">${d.modules.title}</h2>
      <span class="module-head__meta">${d.modules.summary}</span>
    </div>
    <div class="modules reveal">${raw(modules)}</div>
  </div>
</section>

<section class="section section--paper">
  <div class="wrap split split--even reveal">
    <div>
      <h2 class="h2 h2--sm">${d.programming.title}</h2>
      <p class="prose">${d.programming.paragraphs[0]}</p>
      <p class="prose">${d.programming.paragraphs[1]}</p>
    </div>
    <div class="prereqs">${raw(cards)}</div>
  </div>
</section>`;
}
