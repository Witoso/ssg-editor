# ckeditor5-frontmatter — working notes

CKEditor 5 plugin that models YAML frontmatter as a block at the top of the
document and round-trips it through Markdown. Package name:
`@witoso/ckeditor5-frontmatter`.

## Commands (run from this package dir)

- Tests: `pnpm test` (Vitest, **real Chromium via Playwright**, `watch:false`).
  - Single file/test: `pnpm exec vitest run tests/frontmattertoolbar.ts -t "name"`.
  - Globals are on (`describe`/`it`/`expect`/`vi`); tests live in `tests/**/*.[jt]s`.
- Build: `pnpm run build` (types + npm + browser). **The app imports the built
  `dist/`**, so after adding/removing a `src/index.ts` export you must rebuild
  before `apps`/`src/components/editorConfig.ts` can resolve it. `dist/` is
  gitignored.
- Sample: `pnpm start` (Vite, serves `sample/`). Inspect via `window.editor`.
- Coverage: `pnpm exec vitest run --coverage` — thresholds are set to 100% in
  `vite.config.ts` but are **dormant**: CI never passes `--coverage`, and the
  baseline is already <100% (pre-existing untested helpers). Don't chase it.

CI (`.github/workflows/ci.yml`) runs root `pnpm test` (app) and
`pnpm --filter @witoso/ckeditor5-frontmatter exec vitest run` — neither uses
coverage.

## Architecture

- `Frontmatter` (umbrella) requires `Markdown`, `FrontmatterEditing`,
  `FrontmatterUI`. It **deliberately does not** pull in `FrontmatterToolbar` —
  collapse is opt-in (add `FrontmatterToolbar` to `plugins` explicitly).
- `FrontmatterEditing` (always): schema + conversion. The frontmatter is a
  **widget** — `frontmatterContainer` is `isObject` (`toWidget`), inner
  `frontmatter` is `toWidgetEditable`. A model post-fixer pins the container to
  root index 0. Custom view property `frontmatter` tags the widget.
- `FrontmatterToolbar` (opt-in): owns collapse — the `collapsed` attribute, its
  editing downcast, `ToggleFrontmatterCollapseCommand`, the toggle button
  (uses `IconLowVision`, the eye icon), and the `WidgetToolbarRepository` balloon.
  It `requires` `FrontmatterEditing` (it `schema.extend`s `frontmatterContainer`,
  which throws if that item is unregistered), so adding `FrontmatterToolbar`
  alone — without the umbrella — still auto-loads editing.
- `FrontmatterDataProcessor` wraps the Markdown processor; frontmatter ↔ `---`
  delimited YAML. Conversion: `frontmatterContainer` → `<section.frontmatter-container>`,
  `frontmatter` → `<div.frontmatter>` (data) / `<frontmatter>` (markdown).

## Collapse model (editing-only, never in data)

- `collapsed` is a model attribute downcast **only to the editing view**, never
  serialized. Semantics: absent or `true` ⇒ collapsed; only `false` ⇒ expanded.
  So "collapsed by default" needs **zero model writes on load**.
- The `insert:frontmatterContainer` downcast adds `.frontmatter-collapsed`
  **only when `getAttribute('collapsed') !== false`** — otherwise a post-fixer
  relocation (which re-inserts the widget) would re-collapse an expanded one.
- Toggling flips a CSS class via the `attribute:collapsed` converter (no element
  rebuild → no focus loss).

## Gotchas (these cost real time)

- **`isObject` vs `isSelectable`**: the container must be selectable as a unit so
  clicking a collapsed (content-hidden) widget summons the toolbar. We use
  `isObject`: real keyboard Backspace then does the safe two-step (select, then
  delete). Trade-off: `isObject` ⇒ `isContent`, so an **empty frontmatter
  serializes to `---\n\n---`** (not `""`). `isSelectable`-only would keep empty
  → `""` but makes Backspace one-shot delete (no select-first) — rejected.
- **`execute("delete")` ≠ real Backspace.** The Widget plugin's safe two-step
  delete listens to the view `delete` event; the command path one-shot deletes.
  To test real Backspace, `view.document.fire("delete", { direction: "backward",
... })`, not `editor.execute("delete")`.
- **Post-fixer pins to index 0** for _any_ preceding insert (paste, widget
  type-around "before"), not just on frontmatter insert. `WidgetTypeAround`
  injects before/after buttons with no per-position API; the "before" button is
  hidden via CSS and the post-fixer relocates anything that lands before.
- **`getRelatedElement` runs on every selection change**, including before focus
  when `selection.getFirstPosition()` is `null` — guard it or it throws inside
  `WidgetToolbarRepository`.
- **`WidgetToolbarRepository.register` throws on duplicate id only with
  non-empty `items`** (empty items hits an early `logWarning` return first).
- **Focus styling**: CKEditor flips a focused nested editable to white bg + inner
  box-shadow + focus-ring border (1px jump). `theme/frontmatter.css` overrides
  these for `.frontmatter` to stay gray. Keep the **standard widget outline** on
  the container (do not recolor it).
- `editor.commands.get("toggleFrontmatterCollapse")` is typed via
  `augmentation.ts`; before that exists it's the base `Command` (value `unknown`)
  — cast when needed.

## Environment quirk

The Bash tool's cwd resets between calls — always `cd <package>` in the same
command, or you'll run the root Vitest config (app projects) by mistake.
