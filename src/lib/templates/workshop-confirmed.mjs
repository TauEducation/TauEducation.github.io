// /workshops/<slug>-<id>/confirmado/ — confirmation page, reused by every
// workshop. Follows v3/Tau Workshop Confirmado.dc.html; the secondary
// "research" form is native to Tau (no systeme.io) and posts to the shared
// Apps Script endpoint via a hidden iframe — see src/js/workshop.js and
// apps-script/workshop-research/Code.gs.

import { html, raw } from "../html.mjs";
import { learningLoopClosedDiagram } from "../workshop-figures.mjs";
import { workshopBrand, modalShell } from "./workshop-layout.mjs";
import {
  formatWorkshopDate,
  formatWorkshopTime,
  googleCalendarUrl,
} from "../workshops.mjs";
import { site } from "../../site.config.mjs";

function chipGroup(name, label, options) {
  const chips = options
    .map((opt, i) => {
      const id = `${name}-${i}`;
      return html`
    <input type="radio" name="${name}" id="${id}" value="${opt}" class="wsp-chip__input" />
    <label for="${id}" class="wsp-chip">${opt}</label>`;
    })
    .join("");
  return html`
<fieldset class="wsp-field">
  <legend class="wsp-field__label">${label}</legend>
  <div class="wsp-chip-row">${raw(chips)}</div>
</fieldset>`;
}

