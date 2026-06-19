// Browser-test setup. The app loads Shoelace's light theme in Page.astro, which
// defines the `--sl-*` design tokens. Without it, rules like
// `.tree-item__label { font-size: var(--sl-font-size-medium) }` resolve to an
// undefined token and compute font-size to 0 — so Shoelace components render at
// zero size and Playwright reports their labels as "not visible". Loading the
// theme here makes the test environment match the real app.
import "@shoelace-style/shoelace/dist/themes/light.css";
