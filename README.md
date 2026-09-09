# tau.education — sitio (v2)

Generador estático sin framework. Node lee el contenido (JSON), lo valida contra
un esquema, tipografía la matemática con **KaTeX en tiempo de build**, genera cada
figura como **SVG inline a partir de números**, y escribe HTML plano en `dist/`.
El cliente no descarga KaTeX, no ejecuta matemática y no hace ningún `fetch`.

## Correr en local

```bash
npm install
npm run build        # genera dist/
npm run serve        # sirve dist/ en http://localhost:4173
# o de una:
npm run dev
```

`npm run validate:content` valida los cuatro archivos de contenido sin construir.
Un archivo que viola el esquema (o una regla que el esquema no puede expresar,
como "los cuatro miembros de la familia deben ser idénticos a cuatro de las doce
fórmulas") **rompe el build** nombrando el campo y el límite.

## Estructura

```
src/
  content/*.json        contenido + schema.json (fuente de la verdad editorial)
  site.config.mjs        dominio, navegación, <head> por ruta
  styles/*.css           01-tokens · 02-base · 03-components · fonts (se concatenan)
  js/app.js              mejora progresiva: reveal, toggles, deriva de la marca
  fonts/*.woff2          Anta · Didact Gothic · JetBrains Mono (subset latin+latin-ext)
  assets/                marca τ (SVG limpio, sin filtros)
  lib/
    validate.mjs         ajv + reglas de campo cruzado
    math.mjs             katex.renderToString
    figures.mjs          XYFit · Sparkline · RemovableDiscontinuity
    code.mjs             resaltado mínimo de Python (lectura, no ejecución)
    templates/           layout · home · course · labs · notfound
scripts/build.mjs        orquestador
scripts/serve.mjs        server estático de preview (sin dependencias)
```

## Rutas

| Ruta | Contenido |
| --- | --- |
| `/` | `content/home.json` |
| `/cursos/fundamentos-matematicos-machine-learning/` | `content/course-fundamentos-matematicos-machine-learning.json` |
| `/labs/` | `content/labs.json` |
| `404.html` | `content/notfound.json` |

## Cambiar contenido

Editar el `.json` correspondiente en `src/content/` y reconstruir. Los textos de
navegación y `<head>` viven en `src/site.config.mjs`. Colores, tipografía y
medidas en `src/styles/01-tokens.css`. Si el contenido necesita un campo nuevo,
se añade primero a `schema.json` y a `CONTENT-MODEL.md` (un nivel arriba), no a un
componente.

## Despliegue (GitHub Pages, plan gratuito)

`.github/workflows/deploy.yml` construye en cada push a `main` y publica `dist/`.
Una sola vez: **Settings → Pages → Build and deployment → Source: GitHub Actions**.

`dist/` incluye `CNAME`, `.nojekyll`, `robots.txt` y `sitemap.xml`. El dominio
sale de `site.config.mjs → site.domain`.

## Qué se adaptó del diseño de referencia

- El runtime de componentes del `.dc.html` (`<x-dc>`, `sc-for`, `renderVals`) no se
  portó; sólo se tomaron valores. El diseño usa estilos inline; aquí es CSS normal.
- KaTeX pasa de auto-render en cliente a `renderToString` en build (sin destello de
  `\[ ... \]`, sin JS de matemática en el cliente).
- Fuentes: de Google Fonts a self-host con subsets.
- El catálogo de fórmulas alterna con un checkbox + CSS (funciona sin JavaScript);
  la celda de código es `<details>` (plegada por defecto, nativa).
- La marca τ de marca de agua se mantiene **dentro de los márgenes de la página**
  (corrección heredada de v1), no sangrando fuera del borde.
- Cada figura se dibuja de números reales: el ajuste del notebook es un ajuste por
  mínimos cuadrados sobre los puntos observados; cada sparkline usa el generador
  que corresponde a la matemática de ese lab.
