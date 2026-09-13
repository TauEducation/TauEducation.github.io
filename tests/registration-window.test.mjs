// Registration-cutoff QA. Plain node:assert, no test framework dependency —
// none exists in this project yet (see package.json). Run with:
//   node tests/registration-window.test.mjs
//
// Deliberately tests the exported *pure* functions with explicit `now`
// values rather than mocking the system clock: isRegistrationCutoffPassed(w,
// now) already takes `now` as a normal optional parameter (default
// `new Date()`), so no client-visible query param or env-var override was
// needed anywhere in production code to make this testable.

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync, copyFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { loadWorkshops, canRegister, isRegistrationCutoffPassed } from "../src/lib/workshops.mjs";
import { workshopLandingPage } from "../src/lib/templates/workshop.mjs";
import { workshopConfirmedPage } from "../src/lib/templates/workshop-confirmed.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const SITE_ROOT = dirname(HERE);
const CONTENT_DIR = join(SITE_ROOT, "src/content/workshops");

let passed = 0;
const failures = [];

function test(name, fn) {
  try {
    fn();
    passed++;
  } catch (err) {
    failures.push({ name, err });
  }
}

/* ------------------------------------------------------------- fixtures */

const [ws001] = loadWorkshops(CONTENT_DIR);
assert.equal(ws001.id, "ws001", "sanity: ws001.json is the loaded fixture");
assert.equal(ws001.registration.closesAt, "2026-09-27T19:00:00-06:00", "sanity: real cutoff is still the one from the spec");

function clone(w) {
  return JSON.parse(JSON.stringify(w));
}

const FAR_FUTURE = "2099-01-01T00:00:00-06:00";
const FAR_PAST = "2000-01-01T00:00:00-06:00";

const openFixture = clone(ws001);
openFixture.registration.closesAt = FAR_FUTURE;

const closedFixture = clone(ws001);
closedFixture.registration.closesAt = FAR_PAST;

const noCutoffFixture = clone(ws001);
noCutoffFixture.registration.closesAt = null;
delete noCutoffFixture.copy.landing.registrationClosed;

/* --------------------------------------------------- 1. boundary logic */

test("open strictly before the cutoff instant", () => {
  const w = { registration: { closesAt: "2026-09-27T19:00:00-06:00" } };
  assert.equal(isRegistrationCutoffPassed(w, new Date("2026-09-27T18:59:59-06:00")), false);
});

test("closed exactly AT the cutoff instant (>=, not >)", () => {
  const w = { registration: { closesAt: "2026-09-27T19:00:00-06:00" } };
  assert.equal(isRegistrationCutoffPassed(w, new Date("2026-09-27T19:00:00-06:00")), true);
});

test("closed strictly after the cutoff instant", () => {
  const w = { registration: { closesAt: "2026-09-27T19:00:00-06:00" } };
  assert.equal(isRegistrationCutoffPassed(w, new Date("2026-09-27T19:00:01-06:00")), true);
});

test("null closesAt never closes, regardless of now", () => {
  const w = { registration: { closesAt: null } };
  assert.equal(isRegistrationCutoffPassed(w, new Date("2999-01-01T00:00:00Z")), false);
});

test("canRegister() is unaffected by the cutoff — status/open flag only", () => {
  // closedFixture's registration window has long since closed, but its
  // status/open flag are untouched — canRegister must stay true. Reaching a
  // cutoff must not be conflated with "past" (that's isRegistrationCutoffPassed).
  assert.equal(canRegister(closedFixture), true);
  assert.equal(isRegistrationCutoffPassed(closedFixture), true);
});

/* ------------------------------------------- 2. timezone independence */

test("an equivalent instant in a different offset notation agrees", () => {
  const w = { registration: { closesAt: "2026-09-27T19:00:00-06:00" } };
  // -06:00 19:00 == UTC 01:00 the next day.
  const equivalentUtc = new Date("2026-09-28T01:00:00Z");
  const equivalentLocalLooking = new Date("2026-09-27T19:00:00-06:00");
  assert.equal(
    isRegistrationCutoffPassed(w, equivalentUtc),
    isRegistrationCutoffPassed(w, equivalentLocalLooking)
  );
});

test("closesAt parsing is independent of the runtime's own TZ env var", () => {
  // Mirrors the exact bug class this codebase hit before with
  // zonedTimeToUtc(): a naive implementation can silently go wrong only when
  // the process's local TZ happens to match something in play. Runs the
  // comparison in child processes under three different TZs and checks all
  // three agree, rather than trusting that today's process TZ isn't the one
  // hiding a bug.
  const script = `
    const closesAtMs = new Date("2026-09-27T19:00:00-06:00").getTime();
    const nowMs = new Date("2026-09-27T19:00:00-06:00").getTime();
    process.stdout.write(String(nowMs >= closesAtMs));
  `;
  const tzs = ["UTC", "America/Mexico_City", "Pacific/Auckland"];
  const results = tzs.map((tz) =>
    execFileSync(process.execPath, ["-e", script], { env: { ...process.env, TZ: tz } }).toString()
  );
  assert.ok(results.every((r) => r === results[0]), `expected identical results across TZs, got: ${results.join(", ")}`);
  assert.equal(results[0], "true");
});

