// /workshops/<slug>-<id>/ — landing page template, reused by every workshop.
// Structure and density follow the Claude Design handoff exactly
// (v3/Tau Workshop Landing v4.dc.html); only the copy varies by registry entry.
//
// The prototype's Nombre/Email inputs and its local idle/error/submitting/
// success state machine are NOT reimplemented here: systeme.io owns the real
// form and its submit (see systeme-form.mjs). That is an intentional
// deviation from the .dc.html prototype, not an oversight — the handoff
// itself says the prototype form is a stand-in for the CRM integration.

import { html, raw } from "../html.mjs";
import { renderMath } from "../math.mjs";
import { learningLoopDiagram } from "../workshop-figures.mjs";
import { systemeWorkshopForm, systemeWorkshopFormMount, registrationClosedNotice } from "./systeme-form.mjs";
import { workshopBrand, modalShell } from "./workshop-layout.mjs";
import {
  formatWorkshopDate,
  formatWorkshopTime,
  formatWorkshopDateWithYear,
  formatWorkshopTimeRange24h,
  canRegister,
  isRegistrationCutoffPassed,
  PLACEHOLDER_INSTRUCTOR,
} from "../workshops.mjs";

function metaLine(w) {
  const fecha = formatWorkshopDate(w);
  const hora = formatWorkshopTime(w);
  return `${fecha} · ${hora} (CDMX) · En vivo por Google Meet · ${w.durationMinutes} min`;
}

function formulaRow(formulas) {
  return formulas
    .map(
      (f) => html`
    <div class="wsp-formula${f.amber ? " wsp-formula--amber" : ""}">
      <span class="wsp-formula__label">${f.label}</span>
      <span class="wsp-formula__tex">${raw(renderMath(f.tex, { path: `workshop.journey.formulas[${f.label}]` }))}</span>
    </div>`
    )
    .join("");
}

/**
 * The hero's registration slot. Three cases:
 *  - registration disabled (status/open flag off): the pre-existing "ya
 *    ocurrió" notice — unrelated to the cutoff feature, unchanged.
 *  - enabled, no registration.closesAt configured: the original, unmodified
 *    eager systeme.io embed — a workshop that opts out of a cutoff keeps
 *    today's exact behavior.
 *  - enabled with a closesAt: render BOTH sub-states (lazy form mount +
 *    closed notice), one `hidden`. The `hidden` attribute reflects only a
 *    build-time guess (todo/best-effort for a stale static build, or for a
 *    visitor with JS disabled — see src/js/workshop.js's module comment for
 *    that documented limitation); src/js/workshop.js re-derives the truth
 *    from the visitor's own real clock on every load and is authoritative.
 */
function heroRegistrationBlock(workshop, registrationOpen) {
  if (!registrationOpen) return registrationClosedNotice();
  if (!workshop.registration.closesAt) return systemeWorkshopForm(workshop);

  const cutoffPassed = isRegistrationCutoffPassed(workshop);
  return html`
${raw(systemeWorkshopFormMount(workshop, cutoffPassed))}
<div data-registration-closed-cutoff class="wsp-form-shell wsp-registration-closed" ${cutoffPassed ? false : "hidden"}>
  ${raw(registrationClosedCutoffNotice(workshop))}
</div>`;
}

function registrationClosedCutoffNotice(workshop) {
  const c = workshop.copy.landing;
  const rc = c.registrationClosed;
  return html`
<p class="wsp-eyebrow">${rc.eyebrow}</p>
<p class="wsp-lede-sm">${rc.heading}</p>
<p class="wsp-body">${c.h1}</p>
<p class="wsp-meta">${formatWorkshopDateWithYear(workshop)}</p>
<p class="wsp-meta">${formatWorkshopTimeRange24h(workshop)} (CDMX)</p>
<p class="wsp-body wsp-body--dim">${rc.closingNote}</p>
<p class="wsp-body wsp-body--dim">${rc.returnNotePrefix} <a href="/workshops/">${rc.returnLinkLabel}</a>.</p>`;
}

function faqItem(item, index) {
  return html`
<div class="wsp-faq__item">
  <button type="button" class="wsp-faq__q" data-faq-toggle aria-expanded="false" aria-controls="wsp-faq-a-${index}">
    <span>${item.q}</span><span class="wsp-faq__sign" aria-hidden="true">+</span>
  </button>
  <p class="wsp-faq__a" id="wsp-faq-a-${index}" hidden>${item.a}</p>
</div>`;
}

