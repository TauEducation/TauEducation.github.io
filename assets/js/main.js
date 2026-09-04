/* ===========================================================================
   tau.education — single entry point. Every page loads just this:
     <script type="module" src="/assets/js/main.js"></script>
   It registers the shared components and lazily runs the page module that
   matches whatever roots are present in the DOM.
   =========================================================================== */

import "./components.js";

if (document.querySelector("#academy-root")) {
  import("./academy.js").then((m) => m.initAcademy());
}

if (document.querySelector("#labs-notebook[data-class]")) {
  import("./labs.js").then((m) => m.initLabsClass());
}
