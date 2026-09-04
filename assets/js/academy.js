/* ===========================================================================
   tau.education — Tau Academy index.
   Renders discipline tabs + reference cards from data/academy.json.
   Discipline is kept in the URL (?d=slug). Client-side sort. Explicit empty
   state for disciplines still in curación — the tab is never hidden.
   =========================================================================== */

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => (
  { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const NIVEL_ORDER = { inicial: 0, intermedio: 1, avanzado: 2 };

function sortFichas(fichas, by) {
  const f = [...fichas];
  if (by === "nivel") f.sort((a, b) => (NIVEL_ORDER[a.nivel] ?? 9) - (NIVEL_ORDER[b.nivel] ?? 9));
  else if (by === "enfoque") f.sort((a, b) => (a.tags[0] || "").localeCompare(b.tags[0] || "", "es"));
  else f.sort((a, b) => a.tipo.localeCompare(b.tipo, "es"));
  return f;
}

function fichaCard(f) {
  const doi = f.doi ? `<p class="ficha__doi">DOI ${esc(f.doi)}</p>` : "";
  const tags = f.tags.map((t) => {
    const isLabs = /labs/i.test(t) || (f.labsRelacionada && t === f.labsRelacionada);
    return `<span class="chip${isLabs ? " chip--accent" : ""}">${esc(t)}</span>`;
  }).join("");
  const labsTag = f.labsRelacionada ? `<span class="chip chip--accent">Labs · ${esc(f.labsRelacionada)}</span>` : "";
  return `
    <a class="ficha" href="${esc(f.enlace)}" target="_blank" rel="noopener">
      <div class="ficha__head">
        <span class="ficha__type">${esc(f.tipo)}</span>
        <span class="ficha__level">nivel ${esc(f.nivel)}</span>
      </div>
      <h3>${esc(f.titulo)}</h3>
      <p class="ficha__by">${esc(f.autoria)} · ${esc(f.anio)}</p>
      <p>${esc(f.relevancia)}</p>
      ${doi}
      <div class="ficha__tags">${tags}${labsTag}</div>
    </a>`;
}

export async function initAcademy(rootSel = "#academy-root") {
  const root = document.querySelector(rootSel);
  if (!root) return;
  const data = await (await fetch("/data/academy.json")).json();
  const params = new URLSearchParams(location.search);
  let active = params.get("d") || data.disciplinas[0].slug;
  if (!data.disciplinas.some((d) => d.slug === active)) active = data.disciplinas[0].slug;
  let sortBy = "tipo";

  root.innerHTML = `
    <div class="disc-tabs" role="tablist" aria-label="Disciplinas"></div>
    <div class="flex-between" style="margin:32px 0 26px">
      <h2 class="h2-md" data-disc-title></h2>
      <span class="meta-mono">ordenar:
        <button class="sort-btn" data-sort="tipo">tipo</button> ·
        <button class="sort-btn" data-sort="nivel">nivel</button> ·
        <button class="sort-btn" data-sort="enfoque">enfoque</button>
      </span>
    </div>
    <div data-disc-body></div>`;

  const tabsEl = root.querySelector(".disc-tabs");
  const titleEl = root.querySelector("[data-disc-title]");
  const bodyEl = root.querySelector("[data-disc-body]");

  tabsEl.innerHTML = data.disciplinas.map((d) =>
    `<button class="disc-tab" role="tab" data-slug="${d.slug}" aria-selected="${d.slug === active}">${esc(d.nombre)}</button>`
  ).join("");

  root.querySelectorAll(".sort-btn").forEach((b) => {
    b.style.cssText = "background:none;border:0;color:inherit;cursor:pointer;font:inherit;padding:0";
    b.addEventListener("click", () => { sortBy = b.dataset.sort; render(); });
  });

  tabsEl.addEventListener("click", (e) => {
    const btn = e.target.closest(".disc-tab");
    if (!btn) return;
    active = btn.dataset.slug;
    const u = new URL(location);
    u.searchParams.set("d", active);
    history.replaceState(null, "", u);
    render();
  });

  function render() {
    const disc = data.disciplinas.find((d) => d.slug === active);
    tabsEl.querySelectorAll(".disc-tab").forEach((t) =>
      t.setAttribute("aria-selected", String(t.dataset.slug === active)));
    root.querySelectorAll(".sort-btn").forEach((b) =>
      b.style.color = b.dataset.sort === sortBy ? "var(--accent)" : "inherit");
    titleEl.textContent = disc.nombre;

    if (!disc.fichas.length) {
      bodyEl.innerHTML = `<p class="ficha-empty">${esc(data.disciplinaVacia)}</p>`;
      return;
    }
    bodyEl.innerHTML = `<div class="ficha-grid">${sortFichas(disc.fichas, sortBy).map(fichaCard).join("")}</div>
      <p class="meta-mono" style="margin-top:20px">${disc.fichas.length} referencias · enlaces verificados para la v1</p>`;
  }

  render();
}
