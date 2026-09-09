// Build-time content validation. A file that violates the schema (or one of the
// cross-field rules the schema cannot express) fails the build with the field
// path and the limit that was broken — content is handed over as JSON and the
// limits are layout limits, so a silent ship is worse than a red build.

import Ajv from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const DEF_BY_PAGE = {
  home: "#/$defs/home",
  labs: "#/$defs/labs",
  notfound: "#/$defs/notfound",
  course: "#/$defs/course",
};

// Words the philosophy doc bans outright, plus punctuation the design forbids.
const FORBIDDEN_VOCAB = [
  "revolucionario", "disruptivo", "transformar la educación", "desbloquea",
  "el futuro del aprendizaje", "sin esfuerzo", "magia", "genio",
  "todo lo que te enseñaron está mal",
];

export function createValidator(schema) {
  const ajv = new Ajv({ allErrors: true, strict: false });
  addFormats(ajv);
  ajv.addSchema(schema, "content");
  return {
    /**
     * @param {"home"|"labs"|"notfound"|"course"} page
     * @param {object} data
     * @param {string} file  for error messages
     */
    validate(page, data, file) {
      const ref = DEF_BY_PAGE[page];
      if (!ref) throw new Error(`Unknown page type "${page}"`);
      const validateFn = ajv.getSchema("content" + ref);
      const errors = [];

      if (!validateFn(data)) {
        for (const e of validateFn.errors) {
          const path = e.instancePath || "(root)";
          errors.push(`${path} ${e.message}` + (e.params && e.params.limit != null ? ` (limit ${e.params.limit})` : ""));
        }
      }

      errors.push(...crossFieldChecks(page, data));

      if (errors.length) {
        const list = errors.map((m) => `  • ${m}`).join("\n");
        throw new Error(`Content validation failed for ${file}:\n${list}`);
      }
    },
  };
}

function crossFieldChecks(page, data) {
  const out = [];
  const flat = JSON.stringify(data).toLowerCase();

  for (const word of FORBIDDEN_VOCAB) {
    if (flat.includes(word.toLowerCase())) out.push(`forbidden vocabulary: "${word}"`);
  }
  // exclamation marks are banned everywhere on the site (LaTeX factorials aside,
  // which none of the content uses)
  if (/[!¡]/.test(deepText(data))) out.push("exclamation mark found in copy (banned site-wide)");

  if (page === "home") {
    out.push(...explorationChecks(data.exploration));

    // metrics / model params / code comment must agree on the key numbers
    const out3 = data.notebook.cells.output;
    const codeSrc = data.notebook.cells.code.source;
    for (const metric of out3.metrics) {
      const num = (metric.match(/-?\d+(\.\d+)?/) || [])[0];
      if (num && !codeSrc.includes(num)) {
        out.push(`notebook: metric "${metric}" — value ${num} does not appear in the code cell (three-places-one-truth)`);
      }
    }
  }

  if (page === "course") {
    const rows = data.modules.rows.length;
    const nums = (data.modules.summary.match(/\d+/g) || []).map(Number);
    if (!nums.includes(rows)) {
      out.push(`modules.summary "${data.modules.summary}" does not state the real module count (${rows})`);
    }
  }

  return out;
}

// The exploration section only teaches its point if the two representations are
// genuinely the same data and the interaction actually resolves the decision.
function explorationChecks(ex) {
  const out = [];
  if (!ex) return ["home.exploration is missing"];

  const ids = new Set(ex.figure.points.map((p) => p.id));
  for (const id of ex.figure.cluster || []) {
    if (!ids.has(id)) out.push(`exploration.figure.cluster references unknown point id "${id}"`);
  }

  if (ex.initial.view === ex.reframed.view) {
    out.push("exploration: initial.view and reframed.view are identical — there is no change of representation");
  }

  const d = ex.decision;
  if (d.kind === "choice" || d.kind === "comparison" || d.kind === "toggle") {
    if (!Array.isArray(d.options) || d.options.length < 2) {
      out.push(`exploration.decision.kind "${d.kind}" needs an options array`);
    } else {
      const optIds = new Set(d.options.map((o) => o.id));
      if (!d.options.some((o) => o.correct)) {
        out.push("exploration.decision: no option is marked correct — the check phase cannot resolve");
      }
      for (const [i, c] of ex.validation.checks.entries()) {
        if (c.passOption && !optIds.has(c.passOption)) {
          out.push(`exploration.validation.checks[${i}].passOption "${c.passOption}" is not a decision option id`);
        }
      }
    }
  }
  if (d.kind === "slider" && !d.slider) {
    out.push('exploration.decision.kind "slider" needs a slider object');
  }

  if (ex.demo === true) {
    console.warn(
      "  ⚠ home.exploration.demo is true — the section still renders placeholder pedagogy (shown with a 'demostración' tag). Replace with the editorial example and drop the flag."
    );
  }
  return out;
}

function deepText(v) {
  if (typeof v === "string") return v;
  if (Array.isArray(v)) return v.map(deepText).join(" ");
  if (v && typeof v === "object") return Object.values(v).map(deepText).join(" ");
  return "";
}
