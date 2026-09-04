/* ===========================================================================
   tau.education — form handling without a backend.
   - Always validates on the client.
   - If config.forms[<kind>Endpoint] is set, POSTs there (FormData / JSON).
   - Otherwise builds a prefilled mailto: to config.contact.email.
   Wire a form with:  <form data-tau-form="newsletter"> … <p data-tau-status>
   =========================================================================== */

import { config } from "./config.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const LABELS = {
  newsletter: { subject: "Alta en novedades", ok: "Listo. Te escribiremos cuando abra el primer programa." },
  contact: { subject: "Mensaje desde el sitio", ok: "Gracias. Responderemos al correo que dejaste." },
};

export function wireForm(form) {
  if (!form || form.dataset.tauWired) return;
  form.dataset.tauWired = "1";

  const kind = form.dataset.tauForm || "contact";
  const status = form.parentElement.querySelector("[data-tau-status]")
    || form.querySelector("[data-tau-status]");
  const submitBtn = form.querySelector('[type="submit"]');

  const setStatus = (state, msg) => {
    if (!status) return;
    status.dataset.state = state;
    status.textContent = msg;
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());

    // --- validation ---
    if ("email" in data && !EMAIL_RE.test((data.email || "").trim())) {
      setStatus("error", "Revisa el correo: no parece una dirección válida.");
      form.querySelector('[name="email"]')?.focus();
      return;
    }
    const missing = [...form.elements].find((el) => el.required && !String(el.value).trim());
    if (missing) {
      setStatus("error", "Falta completar un campo obligatorio.");
      missing.focus();
      return;
    }

    const endpoint = config.forms[kind + "Endpoint"];
    const labels = LABELS[kind] || LABELS.contact;

    if (endpoint) {
      try {
        submitBtn && (submitBtn.disabled = true);
        setStatus("sending", "Enviando…");
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { Accept: "application/json" },
          body: new FormData(form),
        });
        if (!res.ok) throw new Error("HTTP " + res.status);
        form.reset();
        setStatus("ok", labels.ok);
      } catch (err) {
        setStatus("error", "No se pudo enviar. Escríbenos a " + config.contact.email + ".");
      } finally {
        submitBtn && (submitBtn.disabled = false);
      }
      return;
    }

    // --- mailto fallback ---
    const subject = config.forms.mailtoSubjectPrefix + (data.topic ? data.topic : labels.subject);
    const bodyLines = Object.entries(data)
      .filter(([, v]) => String(v).trim())
      .map(([k, v]) => `${k}: ${v}`);
    const href = `mailto:${config.contact.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyLines.join("\n"))}`;
    window.location.href = href;
    setStatus("ok", "Se abrirá tu cliente de correo para enviar el mensaje.");
  });
}
