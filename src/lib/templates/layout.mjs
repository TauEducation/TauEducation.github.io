import { html, raw, esc } from "../html.mjs";
import { site, nav, headerCta } from "../../site.config.mjs";

function navLinks(currentTag) {
  return nav
    .map((item) => {
      const active =
        (item.label === "Academy" && currentTag === "Academy") ||
        (item.label === "Labs" && currentTag === "Labs") ||
        (item.label === "Inicio" && currentTag === "Inicio");
      return html`<a href="${item.href}"${raw(active ? ' aria-current="page"' : "")}>${item.label}</a>`;
    })
    .join("");
}

export function header(route) {
  return html`
<a class="skip-link" href="#main">Saltar al contenido</a>
<header class="site-header">
  <div class="site-header__bar wrap">
    <a class="wordmark" href="/">
      <img class="wordmark__mark" src="/assets/tau-mark-light.svg" alt="" width="26" height="26" />
      <span class="wordmark__text">${site.brand}</span>
      <span class="wordmark__tag">${route.tag}</span>
    </a>
    <nav class="site-nav" aria-label="Principal">${raw(navLinks(route.tag))}</nav>
    <a class="site-header__cta" href="${headerCta.href}">${headerCta.label}</a>
  </div>
</header>`;
}

export function footer(data) {
  const cols = data.columns
    .map(
      (col) => html`
      <div class="footer-col">
        <p class="footer-col__h">${col.heading}</p>
        <ul>${raw(col.items.map((i) => html`<li>${i}</li>`).join(""))}</ul>
      </div>`
    )
    .join("");

  return html`
<footer class="site-footer">
  <div class="wrap site-footer__grid">
    <div class="site-footer__brand">
      <span class="wordmark">
        <img class="wordmark__mark" src="/assets/tau-mark-light.svg" alt="" width="24" height="24" />
        <span class="wordmark__text">${site.brand}</span>
      </span>
      <p class="footer-tagline">${data.tagline}</p>
      <a class="footer-email" href="mailto:${data.email}">${data.email}</a>
    </div>
    ${raw(cols)}
  </div>
  <div class="wrap site-footer__bar">
    <span>${site.domain}</span>
    <a href="/404.html">Página 404</a>
    <span>© ${new Date().getFullYear()} ${site.brand}</span>
  </div>
</footer>`;
}

/**
 * Full document.
 * @param {object} o
 * @param {object} o.route   entry from site.config routes
 * @param {string} o.body    page HTML (already built)
 * @param {object} o.footerData  home.json `footer`, used site-wide
 * @param {boolean} [o.hasMath]  include KaTeX stylesheet
 */
export function document({ route, body, footerData, hasMath = true }) {
  const canonical = site.origin + route.path;
  const mathCss = hasMath ? `<link rel="stylesheet" href="/assets/katex.min.css" />` : "";

  return (
    "<!doctype html>\n" +
    html`<html lang="${site.lang}" class="no-js">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<script>document.documentElement.classList.remove("no-js");document.documentElement.classList.add("js");</script>
<title>${route.title}</title>
<meta name="description" content="${route.description}" />
<link rel="canonical" href="${canonical}" />
<meta name="theme-color" content="${site.themeColor}" />
<meta property="og:type" content="website" />
<meta property="og:title" content="${route.title}" />
<meta property="og:description" content="${route.description}" />
<meta property="og:url" content="${canonical}" />
<meta property="og:image" content="${site.origin}/assets/og-image.png" />
<meta property="og:locale" content="es_ES" />
<meta name="twitter:card" content="summary_large_image" />
<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml" />
<link rel="apple-touch-icon" href="/assets/apple-touch-icon.png" />
<link rel="preload" href="/assets/fonts/anta-latin.woff2" as="font" type="font/woff2" crossorigin />
<link rel="preload" href="/assets/fonts/didact-gothic-latin.woff2" as="font" type="font/woff2" crossorigin />
<link rel="stylesheet" href="/assets/fonts.css" />
${raw(mathCss)}
<link rel="stylesheet" href="/assets/styles.css" />
</head>
<body data-route="${route.tag}">
${raw(header(route))}
<main id="main">
${raw(body)}
</main>
${raw(footer(footerData))}
<script src="/assets/app.js" defer></script>
</body>
</html>`
  );
}

export { esc };
