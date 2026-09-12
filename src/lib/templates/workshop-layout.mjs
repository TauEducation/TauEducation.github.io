// Minimal document shell for the workshop funnel (landing + confirmation).
// Deliberately does NOT reuse header()/footer() from layout.mjs: the approved
// design has no site nav ("Marca, no es nav.") and a different, shorter
// footer. Everything else (meta tags, canonical, self-hosted fonts, KaTeX
// CSS) follows the same conventions as the rest of the site.

import { html, raw } from "../html.mjs";
import { site } from "../../site.config.mjs";

const TAU_MARK = raw(
  '<svg width="18" height="18" viewBox="0 0 1320 1320" fill="#e9e7e2" class="wsp-mark" aria-hidden="true">' +
    '<g transform="translate(-1540 -578)"><g transform="matrix(1.00034 0 0 1 1454.54 201.532)">' +
    '<path d="M204.752 808.447 204.752 927.745 525.184 927.745 643.287 808.447Z"/>' +
    '<path d="M217.909 776.65 676.278 776.65 795.575 657.353 337.206 657.353Z"/>' +
    '<path d="M643.287 1613.1 643.287 881.669 898.951 626.006 1132.13 626.006 1132.13 745.303 938.033 745.303 745.085 927.745 745.085 1493.8 823.331 1493.8 922.4 1394.74 1080.78 1394.74 862.413 1613.1Z"/>' +
    '<path d="M796.817 1448.29 796.817 958.547 927.526 827.837 927.526 1317.58Z"/>' +
    '<path d="M1183.86 576.572 1183.86 745.303 1246.56 745.303 1285.66 706.198 1285.66 458.832 1066.12 458.832 946.826 578.129 1185.42 578.129Z"/>' +
    "</g></g></svg>"
);

/**
 * @param {object} [o]
 * @param {string} [o.href]  when set, the mark links out (e.g. home from the
 *   confirmation page). Left unset on the landing page on purpose — the
 *   handoff calls the mark "not nav": no exit before registration.
 */
export function workshopBrand({ href } = {}) {
  const inner = html`${TAU_MARK}<span class="wsp-brand__text">Tau Education</span>`;
  const tag = href
    ? html`<a href="${href}" class="wsp-brand">${raw(inner)}</a>`
    : html`<div class="wsp-brand">${raw(inner)}</div>`;
  // .wsp-brand centers itself (max-width + margin:auto) — but it's the first
  // child of .wsp-page, a flex column (sticky-footer layout), and a flex
  // item with auto cross-axis margins gets shrunk-and-centered by flexbox
  // instead of stretched (same issue the footer had). This outer wrapper is
  // the actual flex item, with no margin, so .wsp-brand centers itself in a
  // normal block context underneath it.
  return html`<div class="wsp-brand-bar">${raw(tag)}</div>`;
}

/**
 * Shared Tau-styled `<dialog>` chrome: dark surface, centered watermark, a
 * close button that floats just outside the frame. Used for both the
 * registration popup (workshop.mjs) and the research-form popup
 * (workshop-confirmed.mjs) — see src/js/workshop.js for the generic
 * open/close wiring keyed by `data-modal`/`data-open-modal`.
 * @param {object} o
 * @param {string} o.id           matches the trigger's data-open-modal="<id>"
 * @param {string} o.ariaLabel    accessible name (no visible title in the popup)
 * @param {string} o.bodyHtml     already-built inner HTML
 * @param {boolean} [o.wide]      wider cap for content with more than one field column
 * @param {boolean} [o.watermark] set false to omit the mark entirely (e.g. a small thank-you popup)
 * @param {boolean} [o.wmLarge]   bigger mark, for a roomier popup that can take it
 */
export function modalShell({ id, ariaLabel, bodyHtml, wide = false, watermark = true, wmLarge = false }) {
  const mark = watermark
    ? html`<img class="wsp-modal__wm${wmLarge ? " wsp-modal__wm--lg" : ""}" src="/assets/tau-mark-light.svg" alt="" aria-hidden="true" />`
    : "";
  return html`
<dialog class="wsp-modal${wide ? " wsp-modal--wide" : ""}" data-modal="${id}" aria-label="${ariaLabel}">
  <div class="wsp-modal__panel">
    <div class="wsp-modal__surface">
      ${raw(mark)}
      ${raw(bodyHtml)}
    </div>
    <button type="button" class="wsp-modal__close" data-modal-close aria-label="Cerrar">×</button>
  </div>
</dialog>`;
}

export function workshopFooter() {
  // <footer> itself carries no margin/max-width: as a direct flex child of
  // body.wsp (the sticky-footer layout), an item with `margin: auto` on the
  // cross axis gets centered-and-shrunk by flexbox instead of stretched —
  // auto margins win over stretch by spec. The 1180px-centered box lives on
  // the inner <div> instead, which is a normal block context, unaffected.
  return html`
<footer class="wsp-footer-bar">
  <div class="wsp-footer">
    <span>Tau Education</span>
    <a href="/privacidad/">Aviso de Privacidad</a>
    <span class="wsp-footer__email">contacto@tau.education</span>
  </div>
</footer>`;
}

/**
 * @param {object} o
 * @param {string} o.title
 * @param {string} o.description
 * @param {string} o.path         canonical path, e.g. "/workshops/slug-ws001/"
 * @param {string} o.body         page HTML (already built)
 * @param {string} o.workshopId   registry id, exposed on <body> for workshop.js
 * @param {boolean} [o.noindex]   confirmation pages must never be indexed
 * @param {string} [o.bodyClass]  extra class on <body> for page-scoped hooks
 */
export function workshopDocument({ title, description, path, body, workshopId, noindex = false, bodyClass = "" }) {
  const canonical = site.origin + path;
  const robots = noindex
    ? `<meta name="robots" content="noindex, nofollow" />`
    : "";

  return (
    "<!doctype html>\n" +
    html`<html lang="${site.lang}" class="no-js">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<script>document.documentElement.classList.remove("no-js");document.documentElement.classList.add("js");</script>
<title>${title}</title>
<meta name="description" content="${description}" />
<link rel="canonical" href="${canonical}" />
${raw(robots)}
<meta name="theme-color" content="${site.themeColor}" />
<meta property="og:type" content="website" />
<meta property="og:title" content="${title}" />
<meta property="og:description" content="${description}" />
<meta property="og:url" content="${canonical}" />
<meta property="og:image" content="${site.origin}/assets/og-image.png" />
<meta property="og:locale" content="es_ES" />
<meta name="twitter:card" content="summary_large_image" />
<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml" />
<link rel="apple-touch-icon" href="/assets/apple-touch-icon.png" />
<link rel="preload" href="/assets/fonts/anta-latin.woff2" as="font" type="font/woff2" crossorigin />
<link rel="preload" href="/assets/fonts/didact-gothic-latin.woff2" as="font" type="font/woff2" crossorigin />
<link rel="stylesheet" href="/assets/fonts.css" />
<link rel="stylesheet" href="/assets/katex.min.css" />
<link rel="stylesheet" href="/assets/styles.css" />
</head>
<body class="wsp ${raw(bodyClass)}" data-workshop-id="${workshopId}">
<div class="wsp-page">
${raw(body)}
</div>
${raw(workshopFooter())}
<script src="/assets/workshop.js" defer></script>
</body>
</html>`
  );
}
