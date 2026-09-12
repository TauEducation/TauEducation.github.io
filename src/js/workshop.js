// Progressive enhancement for the workshop funnel: FAQ accordion, sticky CTA,
// UTM capture/persistence, and the secondary research form's iframe-POST
// transport. Every page here also works with this file blocked — the
// systeme.io registration form always works (it's systeme's own script), and
// the research form is a plain HTML form that posts to Apps Script through a
// visible iframe when JS is off.
(function () {
  "use strict";

  var body = document.body;
  var workshopId = body.getAttribute("data-workshop-id");

  /* --- FAQ: one section open at a time -------------------------------- */
  var faqGroup = document.querySelector("[data-faq-group]");
  if (faqGroup) {
    var toggles = [].slice.call(faqGroup.querySelectorAll("[data-faq-toggle]"));
    toggles.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var expanded = btn.getAttribute("aria-expanded") === "true";
        toggles.forEach(function (other) {
          var answer = document.getElementById(other.getAttribute("aria-controls"));
          var sign = other.querySelector("[data-faq-sign], .wsp-faq__sign");
          other.setAttribute("aria-expanded", "false");
          if (answer) answer.hidden = true;
          if (sign) sign.textContent = "+";
        });
        if (!expanded) {
          btn.setAttribute("aria-expanded", "true");
          var mine = document.getElementById(btn.getAttribute("aria-controls"));
          if (mine) mine.hidden = false;
          var mySign = btn.querySelector(".wsp-faq__sign");
          if (mySign) mySign.textContent = "−";
        }
      });
    });
  }

  /* --- popups: every `data-modal="<id>"` dialog on the page (registration on
         the landing page, the research questionnaire on /confirmado — never
         both at once) is opened by any `[data-open-modal="<id>"]` trigger and
         closed via its own × button or a backdrop click. Triggers degrade to
         their plain `href`/default behavior if <dialog> isn't supported or JS
         is off (the landing CTAs are `<a href="#registro">` underneath). -- */
  var modals = {};
  [].slice.call(document.querySelectorAll("[data-modal]")).forEach(function (dialog) {
    if (typeof dialog.showModal !== "function") return;
    var id = dialog.getAttribute("data-modal");
    var closeBtn = dialog.querySelector("[data-modal-close]");
    var lastFocused = null;

    var close = function () {
      if (dialog.open) dialog.close();
      if (lastFocused && lastFocused.focus) lastFocused.focus();
    };
    var open = function (trigger) {
      lastFocused = trigger;
      dialog.showModal();
    };

    if (closeBtn) closeBtn.addEventListener("click", close);
    // Native <dialog>: a click landing on the backdrop (not the panel)
    // reports the dialog itself as the target.
    dialog.addEventListener("click", function (e) {
      if (e.target === dialog) close();
    });

    modals[id] = { dialog: dialog, open: open };
  });

  // Registration only: lazy-mount systeme.io's script the first time the
  // popup opens, rather than moving the hero's live iframe (relocating a
  // cross-origin iframe in the DOM forces it to reload).
  if (modals.registration) {
    var regMount = modals.registration.dialog.querySelector("[data-modal-form-mount]");
    var regMounted = false;
    var baseOpen = modals.registration.open;
    modals.registration.open = function (trigger) {
      if (!regMounted && regMount) {
        regMounted = true;
        var script = document.createElement("script");
        script.id = regMount.getAttribute("data-systeme-script-id");
        script.src = regMount.getAttribute("data-systeme-script-src");
        regMount.appendChild(script);
      }
      baseOpen(trigger);
    };
  }

  document.querySelectorAll("[data-open-modal]").forEach(function (trigger) {
    var target = modals[trigger.getAttribute("data-open-modal")];
    if (!target) return;
    trigger.addEventListener("click", function (e) {
      e.preventDefault();
      target.open(trigger);
    });
  });

  /* --- sticky mobile CTA ------------------------------------------------ */
  var sticky = document.querySelector("[data-sticky]");
  if (sticky) {
    var updateSticky = function () {
      var show = window.scrollY > 480;
      sticky.hidden = !show;
      body.classList.toggle("wsp--sticky-visible", show);
    };
    window.addEventListener("scroll", updateSticky, { passive: true });
    updateSticky();
  }

  /* --- UTM capture: persisted per workshop, survives the redirect to
         /confirmado ---------------------------------------------------- */
  var UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];
  function attributionKey(id) { return "tau." + id + ".attribution"; }

  function captureUtmsFromUrl() {
    if (!workshopId) return;
    var params = new URLSearchParams(window.location.search);
    var found = {};
    var any = false;
    UTM_KEYS.forEach(function (k) {
      var v = params.get(k);
      if (v) { found[k] = v; any = true; }
    });
    if (!any) return;
    try {
      sessionStorage.setItem(attributionKey(workshopId), JSON.stringify(found));
    } catch (e) { /* sessionStorage unavailable (private mode, etc.) — attribution is best-effort */ }
  }
  function readAttribution() {
    if (!workshopId) return {};
    try {
      var raw = sessionStorage.getItem(attributionKey(workshopId));
      return raw ? JSON.parse(raw) : {};
    } catch (e) { return {}; }
  }
  captureUtmsFromUrl();

  /* --- secondary research form: native POST to Apps Script via a hidden
         iframe. No fetch/CORS involved; the iframe's `load` event (fired
         once the response arrives, even cross-origin) is our only signal —
         we can't read the response body, so there is no distinct network
         "error" state here (documented limitation). ------------------- */
  var researchRoot = document.querySelector("[data-research-form]");
  if (researchRoot && workshopId) {
    var form = researchRoot.querySelector("[data-research-form-el]");
    var frame = researchRoot.querySelector("[data-research-frame]");
    var submitBtn = researchRoot.querySelector("[data-research-submit]");
    var submitLabel = researchRoot.querySelector("[data-research-submit-label]");
    var responseIdField = researchRoot.querySelector("[data-response-id]");
    var utmFields = [].slice.call(researchRoot.querySelectorAll("[data-utm]"));

    var RESPONSE_ID_KEY = "tau." + workshopId + ".response_id";
    function ensureResponseId() {
      try {
        var existing = sessionStorage.getItem(RESPONSE_ID_KEY);
        if (existing) return existing;
        var id = (window.crypto && window.crypto.randomUUID) ? window.crypto.randomUUID() : String(Date.now()) + Math.random();
        sessionStorage.setItem(RESPONSE_ID_KEY, id);
        return id;
      } catch (e) {
        return (window.crypto && window.crypto.randomUUID) ? window.crypto.randomUUID() : String(Date.now());
      }
    }

    var hasSubmitted = false;
    var submitting = false;

    form.addEventListener("submit", function () {
      if (submitting) return; // guard against double submit
      submitting = true;
      if (responseIdField) responseIdField.value = ensureResponseId();
      var attribution = readAttribution();
      utmFields.forEach(function (field) {
        var key = field.getAttribute("data-utm");
        field.value = attribution[key] || "";
      });
      if (submitBtn) submitBtn.disabled = true;
      if (submitLabel) submitLabel.textContent = "Enviando…";
      hasSubmitted = true;
      // form submits natively to the hidden iframe from here — no preventDefault
    });

    if (frame) {
      frame.addEventListener("load", function () {
        if (!hasSubmitted) return; // ignore the iframe's initial blank load
        // Two separate popups, not a content swap inside one: close the form,
        // open the thank-you dialog.
        if (modals.research) modals.research.dialog.close();
        if (modals["research-success"]) modals["research-success"].open();
      });
    }
  }
})();
