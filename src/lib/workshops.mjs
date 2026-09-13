// Workshop registry: one source of truth read from src/content/workshops/*.json.
// Adding ws002 means adding a JSON file here — no template, route, or script
// duplication required. See src/lib/templates/workshop.mjs (landing),
// workshop-confirmed.mjs (confirmation) and workshops-index.mjs (/workshops).

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import Ajv from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

export const PLACEHOLDER_FECHA = "[FECHA]";
export const PLACEHOLDER_HORA = "[HORA]";
export const PLACEHOLDER_INSTRUCTOR = "[INSTRUCTOR]";

const WEEKDAYS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const MONTHS = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

/**
 * Load, validate and sort every workshop from a content directory.
 * @param {string} contentDir  path to src/content/workshops
 */
export function loadWorkshops(contentDir) {
  const schema = JSON.parse(readFileSync(join(contentDir, "schema.json"), "utf8"));
  const ajv = new Ajv({ allErrors: true, strict: false });
  addFormats(ajv);
  const validate = ajv.compile(schema);

  const files = readdirSync(contentDir).filter((f) => f.endsWith(".json") && f !== "schema.json").sort();
  const workshops = files.map((file) => {
    const data = JSON.parse(readFileSync(join(contentDir, file), "utf8"));
    if (!validate(data)) {
      const list = validate.errors
        .map((e) => `  • ${e.instancePath || "(root)"} ${e.message}`)
        .join("\n");
      throw new Error(`Workshop validation failed for ${file}:\n${list}`);
    }
    for (const err of crossFieldChecks(data)) {
      throw new Error(`Workshop validation failed for ${file}: ${err}`);
    }
    return data;
  });

  const seenIds = new Set();
  const seenSlugs = new Set();
  for (const w of workshops) {
    if (seenIds.has(w.id)) throw new Error(`Duplicate workshop id "${w.id}"`);
    if (seenSlugs.has(w.slug)) throw new Error(`Duplicate workshop slug "${w.slug}"`);
    seenIds.add(w.id);
    seenSlugs.add(w.slug);
  }

  return workshops.sort((a, b) => a.id.localeCompare(b.id));
}

function crossFieldChecks(w) {
  const errors = [];
  if ((w.date == null) !== (w.time == null)) {
    errors.push("date and time must both be set or both be null (no partial schedule)");
  }
  if (w.recording.available && !w.recording.youtubeId) {
    errors.push("recording.available is true but recording.youtubeId is null");
  }
  if (!w.recording.available && w.status === "recording") {
    errors.push('status is "recording" but recording.available is false');
  }
  const flat = JSON.stringify(w);
  if (/[!¡]/.test(flat.replace(/"tex"\s*:\s*"[^"]*"/g, ""))) {
    errors.push("exclamation mark found in copy (banned site-wide)");
  }
  return errors;
}

/** URL path for a workshop's landing page (leading + trailing slash). */
export function workshopPath(w) {
  return `/workshops/${w.slug}-${w.id}/`;
}

/** URL path for a workshop's confirmation page. */
export function workshopConfirmPath(w) {
  return `${workshopPath(w)}confirmado/`;
}

/** dist/ output file for the landing page. */
export function workshopOutFile(w) {
  return `workshops/${w.slug}-${w.id}/index.html`;
}

/** dist/ output file for the confirmation page. */
export function workshopConfirmOutFile(w) {
  return `workshops/${w.slug}-${w.id}/confirmado/index.html`;
}

export function isUpcoming(w) {
  return w.status === "upcoming" || w.status === "live";
}

export function isPast(w) {
  return w.status === "past" || w.status === "recording";
}

/** Registration is only ever open on an upcoming workshop with the flag set. */
export function canRegister(w) {
  return w.status === "upcoming" && w.registration.open;
}

/**
 * "Miércoles 24 de septiembre" — or the centralized placeholder while the
 * date is still TBD. Never write [FECHA] directly in a template.
 */
export function formatWorkshopDate(w) {
  if (!w.date) return PLACEHOLDER_FECHA;
  const [y, m, d] = w.date.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  const weekday = WEEKDAYS[dt.getUTCDay()];
  const month = MONTHS[dt.getUTCMonth()];
  const cap = weekday.charAt(0).toUpperCase() + weekday.slice(1);
  return `${cap} ${dt.getUTCDate()} de ${month}`;
}

/** "7:30 PM" — from the stored 24h "19:30", or the placeholder while TBD. */
export function formatWorkshopTime(w) {
  if (!w.time) return PLACEHOLDER_HORA;
  const [h, m] = w.time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const h12 = ((h + 11) % 12) + 1;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}

/**
 * Convert a wall-clock date+time in an IANA timezone to a UTC Date, without
 * pulling in a timezone library. Deliberately does NOT use the common
 * `new Date(x.toLocaleString(..., {timeZone}))` trick: that reparses a
 * formatted string through the *process's own* local timezone, so it goes
 * silently wrong (a zero offset) whenever the machine's local zone happens
 * to match `timeZone` — exactly the case on a box already set to
 * America/Mexico_City. Instead: guess the UTC instant, ask Intl what wall
 * clock that instant shows in `timeZone` (an explicit param, never the
 * system default), and correct the guess by the difference — everything
 * stays in the UTC-epoch domain.
 */
function zonedTimeToUtc(dateStr, timeStr, timeZone) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const [hh, mm] = timeStr.split(":").map(Number);
  const guess = Date.UTC(y, m - 1, d, hh, mm, 0);

  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone,
      hour12: false,
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
    })
      .formatToParts(new Date(guess))
      .filter((p) => p.type !== "literal")
      .map((p) => [p.type, Number(p.value)])
  );
  // Intl's 24h format uses "24" for midnight instead of "00".
  const shownHour = parts.hour === 24 ? 0 : parts.hour;
  const shown = Date.UTC(parts.year, parts.month - 1, parts.day, shownHour, parts.minute, parts.second);

  return new Date(guess + (guess - shown));
}

function toGCalStamp(date) {
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

/**
 * Google Calendar link for the confirmation page's "Añadir al calendario"
 * CTA. Returns null when there's nothing usable yet — there is nothing to
 * add to a calendar for a TBD session.
 *
 * Prefers `w.calendarUrl` when the registry provides one: a pre-made event
 * link the client manages directly in their own Google Calendar (may
 * resolve to a page carrying the real Meet link, gated behind RSVP — never
 * surfaced on the public landing page, only here on /confirmado). Falls
 * back to a generated "TEMPLATE" link built from date/time so a future
 * workshop works before anyone has hand-built a calendar event for it.
 */
export function googleCalendarUrl(w, siteOrigin) {
  if (w.calendarUrl) return w.calendarUrl;
  if (!w.date || !w.time) return null;
  const start = zonedTimeToUtc(w.date, w.time, w.timezone);
  const end = new Date(start.getTime() + w.durationMinutes * 60 * 1000);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: w.title,
    dates: `${toGCalStamp(start)}/${toGCalStamp(end)}`,
    details: `El enlace de acceso llegará por correo.\n\n${siteOrigin}${workshopPath(w)}`,
    location: w.locationLabel,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
