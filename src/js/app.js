/* Progressive enhancement only. Every word on every page is readable, and every
   control works, with this file blocked. */
(function () {
  "use strict";

  var root = document.documentElement;
  root.classList.remove("no-js");
  root.classList.add("js");

  var reduce =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* --- scroll reveal: hidden state is applied here, never in the CSS alone --- */
  var revealables = document.querySelectorAll(".reveal");
  if (reduce || !("IntersectionObserver" in window)) {
    for (var i = 0; i < revealables.length; i++) revealables[i].classList.add("is-visible");
  } else {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            e.target.classList.add("is-visible");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -12% 0px" }
    );
    revealables.forEach(function (el) {
      io.observe(el);
    });
  }

  /* --- exploration: the stepped demo section ---------------------------- */
  var shell = document.querySelector(".ex-shell");
  if (shell) initExploration(shell);

  function initExploration(shell) {
    var total = parseInt(shell.getAttribute("data-total"), 10) || 6;
    var svg = shell.querySelector(".ex-fig-svg");
    var rail = [].slice.call(shell.querySelectorAll(".ex-rail__item"));
    var prev = shell.querySelector(".ex-nav--prev");
    var next = shell.querySelector(".ex-nav--next");
    var progressN = shell.querySelector(".ex-progress__n");
    var pad = function (n) { return n < 10 ? "0" + n : "" + n; };

    // axis mapping, for the pick marker (a value an option asks us to highlight)
    var aMin = parseFloat(shell.getAttribute("data-axis-min"));
    var aMax = parseFloat(shell.getAttribute("data-axis-max"));
    var X0 = 60, X1 = 552; // must match EX in figures.mjs
    var scaleX = function (v) { return X0 + ((v - aMin) / (aMax - aMin)) * (X1 - X0); };
    var pick = svg && svg.querySelector(".ex-pick");
    var pickValue = null;

    var narrative = shell.querySelector(".ex-narrative");
    var railEl = shell.querySelector(".ex-rail");
    var step = 1;

    // scroll the active tab within the rail only — never the page
    function centerRail(btn) {
      if (!railEl || railEl.scrollWidth <= railEl.clientWidth) return;
      var br = btn.getBoundingClientRect();
      var rr = railEl.getBoundingClientRect();
      railEl.scrollLeft += br.left - rr.left - (rr.width - br.width) / 2;
    }

    function render(fromUser) {
      shell.setAttribute("data-step", step);
      rail.forEach(function (b, i) {
        if (i + 1 === step) {
          b.setAttribute("aria-current", "step");
          if (fromUser) centerRail(b);
        } else b.removeAttribute("aria-current");
      });
      if (progressN) progressN.textContent = pad(step);
      if (prev) prev.disabled = step === 1;
      if (next) next.disabled = step === total;
      if (svg) {
        svg.setAttribute("data-view", step >= 4 ? "plot" : "table");
        svg.classList.toggle("is-reframed", step >= 4);
        svg.classList.toggle("is-formal", step >= 4);
      }
      if (step === 5) updatePick();
    }

    function go(n) {
      var prevStep = step;
      step = Math.max(1, Math.min(total, n));
      render(true);
      // if the narrative scrolled out of view, bring it back
      if (step !== prevStep && narrative) {
        var top = narrative.getBoundingClientRect().top;
        if (top < 64 || top > window.innerHeight - 120) {
          window.scrollTo({ top: window.scrollY + top - 80, behavior: reduce ? "auto" : "smooth" });
        }
      }
    }

    rail.forEach(function (b) {
      b.addEventListener("click", function () { go(parseInt(b.getAttribute("data-goto"), 10)); });
    });
    if (prev) prev.addEventListener("click", function () { go(step - 1); });
    if (next) next.addEventListener("click", function () { go(step + 1); });
    shell.addEventListener("keydown", function (e) {
      if (e.target.closest(".ex-choice")) return;
      if (e.key === "ArrowRight") { go(step + 1); e.preventDefault(); }
      if (e.key === "ArrowLeft") { go(step - 1); e.preventDefault(); }
    });

    // decision
    var feedback = shell.querySelector(".ex-feedback");
    var noteEl = feedback && feedback.querySelector(".ex-feedback__note");
    var checks = [].slice.call(shell.querySelectorAll(".ex-check"));
    var chosen = null;

    shell.querySelectorAll('.ex-choice input[type="radio"]').forEach(function (input) {
      input.addEventListener("change", function () {
        chosen = input.value;
        var correct = input.getAttribute("data-correct") === "true";
        if (feedback) feedback.setAttribute("data-state", correct ? "correct" : "incorrect");
        if (noteEl) noteEl.textContent = input.getAttribute("data-note") || "";
        checks.forEach(function (li) {
          var need = li.getAttribute("data-pass-option");
          if (!need) { li.removeAttribute("data-check"); return; }
          li.setAttribute("data-check", need === chosen ? "pass" : "fail");
        });
        var mark = input.getAttribute("data-mark");
        pickValue = mark == null || mark === "" ? null : parseFloat(mark);
        updatePick();
      });
    });

    // Only draws when the chosen option carries an explicit `mark` value — the
    // component never guesses a position from option ids.
    function updatePick() {
      if (!pick || !svg) return;
      if (pickValue == null || isNaN(pickValue)) {
        svg.classList.remove("is-picked");
        return;
      }
      pick.style.transform = "translateX(" + scaleX(pickValue).toFixed(1) + "px)";
      svg.classList.add("is-picked");
    }

    render();
  }

  /* --- watermark: gentle drift + a capped parallax nudge --- */
  if (!reduce) {
    var marks = document.querySelectorAll(".watermark");
    for (var m = 0; m < marks.length; m++) marks[m].classList.add("watermark--drift");

    var hero = document.querySelector(".hero__wm");
    if (hero) {
      var onScroll = function () {
        var shift = Math.min(window.scrollY * 0.12, 120);
        hero.style.marginTop = shift.toFixed(1) + "px";
      };
      window.addEventListener("scroll", onScroll, { passive: true });
      onScroll();
    }
  }
})();
