import { html, raw, esc } from "../html.mjs";
import { displayMath, renderProse } from "../math.mjs";
import { explorationFigure } from "../figures.mjs";

// The homepage's short interactive beat: one situation, seen two ways, and a
// decision that depends on which way you look. Six phases; the visualization on
// the right is persistent and morphs between them.
//
// Decoupling: the renderer knows the six phases and the `table`/`plot` figure
// views. Everything else — copy, numbers, the decision, the checks, the
// transfers — is content. A different representation pair (e.g. diagram → graph)
// would need a new figure view in figures.mjs + a `view` enum entry; the phase
// structure and step machine stay.

const STEPS = [
  ["01", "Situación"],
  ["02", "Representar"],
  ["03", "El límite"],
  ["04", "Replantear"],
  ["05", "Decidir"],
  ["06", "Comprobar"],
];

export function exploration(d) {
  const rail = STEPS.map(
    ([n, label], i) => html`
    <button type="button" class="ex-rail__item" data-goto="${i + 1}"${raw(i === 0 ? ' aria-current="step"' : "")}>
      <span class="ex-rail__n">${n}</span><span class="ex-rail__l">${label}</span>
    </button>`
  ).join("");

  const known = d.known
    .map((k) => html`<li><span>${k.label}</span><b>${k.value}</b></li>`)
    .join("");

  const options = d.decision.options
    .map(
      (o, i) => html`
      <label class="ex-opt">
        <input type="radio" name="ex-choice" value="${o.id}"${raw(o.correct ? ' data-correct="true"' : "")}${raw(
        o.note ? ` data-note="${esc(o.note)}"` : ""
      )}${raw(o.mark != null ? ` data-mark="${esc(o.mark)}"` : "")} />
        <span class="ex-opt__box" aria-hidden="true"></span>
        <span class="ex-opt__label">${o.label}</span>
      </label>`
    )
    .join("");

  const checks = d.validation.checks
    .map(
      (c) => html`
      <li class="ex-check"${raw(c.passOption ? ` data-pass-option="${esc(c.passOption)}"` : "")}>
        <span class="ex-check__mark" aria-hidden="true"></span>
        <span class="ex-check__text">${c.label}${raw(c.detail ? html` <em>${c.detail}</em>` : "")}</span>
      </li>`
    )
    .join("");

  const transfers = d.transfer
    .map(
      (t) => html`
      <div class="ex-t">
        <span class="ex-t__field">${t.field}</span>
        <span class="ex-t__op">${t.operation}</span>
      </div>`
    )
    .join("");

  const figData = d.figure;
  const figAttrs = `data-axis-min="${figData.axis.min}" data-axis-max="${figData.axis.max}"`;

  return html`
<section class="section exploration reveal" id="exploration">
  <div class="wrap">
    <div class="measure">
      <p class="eyebrow">${d.eyebrow}</p>
      ${raw(
        d.demo
          ? '<p class="ex-demo">Contenido de demostración — el ejemplo pedagógico final lo define el equipo editorial.</p>'
          : ""
      )}
      <h2 class="h2">${d.title}</h2>
      <p class="lede">${d.lede}</p>
    </div>

    <div class="ex-shell" data-step="1" data-total="6" ${raw(figAttrs)}>
      <div class="ex-rail" aria-label="Pasos de la exploración">${raw(rail)}</div>

      <div class="ex-body">
        <div class="ex-narrative">
          <article class="ex-step" data-step="1">
            <p class="ex-step__k">01 · Situación</p>
            <p class="ex-q">${d.question}</p>
            <p class="prose">${d.context}</p>
            <ul class="ex-known">${raw(known)}</ul>
          </article>

          <article class="ex-step" data-step="2">
            <p class="ex-step__k">02 · Primera representación</p>
            <h3 class="ex-step__h">${d.initial.title}</h3>
            <p class="prose">${d.initial.description}</p>
            <dl class="ex-pair">
              <div><dt>Conserva</dt><dd>${d.initial.preserves}</dd></div>
              <div><dt>Deja fuera</dt><dd>${d.initial.hides}</dd></div>
            </dl>
          </article>

          <article class="ex-step" data-step="3">
            <p class="ex-step__k">03 · El límite</p>
            <h3 class="ex-step__h">${d.tension.title}</h3>
            <p class="prose">${d.tension.body}</p>
            <p class="ex-q ex-q--tension">${d.tension.question}</p>
          </article>

          <article class="ex-step" data-step="4">
            <p class="ex-step__k">04 · Replantear</p>
            <h3 class="ex-step__h">${d.reframed.title}</h3>
            <p class="prose">${d.reframed.description}</p>
            <dl class="ex-pair">
              <div><dt>No cambia</dt><dd>${d.reframed.invariant}</dd></div>
              <div><dt>Se vuelve visible</dt><dd>${d.reframed.reveals}</dd></div>
            </dl>
            <div class="ex-formal">
              <div class="ex-formal__eq">${raw(displayMath(d.formalization.equation, "exploration.formalization.equation"))}</div>
              <p class="prose">${raw(renderProse(d.formalization.interpretation, "exploration.formalization.interpretation"))}</p>
            </div>
          </article>

          <article class="ex-step" data-step="5">
            <p class="ex-step__k">05 · Decidir</p>
            <p class="ex-q">${d.decision.question}</p>
            <form class="ex-choice">${raw(options)}</form>
            <p class="ex-feedback" data-state="idle" aria-live="polite">
              <span class="ex-feedback__correct">${d.decision.feedback.correct}</span>
              <span class="ex-feedback__incorrect">${d.decision.feedback.incorrect}</span>
              <span class="ex-feedback__note"></span>
            </p>
          </article>

          <article class="ex-step" data-step="6">
            <p class="ex-step__k">06 · Comprobar</p>
            <h3 class="ex-step__h">${d.validation.title}</h3>
            <ul class="ex-checks">${raw(checks)}</ul>
            <div class="ex-transfer">
              <p class="ex-transfer__h">La misma operación en otros contextos</p>
              ${raw(transfers)}
            </div>
          </article>
        </div>

        <div class="ex-figure">
          <div class="ex-figure__frame">
            ${raw(explorationFigure(figData, { view: "morph" }))}
            <div class="ex-figure__nojs">${raw(explorationFigure(figData, { view: "plot" }))}</div>
          </div>
          <p class="ex-figure__cap">Los mismos valores, una vista a la vez.</p>
        </div>
      </div>

      <div class="ex-controls">
        <button type="button" class="ex-nav ex-nav--prev" data-dir="-1" disabled>Anterior</button>
        <span class="ex-progress"><b class="ex-progress__n">01</b><span>/ 06</span></span>
        <button type="button" class="ex-nav ex-nav--next" data-dir="1">Siguiente</button>
      </div>
    </div>
  </div>
</section>`;
}