export function workshopConfirmedPage(workshop) {
  const c = workshop.copy.confirmation;
  const calUrl = googleCalendarUrl(workshop, site.origin);
  const research = workshop.research;

  const detailsStrip = html`
<div class="wsp-block wsp-block--sunken wsp-details wsp-details--center">
  <div class="wsp-wrap wsp-details__row">
    <div class="wsp-details__group">
      <div class="wsp-detail"><span class="wsp-detail__label">Fecha</span><span class="wsp-detail__value">${formatWorkshopDate(workshop)}</span></div>
      <div class="wsp-detail"><span class="wsp-detail__label">Hora (CDMX)</span><span class="wsp-detail__value">${formatWorkshopTime(workshop)}</span></div>
      <div class="wsp-detail"><span class="wsp-detail__label">Duración</span><span class="wsp-detail__value">${workshop.durationMinutes} min</span></div>
      <div class="wsp-detail"><span class="wsp-detail__label">Dónde</span><span class="wsp-detail__value">${workshop.locationLabel}</span></div>
    </div>
    <div class="wsp-details__cta">
      ${raw(
        calUrl
          ? html`<a href="${calUrl}" target="_blank" rel="noopener" class="wsp-btn wsp-btn--primary">${c.calendarCtaLabel} <span aria-hidden="true">＋</span></a>`
          : html`<span class="wsp-btn wsp-btn--disabled" aria-disabled="true">${c.calendarCtaLabel}</span>`
      )}
      <span class="wsp-details__note">${calUrl ? c.calendarNote : "El calendario estará disponible cuando se confirme la fecha."}</span>
    </div>
  </div>
</div>`;

  const sf = c.secondaryForm;
  const scaleOptions = sf.scaleOptions;

  const trigger = html`
<button type="button" class="wsp-research-cta__btn" data-open-modal="research">
  <span class="wsp-research-cta__line1">${sf.triggerLine1}</span>
  <span class="wsp-research-cta__line2">${sf.triggerLine2}</span>
</button>`;

  const formBody = html`
<div class="wsp-research" data-research-form>
  <form
    class="wsp-research__form"
    data-research-form-el
    action="${research.endpoint}"
    method="POST"
    target="ws-research-frame"
    novalidate
  >
    <p class="wsp-eyebrow wsp-eyebrow--cyan">${sf.eyebrow}</p>
    <p class="wsp-body">${sf.intro}</p>
    <div class="wsp-research__fields">
      ${raw(chipGroup("ml_experience", sf.mlLabel, scaleOptions))}
      ${raw(chipGroup("python_level", sf.pyLabel, scaleOptions))}
      <div class="wsp-field">
        <label class="wsp-field__label" for="main_blocker">${sf.blockerLabel}</label>
        <textarea id="main_blocker" name="main_blocker" rows="2" maxlength="600" placeholder="Escribe brevemente…"></textarea>
      </div>
      <div class="wsp-field">
        <label class="wsp-field__label" for="workshop_question">${sf.questionLabel}</label>
        <textarea id="workshop_question" name="workshop_question" rows="2" maxlength="600" placeholder="Escribe brevemente…"></textarea>
      </div>
      <div class="wsp-field">
        <label class="wsp-field__label" for="whatsapp">${sf.whatsappLabel}</label>
        <input type="tel" id="whatsapp" name="whatsapp" maxlength="30" placeholder="${sf.whatsappPlaceholder}" />
      </div>

      <input type="hidden" name="workshop_id" value="${workshop.id}" />
      <input type="hidden" name="response_id" data-response-id value="" />
      <input type="hidden" name="form_version" value="${research.formVersion}" />
      <input type="hidden" name="utm_source" data-utm="utm_source" value="" />
      <input type="hidden" name="utm_medium" data-utm="utm_medium" value="" />
      <input type="hidden" name="utm_campaign" data-utm="utm_campaign" value="" />
      <input type="hidden" name="utm_content" data-utm="utm_content" value="" />
      <input type="hidden" name="utm_term" data-utm="utm_term" value="" />

      <div class="wsp-hp" aria-hidden="true">
        <label for="website">Website</label>
        <input type="text" id="website" name="website" tabindex="-1" autocomplete="off" />
      </div>

      <button type="submit" class="wsp-btn wsp-btn--ghost" data-research-submit>
        <span data-research-submit-label>${sf.submitLabel}</span> <span aria-hidden="true">→</span>
      </button>
    </div>
  </form>

  <iframe name="ws-research-frame" data-research-frame title="Envío del formulario de investigación" hidden></iframe>
</div>`;

  const researchModal = modalShell({
    id: "research",
    ariaLabel: `${sf.triggerLine1} — ${workshop.title}`,
    bodyHtml: formBody,
    wide: true,
    wmLarge: true,
  });

  // A separate dialog, not a swapped-in panel inside the same one: submitting
  // closes `research` and opens this one (see src/js/workshop.js). Reuses the
  // same success markup the registration flow's prototype envisioned.
  const successBody = html`
<div class="wsp-research__success">
  <span class="wsp-research__success-mark" aria-hidden="true"></span>
  <div>
    <p class="wsp-h3">${sf.successTitle}</p>
    <p class="wsp-body">${sf.successBody}</p>
  </div>
</div>`;
  const researchSuccessModal = modalShell({
    id: "research-success",
    ariaLabel: `${sf.successTitle} — ${workshop.title}`,
    bodyHtml: successBody,
    watermark: false,
  });

  return html`
${raw(workshopBrand({ href: "/" }))}

<div class="wsp-block wsp-confirm-hero">
  <div class="wsp-wrap wsp-confirm-hero__grid">
    <div class="wsp-rise">
      <div class="wsp-confirm-hero__top">
        <div class="wsp-confirm-eyebrow"><span class="wsp-pulse" aria-hidden="true"></span><span class="wsp-eyebrow">${c.eyebrow}</span></div>
        <h1 class="wsp-h1 wsp-h1--xl">${c.h1}</h1>
        <p class="wsp-lede">${c.lead}</p>
      </div>
      <div class="wsp-confirm-hero__gap">
        <p class="wsp-note">${c.note}</p>
      </div>
      ${raw(trigger)}
    </div>
    <div class="wsp-confirm-hero__fig">${raw(learningLoopClosedDiagram())}</div>
  </div>
</div>

${raw(detailsStrip)}
${raw(researchModal)}
${raw(researchSuccessModal)}`;
}