export function workshopLandingPage(workshop) {
  const c = workshop.copy.landing;
  const registrationOpen = canRegister(workshop);
  // Best-effort only, to avoid a flash of the wrong CTA if this exact build
  // happens to be viewed after the cutoff before workshop.js corrects it
  // (e.g. JS still loading, or disabled — see that file's documented
  // limitation). `false` whenever there's no closesAt, so a workshop without
  // one renders byte-identical to before this feature existed.
  const cutoffPassedAtBuild = registrationOpen && isRegistrationCutoffPassed(workshop);
  const meta = metaLine(workshop);
  const instructor = workshop.instructor || PLACEHOLDER_INSTRUCTOR;

  const faqHtml = c.faq.map(faqItem).join("");
  const formulaHtml = formulaRow(c.journey.formulas);

  return html`
${raw(workshopBrand())}

<div id="registro" class="wsp-block wsp-hero">
  <div class="wsp-wrap wsp-hero__grid">
    <div>
      <p class="wsp-eyebrow">${c.eyebrow}</p>
      <h1 class="wsp-h1">${c.h1}</h1>
      <p class="wsp-lede">${c.subhead}</p>
      <p class="wsp-lede">${c.subheadDetail}</p>
      <div class="wsp-takeaways">
        <p class="wsp-takeaways__label">${c.takeaways.label}</p>
        <p class="wsp-takeaways__text">${c.takeaways.text}</p>
        <p class="wsp-takeaways__note">${c.takeaways.note}</p>
      </div>
      <p class="wsp-meta">${meta}</p>
      <p class="wsp-note">${c.notebookNote}</p>
    </div>
    <div>${raw(heroRegistrationBlock(workshop, registrationOpen))}</div>
  </div>
</div>

<div class="wsp-block wsp-block--sunken">
  <div class="wsp-wrap">
    <div class="wsp-journey__head">
      <h2 class="wsp-h2 wsp-h2--narrow">${c.journey.heading}</h2>
      <div>
        <p class="wsp-body">${c.journey.intro}</p>
        <p class="wsp-question">${c.journey.question}</p>
      </div>
    </div>

    <div class="wsp-diagram-shell">
      ${raw(learningLoopDiagram())}
      <div class="wsp-formula-row">${raw(formulaHtml)}</div>
    </div>

    <div class="wsp-closing">
      <p class="wsp-body wsp-body--dim">${c.journey.closingLead}</p>
      <p class="wsp-closing__q">${c.journey.closingQuestion}</p>
    </div>
  </div>
</div>

<div class="wsp-block">
  <div class="wsp-wrap wsp-fit__grid">
    <div>
      <h2 class="wsp-h3">${c.fit.heading}</h2>
      <div class="wsp-fit__list">${raw(c.fit.bullets.map((b) => html`<div>${b}</div>`).join(""))}</div>
      <p class="wsp-body wsp-body--dim">${c.fit.notFor}</p>
    </div>
    <div>
      <p class="wsp-lede-sm">${c.experience.lead}</p>
      <p class="wsp-body">${c.experience.body}</p>
      <div class="wsp-highlight">
        <p class="wsp-highlight__l1">${c.experience.highlight.line1}</p>
        <p class="wsp-highlight__l2">${c.experience.highlight.line2}</p>
      </div>
      <p class="wsp-meta">${meta}</p>
      ${raw(
        registrationOpen
          ? html`<a href="#registro" data-open-modal="registration" class="wsp-btn wsp-btn--primary" ${cutoffPassedAtBuild ? "hidden" : false}>${c.ctaLabel} <span class="wsp-btn__arrow" aria-hidden="true">→</span></a>`
          : ""
      )}
      <div class="wsp-instructor"><span>Imparte:</span><span class="wsp-instructor__name">${instructor}</span><span>· Tau Education</span></div>
    </div>
  </div>
</div>

<div class="wsp-block wsp-block--sunken">
  <div class="wsp-wrap wsp-wrap--narrow">
    <div class="wsp-faq" data-faq-group>${raw(faqHtml)}</div>
  </div>
</div>

<div class="wsp-block">
  <div class="wsp-wrap wsp-wrap--narrow">
    <p class="wsp-recording-notice">${c.recordingNotice}</p>
  </div>
</div>

${raw(
  registrationOpen
    ? html`<div class="wsp-sticky" data-sticky hidden>
  <span class="wsp-sticky__meta">${formatWorkshopDate(workshop)} · ${workshop.durationMinutes} min</span>
  <a href="#registro" data-open-modal="registration" class="wsp-btn wsp-btn--primary wsp-btn--sm" ${cutoffPassedAtBuild ? "hidden" : false}>${c.ctaLabel}</a>
</div>`
    : ""
)}

${raw(registrationOpen ? registrationModal(workshop, c) : "")}`;
}

// A second CTA elsewhere on the page ("para ti si…" block, sticky bar) opens
// this instead of jumping back up to the hero. The hero's inline form is
// untouched and stays the primary, always-visible path (works with no JS:
// those CTAs are plain `<a href="#registro">` by default — see workshop.js
// for the progressive-enhancement click intercept). The modal mounts its OWN
// systeme.io script lazily, on first open only, rather than moving the
// hero's live iframe (relocating a cross-origin iframe in the DOM forces it
// to reload) — the tradeoff is a second script/iframe load, but only if a
// visitor actually opens the popup.
function registrationModal(workshop, c) {
  const { systemeFormScriptId, systemeFormScriptSrc } = workshop.registration;
  // No visible title: the systeme.io iframe was tuned to a fixed height for
  // its own content, and stacking a heading above it stole that space and
  // threw the proportions off. The dialog keeps an accessible name via
  // aria-label instead of a visible heading element.
  const mount = html`
<div
  class="wsp-form-shell"
  data-modal-form-mount
  data-systeme-script-id="${systemeFormScriptId}"
  data-systeme-script-src="${systemeFormScriptSrc}"
></div>`;
  return modalShell({ id: "registration", ariaLabel: `${c.ctaLabel} — ${workshop.title}`, bodyHtml: mount });
}
