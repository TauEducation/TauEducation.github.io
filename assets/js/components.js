/* ===========================================================================
   tau.education — shared chrome as Web Components (no Shadow DOM, so the
   global stylesheet applies). All content comes from config.js.
   Usage:  <tau-header current="Inicio"></tau-header>
           <tau-header current="Labs" unit="Labs"></tau-header>
           <tau-footer></tau-footer>
           <tau-newsletter></tau-newsletter>
           <tau-contact></tau-contact>
           <tau-watermark size="780" class="watermark--hero"></tau-watermark>
   =========================================================================== */

import { config, url } from "./config.js";
import { wireForm } from "./forms.js";

const MARK = /* the cleaned Tau mark, inlined so it inherits currentColor */ `
<svg viewBox="0 0 1320 1320" fill="currentColor" aria-hidden="true"><g transform="translate(-1540 -578)"><g transform="matrix(1.00034 0 0 1 1454.54 201.532)"><path d="M204.752 808.447 204.752 927.745 525.184 927.745 643.287 808.447Z"/><path d="M217.909 776.65 676.278 776.65 795.575 657.353 337.206 657.353Z"/><path d="M643.287 1613.1 643.287 881.669 898.951 626.006 1132.13 626.006 1132.13 745.303 938.033 745.303 745.085 927.745 745.085 1493.8 823.331 1493.8 922.4 1394.74 1080.78 1394.74 862.413 1613.1Z"/><path d="M796.817 1448.29 796.817 958.547 927.526 827.837 927.526 1317.58Z"/><path d="M1183.86 576.572 1183.86 745.303 1246.56 745.303 1285.66 706.198 1285.66 458.832 1066.12 458.832 946.826 578.129 1185.42 578.129"/></g></g></svg>`;

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => (
  { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
));

/* --------------------------------------------------------------- header --- */
class TauHeader extends HTMLElement {
  connectedCallback() {
    const current = (this.getAttribute("current") || "").toLowerCase();
    const unit = this.getAttribute("unit");
    const here = location.pathname.replace(/index\.html$/, "");

    const isActive = (item) => {
      if (current) return item.label.toLowerCase() === current;
      const h = url(item.href).replace(/index\.html$/, "");
      return h === here || (h !== "/" && here.startsWith(h.replace(/\/$/, "")));
    };

    const navLinks = config.nav.map((item) =>
      `<a href="${url(item.href)}"${isActive(item) ? ' aria-current="page"' : ""}>${esc(item.label)}</a>`
    ).join("");

    const wordmark = unit
      ? `<a class="wordmark" href="${url("/")}">
           <span class="wordmark__mark">${MARK}</span>
           <span class="wordmark__text">${esc(config.org.short)}</span>
           <span class="wordmark__unit">${esc(unit)}</span>
         </a>`
      : `<a class="wordmark" href="${url("/")}">
           <span class="wordmark__mark">${MARK}</span>
           <span class="wordmark__text">${esc(config.org.name)}</span>
         </a>`;

    const cta = `<a class="site-header__cta" href="${url(config.headerCta.href)}">${esc(config.headerCta.label)}</a>`;

    this.innerHTML = `
      <header class="site-header">
        <div class="site-header__bar">
          ${wordmark}
          <nav class="site-nav" aria-label="Principal">${navLinks}</nav>
          ${cta}
          <button class="nav-toggle" aria-expanded="false" aria-controls="tau-mobile-nav" aria-label="Abrir menú">
            <span></span><span></span>
          </button>
        </div>
        <div class="mobile-panel" id="tau-mobile-nav">
          ${config.nav.map((i) => `<a href="${url(i.href)}"${isActive(i) ? ' aria-current="page"' : ""}>${esc(i.label)}</a>`).join("")}
          ${cta}
        </div>
      </header>`;

    const header = this.querySelector(".site-header");
    const toggle = this.querySelector(".nav-toggle");
    toggle.addEventListener("click", () => {
      const open = header.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
    });
  }
}

