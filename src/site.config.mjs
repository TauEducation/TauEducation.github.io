// Everything that is not editorial content and not a design token: the domain,
// the navigation, per-route document metadata. One file, so a change here
// propagates to every page.

export const COURSE_SLUG = "fundamentos-matematicos-machine-learning";

export const site = {
  domain: "tau.education",
  origin: "https://tau.education",
  lang: "es",
  titleSuffix: "Tau Education",
  themeColor: "#191817",
  brand: "Tau Education",
  brandShort: "Tau",
};

export const nav = [
  { label: "Inicio", href: "/" },
  { label: "Academy", href: `/cursos/${COURSE_SLUG}/` },
  { label: "Labs", href: "/labs/" },
];

export const headerCta = { label: "Explorar el curso", href: `/cursos/${COURSE_SLUG}/` };

// Per-route <head> data. `tag` is the mono section marker in the header.
export const routes = {
  home: {
    out: "index.html",
    path: "/",
    tag: "Inicio",
    title: "Tau Education — Matemáticas con estructura",
    description:
      "Cursos de matemáticas para Machine Learning construidos alrededor de una idea: reconocer la estructura de un problema, elegir una representación, justificar el método y validar el resultado.",
  },
  course: {
    out: `cursos/${COURSE_SLUG}/index.html`,
    path: `/cursos/${COURSE_SLUG}/`,
    tag: "Academy",
    title: "Fundamentos Matemáticos para Machine Learning — Tau Academy",
    description:
      "Un programa de seis semanas que conecta vectores, matrices, loss, gradientes, probabilidad y generalización dentro de una sola historia: cómo aprende un modelo.",
  },
  labs: {
    out: "labs/index.html",
    path: "/labs/",
    tag: "Labs",
    title: "Tau Labs — Exploraciones para pensar con modelos",
    description:
      "Notebooks y experimentos breves donde una pregunta matemática se desarrolla con gráficas, datos y cómputo. Se leen completos, sin ejecutar nada.",
  },
  notfound: {
    out: "404.html",
    path: "/404.html",
    tag: "404",
    title: "Este punto no está en el dominio — Tau Education",
    description: "La página no existe: el límite existe, pero el valor no.",
  },
};
