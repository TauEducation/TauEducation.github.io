// Hand-written low-poly diorama SVGs for the workshop feedback-loop visual
// (DATA → TRANSFORM → PREDICT → ERROR → ADJUST ↺). Static geometry, no
// per-workshop data — a future workshop that wants the same visual language
// can reuse these; one that doesn't can supply its own figure module without
// touching the registry or the page templates.

/** Open loop, used on the landing page ("Recorrido" block). */
export function learningLoopDiagram() {
  return `
<svg viewBox="95 85 830 470" class="wsp-diagram" role="img" aria-label="Diagrama: datos, transformación, predicción, error y ajuste en un ciclo de aprendizaje">
  <g stroke="rgba(111,192,216,.45)" stroke-width="2" fill="none">
    <path d="M120 150 L180 108 L240 158 M180 108 L150 208 L215 206 L240 158 M180 108 L215 206 M120 150 L150 208"/>
  </g>
  <g fill="#6fc0d8">
    <polygon points="120,137 133,150 120,163 107,150"/>
    <polygon points="180,95 193,108 180,121 167,108"/>
    <polygon points="240,145 253,158 240,171 227,158"/>
    <polygon points="150,195 163,208 150,221 137,208"/>
    <polygon points="215,193 228,206 215,219 202,206"/>
  </g>

  <line x1="228" y1="219" x2="308" y2="296" stroke="rgba(233,231,226,.32)" stroke-width="2"/>
  <polygon points="324,311 315,291 302,304" fill="rgba(233,231,226,.5)"/>

  <g fill="rgba(233,231,226,.035)" stroke="rgba(233,231,226,.32)" stroke-width="2.4">
    <polygon points="300,430 470,385 570,425 400,470"/>
    <polygon points="300,350 470,305 570,345 400,390"/>
  </g>
  <g stroke="rgba(233,231,226,.15)" stroke-width="1.8" fill="none">
    <line x1="300" y1="430" x2="570" y2="425"/><line x1="470" y1="385" x2="400" y2="470"/>
    <line x1="300" y1="350" x2="570" y2="345"/><line x1="470" y1="305" x2="400" y2="390"/>
    <line x1="300" y1="430" x2="300" y2="350"/><line x1="470" y1="385" x2="470" y2="305"/>
    <line x1="570" y1="425" x2="570" y2="345"/><line x1="400" y1="470" x2="400" y2="390"/>
  </g>

  <line x1="590" y1="354" x2="630" y2="370" stroke="rgba(233,231,226,.32)" stroke-width="2"/>
  <polygon points="650,378 634,363 628,378" fill="rgba(233,231,226,.5)"/>

  <polygon points="760,300 840,390 760,480 680,390" fill="rgba(224,182,117,.07)" stroke="#e0b675" stroke-width="2.6"/>
  <g stroke="rgba(224,182,117,.35)" stroke-width="1.8" fill="none">
    <line x1="760" y1="300" x2="760" y2="480"/><line x1="680" y1="390" x2="840" y2="390"/>
  </g>

  <line x1="804" y1="341" x2="872" y2="286" stroke="rgba(224,182,117,.45)" stroke-width="1.8" stroke-dasharray="6 7"/>
  <polygon points="886,255 903,272 886,289 869,272" fill="rgba(224,182,117,.85)"/>
  <polygon points="902,271 919,288 902,305 885,288" fill="none" stroke="rgba(224,182,117,.5)" stroke-width="2"/>

  <path d="M902 312 L902 528 L341 528 L341 500" fill="none" stroke="#e0b675" stroke-width="2.6" stroke-dasharray="11 11" stroke-linejoin="miter" class="wsp-loop-path"/>
  <polygon points="341,478 350,498 332,498" fill="#e0b675"/>
</svg>`.trim();
}

/** Closed loop with an orbiting ring, used on the confirmation page. */
export function learningLoopClosedDiagram() {
  return `
<svg viewBox="60 40 500 430" class="wsp-diagram wsp-diagram--closed" role="img" aria-label="Diagrama: el ciclo de aprendizaje ya cerrado">
  <g stroke="rgba(111,192,216,.4)" stroke-width="2" fill="none">
    <path d="M140 150 L200 108 L260 158 M200 108 L170 208 L235 206 L260 158 M200 108 L235 206 M140 150 L170 208"/>
  </g>
  <g fill="#6fc0d8">
    <polygon points="140,137 153,150 140,163 127,150"/>
    <polygon points="200,95 213,108 200,121 187,108"/>
    <polygon points="260,145 273,158 260,171 247,158"/>
    <polygon points="170,195 183,208 170,221 157,208"/>
    <polygon points="235,193 248,206 235,219 222,206"/>
  </g>

  <g fill="rgba(233,231,226,.035)" stroke="rgba(233,231,226,.3)" stroke-width="2.2">
    <polygon points="180,390 320,352 410,388 270,426"/>
    <polygon points="180,320 320,282 410,318 270,356"/>
  </g>
  <g stroke="rgba(233,231,226,.14)" stroke-width="1.6" fill="none">
    <line x1="180" y1="390" x2="410" y2="388"/><line x1="320" y1="352" x2="270" y2="426"/>
    <line x1="180" y1="320" x2="410" y2="318"/><line x1="320" y1="282" x2="270" y2="356"/>
    <line x1="180" y1="390" x2="180" y2="320"/><line x1="320" y1="352" x2="320" y2="282"/>
    <line x1="410" y1="388" x2="410" y2="318"/><line x1="270" y1="426" x2="270" y2="356"/>
  </g>

  <polygon points="470,190 524,250 470,310 416,250" fill="rgba(224,182,117,.1)" stroke="#e0b675" stroke-width="2.4"/>
  <g stroke="rgba(224,182,117,.35)" stroke-width="1.6" fill="none">
    <line x1="470" y1="190" x2="470" y2="310"/><line x1="416" y1="250" x2="524" y2="250"/>
  </g>

  <circle cx="320" cy="250" r="186" fill="none" stroke="rgba(224,182,117,.55)" stroke-width="2.2" stroke-dasharray="10 12" class="wsp-orbit-path"/>
  <polygon points="320,52 334,64 320,76 306,64" fill="#e0b675"/>
</svg>`.trim();
}
