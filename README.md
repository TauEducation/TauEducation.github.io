# tau.education — sitio v1

Sitio estático, sin backend y sin paso de build. Son archivos HTML + CSS + JS que
se sirven tal cual desde cualquier hosting estático (Netlify, GitHub Pages, Cloudflare
Pages, un bucket, …) o desde un servidor local.

## Correr en local

Necesita servirse por HTTP (los módulos ES y `fetch` no funcionan con `file://`):

```bash
cd site
python -m http.server 8000
# o:  npx serve .
```

Luego abrir <http://localhost:8000>.

## Estructura

```
site/
  *.html                 una página por archivo
  labs/                  Tau Labs (unidad + clase)
  legal/                 avisos legales (stubs)
  assets/css/            tokens.css · base.css · components.css · fonts.css
  assets/js/             config.js · components.js · main.js · forms.js · academy.js · labs.js · labs-pyodide.js
  assets/img/            tau-mark.svg
  data/                  contenido que crece: academy.json · investigacion.json · labs/*.json · *.ipynb · *.csv
```

## Qué se cambia y dónde

| Quiero cambiar… | Archivo |
|---|---|
| Correo, dominio, dirección, teléfono, redes | `assets/js/config.js` → `contact` |
| Enlaces del menú o del footer, año de copyright | `assets/js/config.js` → `nav`, `footer`, `copyright` |
| Texto del CTA del header | `assets/js/config.js` → `headerCta` |
| Colores, tipografía, medidas | `assets/css/tokens.css` |
| Fichas de Academy (añadir una referencia o abrir una disciplina) | `data/academy.json` |
| Precedentes o biblioteca de Investigación | `data/investigacion.json` (y `investigacion.html` para la tabla de precedentes) |
| El contenido de una clase de Labs | `data/labs/<slug>.json` + su `<slug>.ipynb` |
| Copy de una página | el `.html` de esa página |

El header, el footer, el bloque de contacto y el formulario de novedades se generan desde
`config.js` mediante Web Components (`<tau-header>`, `<tau-footer>`, `<tau-contact>`,
`<tau-newsletter>`). Cambiar un dato ahí se propaga a todas las páginas.

## Formularios (sin backend)

`config.js → forms`:

- `newsletterEndpoint` / `contactEndpoint`: si pones una URL de un servicio de formularios
  (Formspree, Buttondown, Netlify Forms, un Worker…), el formulario hace `POST` ahí.
- Si están vacíos, el formulario valida en el cliente y **abre un correo prellenado**
  (`mailto:`) a `contact.email`.

## Tau Labs — cómo se ejecuta la clase

1. **Estático**: el cuaderno se renderiza desde `data/labs/<slug>.json` con los resultados
   ya calculados (consistentes con el dataset y con `CONTENT-SOURCES.md`).
2. **Recalculado en el navegador** (automático si el sitio se sirve por HTTP): `labs.js` lee
   el CSV y rehace el ajuste (Gauss-Newton) y la búsqueda de raíz (bisección) en JavaScript
   puro; aparece un control de `T_sala` para ver la sensibilidad. Sin dependencias.
3. **Python real (opcional)**: el botón «Ejecutar con Python real» carga Pyodide + numpy/
   scipy/pandas desde el CDN (`config.integrations.pyodideIndexUrl`) **sólo al pulsarlo** y
   ejecuta las celdas del `.ipynb`.

Sin JavaScript, la clase muestra un resumen y el enlace de descarga del `.ipynb`.

## Añadir una clase de Labs

1. Crear `data/labs/<slug>.json` (copiar `camara-termica.json` como plantilla).
2. Crear `data/labs/<slug>.ipynb` con las mismas celdas de código.
3. Copiar `labs/camara-termica.html` a `labs/<slug>.html` y cambiar `data-class="<slug>"`,
   `<title>` y la descripción.
4. Añadir la fila en la lista de `labs/index.html`.

## Fuentes

`assets/css/fonts.css` carga Anta, Didact Gothic e IBM Plex Mono desde Google Fonts.
Para autoalojarlas: reemplazar el `@import` por `@font-face` locales (woff2, `font-display:swap`)
y quitar los `<link rel="preconnect">` de los `<head>`.

## Despliegue

Este repo (`TauEducation/TauEducation.github.io`) **es** la raíz del sitio: los archivos
del sitio están en la raíz del repo, no en un subdirectorio. Los enlaces son absolutos
(`/academy.html`), lo cual es correcto porque se sirve en la raíz de `tau.education`.

Ya viene preparado:

- `CNAME` — dominio personalizado (`tau.education`).
- `.nojekyll` — evita el procesado Jekyll; los archivos se sirven tal cual.
- `404.html` — GitHub Pages lo sirve automáticamente en rutas desconocidas.
- `robots.txt`, `sitemap.xml`.

### Publicar (una sola vez)

1. `git push` a `main` (ya configurado el remoto `origin`).
2. **Settings → Pages → Build and deployment → Source: _Deploy from a branch_ → `main` / `(root)`.**
   (En un repo `*.github.io` Pages se activa solo; sólo hay que confirmar rama y carpeta.)
3. **Settings → Pages → Custom domain**: debe aparecer `tau.education` (lo toma del `CNAME`).
   Marcar **Enforce HTTPS** cuando GitHub emita el certificado (unos minutos).
4. DNS del dominio:
   - `A` de `@` → `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - `CNAME` de `www` → `taueducation.github.io`
   - (si el registrador soporta `ALIAS`/`ANAME` en el ápice, apuntarlo a `taueducation.github.io`)

Cada `git push` a `main` republica el sitio en 1–2 minutos.

Cambiar el dominio más adelante: editar `CNAME`, `robots.txt`, `sitemap.xml` y
`contact.domain` / `contact.url` en `assets/js/config.js`.

### Cualquier otro hosting estático

Subir el contenido del repo a la raíz (Netlify, Cloudflare Pages, un bucket S3+CDN…).
Configurar `404.html` como página de error si el hosting lo pide.

## Documentos de handoff

El brief editorial, `IMPLEMENTATION.md`, `content-slots.json`, el mockup de diseño y las
fuentes viven **fuera** de este repo (son internos y este repo es público). Se conservan
en el directorio de trabajo local, un nivel arriba.