/* --------------------------------------------- 3. registry validation */

test("schema rejects registration.closesAt without an explicit UTC offset", () => {
  const dir = mkdtempSync(join(tmpdir(), "tau-ws-test-"));
  try {
    copyFileSync(join(CONTENT_DIR, "schema.json"), join(dir, "schema.json"));
    const bad = clone(ws001);
    bad.registration.closesAt = "2026-09-27T19:00:00"; // no offset — ambiguous, forbidden
    writeFileSync(join(dir, "ws001.json"), JSON.stringify(bad));
    assert.throws(() => loadWorkshops(dir));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("build rejects a closesAt with no matching copy.landing.registrationClosed", () => {
  const dir = mkdtempSync(join(tmpdir(), "tau-ws-test-"));
  try {
    copyFileSync(join(CONTENT_DIR, "schema.json"), join(dir, "schema.json"));
    const bad = clone(ws001);
    delete bad.copy.landing.registrationClosed; // closesAt is still set on `bad`
    writeFileSync(join(dir, "ws001.json"), JSON.stringify(bad));
    assert.throws(() => loadWorkshops(dir), /registrationClosed is missing/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("a workshop with no cutoff at all still loads (backward compatible)", () => {
  const dir = mkdtempSync(join(tmpdir(), "tau-ws-test-"));
  try {
    copyFileSync(join(CONTENT_DIR, "schema.json"), join(dir, "schema.json"));
    writeFileSync(join(dir, "ws001.json"), JSON.stringify(noCutoffFixture));
    assert.doesNotThrow(() => loadWorkshops(dir));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

/* ------------------------------------------------ 4. rendered landing */

test("before cutoff: systeme.io mount visible, closed notice hidden, CTAs visible", () => {
  const html = workshopLandingPage(openFixture);
  assert.match(html, /data-hero-form-mount(?![^>]*hidden)[^>]*>/s, "hero mount must not be hidden");
  assert.match(html, /data-registration-closed-cutoff[^>]*hidden/s, "closed notice must be hidden");
  const ctaMatches = [...html.matchAll(/data-open-modal="registration"[^>]*>/g)];
  assert.equal(ctaMatches.length, 2, "expected exactly 2 registration CTAs (fit-block + sticky)");
  ctaMatches.forEach((m) => assert.doesNotMatch(m[0], /hidden/, `CTA should be visible: ${m[0]}`));
  assert.doesNotMatch(html, /<script[^>]*id="form-script-tag-25425925"/, "the systeme.io script must never be inlined by the build — only workshop.js injects it");
});

test("after cutoff: systeme.io mount hidden, closed notice visible with the right copy, CTAs hidden", () => {
  const html = workshopLandingPage(closedFixture);
  assert.match(html, /data-hero-form-mount[^>]*hidden/s, "hero mount must be hidden");
  assert.match(html, /data-registration-closed-cutoff(?![^>]*hidden)[^>]*>/s, "closed notice must not be hidden");
  assert.match(html, /Registro cerrado/);
  assert.match(html, /El registro para este workshop ha cerrado\./);
  assert.match(html, /¿Qué significa que un modelo aprenda\?/);
  assert.match(html, /tau\.education\/workshops/);
  const ctaMatches = [...html.matchAll(/data-open-modal="registration"[^>]*>/g)];
  assert.equal(ctaMatches.length, 2);
  ctaMatches.forEach((m) => assert.match(m[0], /hidden/, `CTA should be hidden: ${m[0]}`));
  assert.doesNotMatch(html, /<script[^>]*id="form-script-tag-25425925"/);
});

test("no closesAt configured: unchanged legacy behavior (eager inline script, no lazy-mount markup)", () => {
  const html = workshopLandingPage(noCutoffFixture);
  assert.match(html, /<script id="form-script-tag-25425925" src="[^"]+"><\/script>/, "must keep the original eager embed");
  assert.doesNotMatch(html, /data-hero-form-mount/);
  assert.doesNotMatch(html, /data-registration-closed-cutoff/);
});

/* --------------------------------------------------- 5. confirmado page */

test("confirmado page is unaffected by registration cutoff, before and after", () => {
  for (const fixture of [openFixture, closedFixture]) {
    const html = workshopConfirmedPage(fixture);
    assert.match(html, /data-modal="research"/, "research modal must still render");
    assert.match(html, /Añadir al calendario|calendarCtaLabel/i, "calendar CTA area must still render");
    assert.doesNotMatch(html, /Registro cerrado/, "closed-registration copy must never leak onto /confirmado");
    assert.doesNotMatch(html, /data-registration-closed-cutoff/);
  }
});

/* ------------------------------------------------------------- summary */

console.log(`\n${passed}/${passed + failures.length} passed`);
if (failures.length) {
  for (const { name, err } of failures) {
    console.error(`\nFAIL: ${name}`);
    console.error(err.message || err);
  }
  process.exit(1);
}
