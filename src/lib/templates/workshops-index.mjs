// /workshops — catalog index. Not part of the Claude Design handoff (which
// only covers ws001's landing + confirmation), so this reuses the site's
// existing chrome and typographic primitives (.section/.wrap/.tile/.btn from
// 02-base.css and 03-components.css) rather than inventing a new look.

import { html, raw } from "../html.mjs";
import { formatWorkshopDate, formatWorkshopTime, isUpcoming, isPast, workshopPath } from "../workshops.mjs";

const STATUS_LABEL = {
  upcoming: "Próximo",
  live: "En vivo",
  past: "Concluido",
  recording: "Grabación disponible",
};

function workshopCard(w) {
  const dateLine =
    w.date && w.time ? `${formatWorkshopDate(w)} · ${formatWorkshopTime(w)} (CDMX)` : "Fecha por confirmar";
  return html`
<div class="tile workshop-card">
  <p class="eyebrow eyebrow--amber">${STATUS_LABEL[w.status] || w.status}</p>
  <h3 class="h3">${w.title}</h3>
  <p class="prose">${w.shortDescription}</p>
  <p class="workshop-card__meta">${dateLine} · ${w.durationMinutes} min</p>
  <a class="btn btn--primary" href="${workshopPath(w)}"><span>Ver workshop</span><span class="arrow" aria-hidden="true">→</span></a>
</div>`;
}

export function workshopsIndexPage(workshops) {
  const upcoming = workshops.filter(isUpcoming);
  const past = workshops.filter(isPast);

  const upcomingSection = html`
<section class="section">
  <div class="wrap">
    <p class="eyebrow eyebrow--amber">Workshops</p>
    <h1 class="h1">Próximos workshops</h1>
    <p class="lede">Sesiones en vivo, gratuitas, para aprender la matemática que sostiene a Machine Learning.</p>
    <div class="tiles tiles--workshops">${raw(upcoming.map(workshopCard).join(""))}</div>
  </div>
</section>`;

  const pastSection = past.length
    ? html`
<section class="section section--deep">
  <div class="wrap">
    <h2 class="h2">Workshops anteriores</h2>
    <div class="tiles">${raw(past.map(workshopCard).join(""))}</div>
  </div>
</section>`
    : "";

  return upcomingSection + pastSection;
}
