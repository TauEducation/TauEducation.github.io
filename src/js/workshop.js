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
  // Set by the registration-cutoff block further down (if this page has one);
  // read by the sticky-CTA block. Declared here so either block can run
  // first — `var` is hoisted to the top of this whole IIFE regardless of
  // where in the file it's assigned.
  var registrationClosed = false;

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
      var show = window.scrollY > 480 && !registrationClosed;
      sticky.hidden = !show;
      body.classList.toggle("wsp--sticky-visible", show);
    };
    window.addEventListener("scroll", updateSticky, { passive: true });
    updateSticky();
  }

  /* --- registration cutoff: a purely time-based state, independent of the
         workshop's status/open flag — reaching it must not mark the workshop
         "past" (see isRegistrationCutoffPassed in workshops.mjs). Only
         present on pages whose registry entry sets registration.closesAt
         (see data-registration-closes-at in workshop-layout.mjs); a workshop
         without one keeps the original always-on systeme.io embed untouched.
         Runs a self-scheduling timer rather than polling, so a tab left open
         across the cutoff updates live without a refresh.

         KNOWN LIMITATION (static hosting, no SSR/cron, documented rather than
         worked around): this whole block requires JS to run. A visitor with
         JS disabled sees whatever this page's last build happened to guess
         (baked into the `hidden` attributes below) — before the cutoff was
         reached at build time, that's the open form; after, it's the closed
         notice. There's no build scheduled exactly at the cutoff to correct a
         stale guess for that visitor, since there's no server to run one. */
  var closesAtAttr = body.getAttribute("data-registration-closes-at");
  if (closesAtAttr) {
    var closesAtMs = new Date(closesAtAttr).getTime();
    var heroMount = document.querySelector("[data-hero-form-mount]");
    var closedNotice = document.querySelector("[data-registration-closed-cutoff]");
    var regTriggers = [].slice.call(document.querySelectorAll('[data-open-modal="registration"]'));
    var heroMounted = false;

    var mountHeroForm = function () {
      if (heroMounted || !heroMount) return;
      heroMounted = true;
      var script = document.createElement("script");
      script.id = heroMount.getAttribute("data-systeme-script-id");
      script.src = heroMount.getAttribute("data-systeme-script-src");
      heroMount.appendChild(script);
    };

    var applyRegistrationWindow = function () {
      var closed = Date.now() >= closesAtMs;
      registrationClosed = closed;
      if (heroMount) heroMount.hidden = closed;
      if (closedNotice) closedNotice.hidden = !closed;
      regTriggers.forEach(function (el) { el.hidden = closed; });
      if (closed) {
        if (modals.registration && modals.registration.dialog.open) modals.registration.dialog.close();
      } else {
        mountHeroForm();
      }
      if (sticky) updateSticky();
      return closed;
    };

    // Belt-and-suspenders for the edge case where the cutoff lands while the
    // popup is already open (its trigger was visible a moment ago): even if
    // reached through some other path, the popup itself can never mount
    // systeme's script once closed.
    if (modals.registration) {
      var baseRegistrationOpen = modals.registration.open;
      modals.registration.open = function (trigger) {
        if (Date.now() >= closesAtMs) return;
        baseRegistrationOpen(trigger);
      };
    }

    var MAX_TIMEOUT_MS = 2147483647; // setTimeout's 32-bit signed delay cap (~24.8 days)
    var scheduleNextCheck = function () {
      var remaining = closesAtMs - Date.now();
      if (remaining <= 0) { applyRegistrationWindow(); return; }
      setTimeout(function () {
        if (Date.now() >= closesAtMs) applyRegistrationWindow();
        else scheduleNextCheck(); // still more than ~24.8 days out — check again later
      }, Math.min(remaining, MAX_TIMEOUT_MS));
    };

    applyRegistrationWindow();
    scheduleNextCheck();

    // Browsers throttle (or fully suspend) timers in a backgrounded tab, so a
    // tab left open but unfocused across the cutoff could miss the exact
    // moment and only catch up once its timer eventually fires. Re-checking
    // on every return to the tab means the worst case is "briefly stale while
    // backgrounded", never "stale until the visitor manually refreshes".
    document.addEventListener("visibilitychange", function () {
      if (!document.hidden) applyRegistrationWindow();
    });
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
