/* ===========================================================================
   tau.education — SITE CONFIG · single source of truth
   ---------------------------------------------------------------------------
   Everything that changes on its own schedule lives here: contact details,
   navigation, footer link lists, copyright, form endpoints. The shared
   components (header, footer, contact block, newsletter) read this file, so
   editing a value here propagates to every page. Nothing else should hardcode
   these strings.
   =========================================================================== */

export const config = {

  /* --- Organisation identity --- */
  org: {
    name: "Tau Education",
    short: "Tau",
    tagline: "Aprende con estructura. Explora con libertad.",
  },

  /* --- Contact details (shown in the footer and on /contacto) ---
     Set address / phone to a string when they exist; null hides the line.   */
  contact: {
    email: "contacto@tau.education",
    domain: "tau.education",
    url: "https://tau.education",
    address: null,          // e.g. "Guadalajara, Jalisco, México"
    phone: null,            // e.g. "+52 33 0000 0000"
    social: {
      // key: label -> url. Rendered as a list where used. Leave empty for none.
      // linkedin: "https://www.linkedin.com/company/…",
    },
  },

  copyright: { year: 2026, holder: "Tau Education" },

  /* --- Global navigation (header + mobile panel) --- */
  nav: [
    { label: "Inicio",        href: "/" },
    { label: "Filosofía",     href: "/filosofia.html" },
    { label: "Áreas",         href: "/areas.html" },
    { label: "Investigación", href: "/investigacion.html" },
    { label: "Academy",       href: "/academy.html" },
    { label: "Labs",          href: "/labs/" },
  ],

  /* Header call-to-action while there is no open course offering. */
  headerCta: { label: "Recibe novedades", href: "/#novedades" },

  /* --- Footer link columns --- */
  footer: {
    columns: [
      {
        title: "Explorar",
        links: [
          { label: "Filosofía",       href: "/filosofia.html" },
          { label: "Cómo aprendemos",  href: "/como-aprendemos.html" },
          { label: "Áreas",            href: "/areas.html" },
          { label: "Investigación",    href: "/investigacion.html" },
          { label: "Sobre Tau",        href: "/sobre-tau.html" },
        ],
      },
      {
        title: "Unidades",
        links: [
          { label: "Tau Academy",  href: "/academy.html" },
          { label: "Tau Labs",     href: "/labs/" },
          { label: "Referencias",  href: "/investigacion.html#biblioteca" },
          { label: "Contacto",     href: "/contacto.html" },
        ],
      },
      {
        title: "Legal",
        links: [
          { label: "Privacidad",  href: "/legal/privacidad.html" },
          { label: "Términos",    href: "/legal/terminos.html" },
          { label: "Aviso legal", href: "/legal/aviso-legal.html" },
          { label: "Marca",       href: "/legal/marca.html" },
        ],
      },
    ],
  },

  /* --- Forms (no backend) ---
     Put a form-handler URL (Formspree, Buttondown, Netlify, a Worker, …) in the
     matching *Endpoint field to POST submissions there. Leave it "" and the
     form degrades to a prefilled mailto: to contact.email.                    */
  forms: {
    newsletterEndpoint: "",
    contactEndpoint: "",
    mailtoSubjectPrefix: "[tau.education] ",
  },

  /* --- Optional third-party runtimes, loaded only on explicit user action --- */
  integrations: {
    // Pyodide (real Python in the browser) for Tau Labs "Ejecutar con Python real".
    pyodideIndexUrl: "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/",
  },
};

/* Resolve a config href against the current page depth so root-relative links
   ("/x.html") also work when the site is served from a sub-path.              */
export function url(href) {
  if (!href || /^([a-z]+:|#|\/\/)/i.test(href)) return href;
  if (href.startsWith("/")) {
    const base = document.documentElement.dataset.root || "";
    return (base.replace(/\/$/, "") + href) || href;
  }
  return href;
}