/* --------------------------------------------------------------- footer --- */
class TauFooter extends HTMLElement {
  connectedCallback() {
    const c = config.contact;
    const cols = config.footer.columns.map((col) => `
      <div class="footer-col">
        <h2>${esc(col.title)}</h2>
        <ul>${col.links.map((l) => `<li><a href="${url(l.href)}">${esc(l.label)}</a></li>`).join("")}</ul>
      </div>`).join("");

    const extraContact = [
      c.address ? `<span>${esc(c.address)}</span>` : "",
      c.phone ? `<span>${esc(c.phone)}</span>` : "",
    ].filter(Boolean).join(" · ");

    this.innerHTML = `
      <footer class="site-footer">
        <div class="site-footer__grid">
          <div class="site-footer__brand">
            <a class="wordmark" href="${url("/")}">
              <span class="wordmark__mark">${MARK}</span>
              <span class="wordmark__text">${esc(config.org.name)}</span>
            </a>
            <p class="footer-tagline">${esc(config.org.tagline)}</p>
            <p class="footer-email"><a href="mailto:${esc(c.email)}">${esc(c.email)}</a></p>
            ${extraContact ? `<p class="footer-contact">${extraContact}</p>` : ""}
          </div>
          ${cols}
        </div>
        <div class="site-footer__bar">
          <span>${esc(c.domain)}</span>
          <span>© ${esc(config.copyright.year)} ${esc(config.copyright.holder)}</span>
        </div>
      </footer>`;
  }
}

/* -------------------------------------------------------------- contact --- */
class TauContact extends HTMLElement {
  connectedCallback() {
    const c = config.contact;
    const rows = [
      ["Correo", `<a href="mailto:${esc(c.email)}">${esc(c.email)}</a>`],
      ["Sitio", `<a href="${esc(c.url)}">${esc(c.domain)}</a>`],
      c.address ? ["Ubicación", esc(c.address)] : null,
      c.phone ? ["Teléfono", `<a href="tel:${esc(c.phone.replace(/\s+/g, ""))}">${esc(c.phone)}</a>`] : null,
      ...Object.entries(c.social || {}).map(([k, v]) => [k[0].toUpperCase() + k.slice(1), `<a href="${esc(v)}">${esc(v)}</a>`]),
    ].filter(Boolean);

    this.innerHTML = `
      <dl class="rule-grid" style="grid-template-columns:1fr">
        ${rows.map(([k, v]) => `
          <div style="display:flex;justify-content:space-between;gap:20px;padding:18px 22px;align-items:baseline">
            <dt style="font:500 10px/1 var(--font-mono);letter-spacing:.16em;text-transform:uppercase;color:var(--fg-meta)">${k}</dt>
            <dd style="margin:0;font:400 15px/1.5 var(--font-text);color:var(--fg);text-align:right">${v}</dd>
          </div>`).join("")}
      </dl>`;
  }
}

/* ----------------------------------------------------------- newsletter --- */
class TauNewsletter extends HTMLElement {
  connectedCallback() {
    const heading = this.getAttribute("heading") || "Recibe novedades";
    const copy = this.getAttribute("copy")
      || "Aún no hay cursos abiertos. Déjanos tu correo y te avisamos cuando comience el primer programa.";
    this.innerHTML = `
      <div class="newsletter" id="novedades">
        <h2 class="h3-card">${esc(heading)}</h2>
        <p class="body-sm">${esc(copy)}</p>
        <form class="form-inline" data-tau-form="newsletter" novalidate>
          <label class="visually-hidden" for="tau-nl-email">Correo electrónico</label>
          <input id="tau-nl-email" type="email" name="email" required autocomplete="email"
                 placeholder="tu@correo.com" />
          <button class="btn btn--secondary" type="submit">Avísenme</button>
        </form>
        <p class="form-status" data-tau-status aria-live="polite"></p>
      </div>`;
    wireForm(this.querySelector("form"));
  }
}

/* ----------------------------------------------------------- watermark --- */
class TauWatermark extends HTMLElement {
  connectedCallback() {
    const size = this.getAttribute("size") || "420";
    this.setAttribute("aria-hidden", "true");
    this.classList.add("watermark");
    this.style.width = this.style.height = size + "px";
    this.innerHTML = MARK;
  }
}

customElements.define("tau-header", TauHeader);
customElements.define("tau-footer", TauFooter);
customElements.define("tau-contact", TauContact);
customElements.define("tau-newsletter", TauNewsletter);
customElements.define("tau-watermark", TauWatermark);

/* Wire any standalone forms that aren't inside a component (e.g. /contacto). */
document.querySelectorAll("form[data-tau-form]").forEach((f) => {
  if (!f.dataset.tauWired) wireForm(f);
});
