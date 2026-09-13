// Registration is handled entirely by systeme.io (CRM, tags, automations).
// This renders ONLY the official embed script inside a Tau-styled container —
// never a hand-built form, never a parallel submit handler.
//
// The site is a classic multi-page static build (no client router), so the
// script tag is emitted exactly once per page load by construction; there is
// no "client navigation" that could duplicate it. The component boundary
// still exists so a future client-routed rebuild has one place to add a
// mount/unmount guard.

import { html } from "../html.mjs";

/**
 * @param {object} workshop  a registry entry (workshop.registration.*)
 */
export function systemeWorkshopForm(workshop) {
  const { systemeFormScriptId, systemeFormScriptSrc } = workshop.registration;
  return html`
<div class="wsp-form-shell" data-workshop-id="${workshop.id}">
  <script id="${systemeFormScriptId}" src="${systemeFormScriptSrc}"></script>
  <noscript>
    <p class="wsp-form-noscript">Activa JavaScript para ver el formulario de registro, o escríbenos a <a href="mailto:contacto@tau.education">contacto@tau.education</a>.</p>
  </noscript>
</div>`;
}

/**
 * Same container as systemeWorkshopForm(), but WITHOUT the inline <script>:
 * used only for a workshop with a registration.closesAt cutoff, where the
 * embed must not mount at all once the cutoff has passed. src/js/workshop.js
 * injects the script itself, after checking the real cutoff against the
 * visitor's own clock — see the data-hero-form-mount handling there. This
 * mirrors the registration MODAL's existing lazy-mount pattern; a workshop
 * with no cutoff keeps using the eager systemeWorkshopForm() above untouched.
 * @param {object} workshop
 * @param {boolean} [hidden]  build-time best guess at whether the cutoff has
 *   already passed — see the caller (workshop.mjs) for why this is only a
 *   guess, corrected client-side.
 */
export function systemeWorkshopFormMount(workshop, hidden = false) {
  const { systemeFormScriptId, systemeFormScriptSrc } = workshop.registration;
  return html`
<div
  class="wsp-form-shell"
  data-workshop-id="${workshop.id}"
  data-hero-form-mount
  data-systeme-script-id="${systemeFormScriptId}"
  data-systeme-script-src="${systemeFormScriptSrc}"
  ${hidden ? "hidden" : false}
>
  <noscript>
    <p class="wsp-form-noscript">Activa JavaScript para ver el formulario de registro, o escríbenos a <a href="mailto:contacto@tau.education">contacto@tau.education</a>.</p>
  </noscript>
</div>`;
}

/** Closed-registration state (status past/live/recording) — no invented copy, just fact. */
export function registrationClosedNotice() {
  return html`
<div class="wsp-form-shell wsp-form-shell--closed">
  <p class="wsp-form-closed">Este workshop ya ocurrió. El registro para nuevas sesiones se anunciará por separado.</p>
</div>`;
}
