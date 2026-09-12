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

/** Closed-registration state (status past/live/recording) — no invented copy, just fact. */
export function registrationClosedNotice() {
  return html`
<div class="wsp-form-shell wsp-form-shell--closed">
  <p class="wsp-form-closed">Este workshop ya ocurrió. El registro para nuevas sesiones se anunciará por separado.</p>
</div>`;
}
