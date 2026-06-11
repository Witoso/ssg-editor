# SSG Editor — Technical Improvement Spec

Scope: technical/architecture cleanup and UI polish only. **No new features.** Each item lists the problem, the affected files, and the proposed change with acceptance criteria. Items are grouped by theme and ordered by priority within each group. A suggested execution order is at the end.

Context: the working tree contains an uncommitted, finished-looking image-upload change set (config loading, `/upload` endpoint, image serving). Commit that work first so the improvements below land on a clean baseline.

---

## 1. Correctness bugs

### 1.1 `PendingActions` listener leaks on every autosave

**Problem:** In `src/components/Editor.tsx:68-87`, `saveData()` attaches a new `pendingActions.on("change:hasAny", …)` listener _every time autosave fires_. After N saves there are N listeners. The subscription belongs in `onReady`, once per editor instance.

**Change:** Move the `PendingActions` subscription into the `onReady` callback (or a dedicated effect). `saveData` should only serialize content and POST.

**Acceptance:** A single listener is registered per editor lifetime; saving indicator still toggles correctly during autosave.

### 1.2 Failed saves are silent — data-loss risk

**Problem:** `saveData` returns the `fetch` promise but nobody checks `response.ok` or network failure. If `/save` returns 4xx/5xx or the server is stopped, the user keeps typing and sees the idle checkmark as if everything were persisted.

**Change:** Check the response in `saveData` and reject on failure (CKEditor's `Autosave` keeps the document in `pending` state when the save promise rejects). Extend the saving store from a boolean to a status (`"idle" | "saving" | "error"`) and render an error state in `SavingStatus` (see 4.2).

**Acceptance:** Killing the server while typing produces a visible error indicator; a successful retry clears it.

### 1.3 `Alert` shows "File created successfully." for unknown errors

**Problem:** `src/components/Alert.tsx:24-35` — the `switch (error)` `default` branch returns the success message, so an unrecognized error code renders as success (in danger styling). The component also conflates error and success message selection.

**Change:** Branch on `success` vs `error` explicitly; unknown error codes fall back to a generic error message.

**Acceptance:** Unit/browser test covering each flash code plus an unknown code.

### 1.4 Conflicting client directives on `<Alert>`

**Problem:** `src/layouts/Page.astro:31` has both `client:load` and `client:only="react"` on the same island. Only one hydration directive is valid.

**Change:** Keep `client:only="react"` (Shoelace components are client-only anyway); drop `client:load`.

**Acceptance:** `astro check`/build emits no warning; toasts still appear after create-file redirects.

### 1.5 Saving store may not be shared between the React island and the inline script

**Problem:** `isSaving` (`src/components/savingStore.tsx`) is imported both by the React `Editor` island and by the inline `<script>` in `SavingStatus.astro`. Astro builds islands and page scripts as separate entry points; the singleton atom can be duplicated in production bundles, silently breaking the saving indicator.

**Change:** Make `SavingStatus` a small React island (`client:only="react"`) using `@nanostores/react` (already a dependency), so both consumers share one module graph. Verify against a production build (`pnpm build` + run `dist/server/entry.mjs`), not just dev.

**Acceptance:** In a production build, the header indicator animates during autosave.

### 1.6 README/server port mismatch

**Problem:** README promises `http://localhost:8989`; `astro.config.mjs` hardcodes port `4321`. One of them is wrong.

**Change:** Pick one port, make it overridable via env/CLI flag passed through `bin/ssge.js` (`PORT` is respected by the standalone node adapter), and fix the README.

**Acceptance:** `ssge <dir>` prints the URL it actually serves on; README matches.

---

## 2. Security hardening (local tool, but it writes to disk)

### 2.1 Server listens on all interfaces

**Problem:** `astro.config.mjs` sets `server.host: true`. A tool that accepts arbitrary markdown writes and file uploads is exposed to the whole LAN by default.

**Change:** Default to `localhost`. If remote access is ever needed, make it an explicit opt-in flag on `ssge`.

**Acceptance:** `lsof`/`netstat` shows the production server bound to `127.0.0.1` only.

### 2.2 Client round-trips absolute server filesystem paths

**Problem:** `[...slug].astro` passes the **absolute** resolved path into the `Editor` island (`filePath={fullPath}`), which the browser POSTs back to `/save`. It survives `resolveMarkdownFilePath` only by accident of `path.resolve` semantics, and it leaks the server's directory layout into the page payload.

**Change:** Pass the _relative_ slug path to the client; `/save` resolves it against `TARGET_PATH` exactly like the page route does. Update `save.test.ts` accordingly.

**Acceptance:** View-source of an editor page contains no absolute paths; saving still works for nested files; traversal attempts (`../x.md`, absolute paths) still rejected.

### 2.3 `getFiles` follows symlinks out of the target directory

**Problem:** `src/lib/files.ts` uses `fs.statSync`, which follows symlinks. A symlink inside the edited folder pointing outside it gets listed (and its `.md` targets become editable through the other routes).

**Change:** Use `lstat` (skip symlinks) or verify `realpath` stays under the target root before recursing.

**Acceptance:** Test: a symlink to a directory outside the root is not listed and its files are not editable.

### 2.4 Upload validation trusts the filename extension

**Problem:** `getImageExtension` (`src/lib/images.ts:17-24`) falls back to the file _name_ extension when the MIME type is unrecognized, so any bytes named `x.png` are stored as an image.

**Change:** Validate magic bytes for the four allowed formats (a few-byte check, no new dependency needed), or at minimum drop the extension fallback and require an allowed `file.type`.

**Acceptance:** Uploading a text file renamed to `.png` returns 400; real images still upload.

---

## 3. Server architecture

### 3.1 Consolidate request-scoped context into Astro middleware

**Problem:** Every route independently calls `getTargetPath()` and `loadConfig()` (`[...slug].astro`, `save.ts`, `upload.ts`, `create.astro`). There is no single place where "the request context" is established.

**Change:** Add `src/middleware.ts` that resolves `targetPath` and the loaded config once and exposes them on `Astro.locals` (typed via `src/env.d.ts`). Routes read from `locals`.

**Acceptance:** No route imports `getTargetPath`/`loadConfig` directly; existing tests pass with handlers receiving context via `locals`.

### 3.2 Config module cache grows on every request

**Problem:** `loadConfig` (`src/lib/config.ts:31-48`) busts the ESM cache with an `mtime` query param on **every call**. Each request re-imports `.sserc.js` and the old module instances accumulate in the module cache for the life of the process; it also costs a `statSync` + dynamic import per request.

**Change:** Cache the normalized config keyed by `(configPath, mtimeMs)`; only re-import when mtime changes. (With 3.1 this runs once per request at most, and import only on change.)

**Acceptance:** Test: two `loadConfig` calls with unchanged mtime import the module once; touching the file reloads it.

### 3.3 Tidy the API surface — without changing the MPA architecture

**Decision (owner):** The page-switching-via-Astro-pages architecture stays. `/create` remains a server form POST → redirect → flash flow; Astro's `ClientRouter` already intercepts same-origin form submissions, so this flow gets view transitions for free. Do **not** convert it to a fetch/JSON endpoint.

**Problem:** Within that architecture there are still avoidable inconsistencies:

- `/save` (`src/pages/save.ts`) — JSON API, error shape `{ error: string }`, missing `Content-Type` header on responses.
- `/upload` (`src/pages/upload.ts`) — JSON API, error shape `{ error: { message } }` (CKEditor's required shape), local `uploadError` helper.
- `/create` (`src/pages/create.astro`) — renders no page of its own (empty body after the frontmatter); flash cookies are set without explicit `path`/`sameSite`/`httpOnly` options; validation logic lives inline.

**Change:**

- Move the two programmatic endpoints (autosave, image upload — these are not page navigations) under `src/pages/api/` (`/api/save`, `/api/upload`). Add shared `jsonResponse(data, status)` / `errorResponse(message, status)` helpers in `src/lib/responses.ts` (it already exists for images); keep an adapter for CKEditor's upload error shape at the `/api/upload` boundary only.
- Keep `/create` as a form-POST page route. Extract the flash-cookie set/read into a small `src/lib/flash.ts` helper that sets explicit cookie options (`path: "/"`, `sameSite: "lax"`, `httpOnly`) and reads-and-clears in one call, replacing the hand-rolled blocks in `create.astro` and `Page.astro:11-18`.
- Share the filename/folder validation between client and server: extract the `[a-zA-Z0-9_-]+` rule and `getFolderSegments` into `src/lib` and import from both `CreateDialog` (input `pattern`) and `create.astro`.

**Acceptance:** JSON endpoints live under `/api/*` with a consistent envelope and `Content-Type: application/json`; `/create` still works as form POST + redirect with view transitions intact (no full browser reload when `ClientRouter` is active); flash handling goes through one helper; validation rule defined once.

### 3.4 Async I/O in the page route

**Problem:** `[...slug].astro` uses `fs.readFileSync`; `src/lib/files.ts` walks the tree with `readdirSync`/`statSync` recursively; `src/lib/responses.ts` reads images with `readFileSync`. Each request blocks the event loop proportionally to folder size.

**Change:** Convert `getFiles`, the page read, and `imageResponse` to `fs/promises` (Astro frontmatter is already async). Sort directory entries (folders first, then files, alphabetical) while you're in there — current ordering is filesystem-dependent.

**Acceptance:** No `fs.*Sync` calls remain under `src/`; `files.test.ts` updated and covering the ordering.

### 3.5 Image serving doesn't belong in the page catch-all

**Problem:** `[...slug].astro` starts by checking whether the request is actually an uploaded image and short-circuits to a binary response. A page route doing static file serving is hard to follow and easy to break.

**Change:** Serve uploads from a dedicated endpoint. Simplest faithful option: `src/pages/api/… ` is wrong for public URLs, so use a rest route matching the configured `publicPath` via middleware: in `src/middleware.ts`, if the request path resolves through `resolvePublicImagePath`, return the image response there and never reach the page route. Add `Content-Length` and basic `Cache-Control` headers.

**Acceptance:** `[...slug].astro` contains only markdown-page logic; image URLs still render in the editor; non-existent image URLs 404.

### 3.6 Remove the `demo/` fallback and dead env plumbing

**Problem:** `getTargetPath()` (`src/lib/paths.ts:3-5`) silently falls back to `<cwd>/demo` when `TARGET_PATH` is unset — a dev convenience baked into shipped code that can write files in an unexpected location. `.env` defines `SSG_E_ROOT_FOLDER`, which nothing reads. `test-cli.js` at the repo root duplicates `bin/ssge.js` and is dead.

**Change:** Fail fast with a clear message when `TARGET_PATH` is missing (the dev script and `bin/ssge.js` always set it). Delete `test-cli.js`, the stale `.env` keys, and the untracked `demo/` scratch files. Fix `.gitignore` spelling `.DS_STORE` → `.DS_Store`.

**Acceptance:** Starting the built server without `TARGET_PATH` exits non-zero with a helpful error; repo contains no dead launcher scripts.

---

## 4. Client architecture & UI

### 4.1 Extract the CKEditor configuration from the component

**Problem:** `Editor.tsx` is ~240 lines, most of it a static config literal (plugin list, toolbars, image/table/link config). The component logic (refs, save, focus) is buried. There are also concrete defects: `Essentials` is listed twice in `plugins`, `editor={DecoupledEditor as any}`, and `editor.setDataWithFrontmatter(content!)` (non-null assertion on an optional prop).

**Change:** Move the static config to `src/components/editorConfig.ts` exporting a typed `EditorConfig`; build the per-instance parts (autosave handler, readOnly plugin filtering) in the component. Remove the duplicate plugin, the `any` cast (CKEditor React types accept `DecoupledEditor` directly in current versions), and default `content` to `""` instead of asserting.

**Acceptance:** `Editor.tsx` under ~100 lines; `astro check` passes with no `any` casts in the component; editor behaves identically.

### 4.2 Saving indicator: add error state and accessibility

**Problem:** `SavingStatus.astro` is icon-only (checkmark/spinner), with no error representation (see 1.2) and no text for screen readers; the spinner divs have duplicated inline + class animation delays.

**Change:** As part of 1.5's React conversion: render status text alongside the icon ("Saved", "Saving…", "Save failed — retrying") with `aria-live="polite"`, and a distinct error visual. Drop the redundant inline `animation-delay` styles.

**Acceptance:** Status changes are announced to screen readers; error state visible when `/api/save` fails.

### 4.3 FileTree keyboard support and semantics

**Problem:** `FileTree.tsx` navigates via `onClick` on `SlTreeItem`, so keyboard selection (arrow keys + Enter — which Shoelace's tree supports natively) does nothing. "Create a file" is modeled as a fake tree item, and clicking a folder label both toggles and hits the click handler.

**Change:** Listen to the tree's `sl-selection-change` event and navigate from the selected item's data (store the path in a `data-path` attribute), instead of per-item `onClick`. Keep "create" entries but give them a distinct visual treatment and include them in the selection handling; alternatively render a small "+" button on folder rows. Resolve the `//TODO show also empty folders` comment either by implementing it in `getFiles` (drop the `children.length > 0` filter — they're already creatable targets) or by removing the TODO deliberately.

**Acceptance:** Files can be opened with keyboard only; create dialog reachable by keyboard; browser tests updated (screenshots will change).

### 4.4 CreateDialog cleanups

**Problem:** `CreateDialog.tsx` passes the folder path via an `SlInput` hidden with `style={{display:"none"}}`; `autoFocus` on a web component generally doesn't focus the inner input; the input value isn't reset after the dialog closes.

**Change:** Use a native `<input type="hidden">`; focus the input in `onSlAfterShow`; clear state on hide. Error feedback stays as the existing flash-toast flow (see 3.3) — only fix the `Alert` default-case bug from 1.3.

**Acceptance:** Opening the dialog focuses the filename field; reopening shows an empty field; folder path still submitted.

### 4.5 Page chrome and document metadata

**Problem:** `Layout.astro` ships boilerplate: `meta name="description" content="Astro description"`, fixed `<title>SSG Editor</title>` regardless of the open file, `viewport` missing `initial-scale=1`.

**Change:** Title becomes `"<filename> — SSG Editor"` when a file is open (pass through `Page.astro` props); remove or replace the placeholder description; fix the viewport tag.

**Acceptance:** Browser tab shows the open file name; no placeholder metadata remains.

### 4.6 Mobile sidebar overlay behavior

**Problem:** On ≤640px the expanded sidebar overlays the editor (`Page.astro` media query) but there is no backdrop, no close-on-outside-click, no `Escape` handling, and opening a file leaves the overlay covering the editor until manually collapsed.

**Change:** Add a backdrop element that closes the sidebar on click; close on `Escape`; auto-collapse after navigation on small screens (the inline script can listen to `astro:page-load`).

**Acceptance:** On a narrow viewport: tapping a file opens it with the sidebar collapsed; tapping outside the open sidebar closes it.

### 4.7 Read-only empty state

**Problem:** With no file selected, the app renders a fully disabled CKEditor with its complete toolbar and the placeholder markdown `*Select or create a file to edit.*` — a heavyweight and slightly confusing empty state.

**Change:** When no file is selected, render a simple static panel ("Select or create a file from the sidebar") instead of mounting CKEditor at all. This also removes the `readOnly` plugin-filtering path from `Editor`.

**Acceptance:** Landing page makes no CKEditor network/bundle work beyond what the layout needs; opening a file mounts the editor as today.

### 4.8 Remove dead frontend dependencies and assets

**Problem (verified):** `lucide-react`, `class-variance-authority`, `clsx`, `tailwind-merge`, and `src/lib/utils.ts` (`cn()`) are referenced nowhere in `src/`. `public/fonts/Lato-*.ttf` are unused — Lato is loaded via `@fontsource/lato`. Three icon systems are installed for one in use (`pixelarticons`; Shoelace icons render the pixelarticon SVGs).

**Change:** Delete `src/lib/utils.ts`, remove the four unused packages, delete `public/fonts/` (keep `OFL.txt` only if any font file stays). Also remove committed `.DS_Store` files.

**Acceptance:** Build and tests pass; `pnpm ls` shows none of the removed packages; bundle/`public` contain no unused fonts.

---

## 5. Tooling, types, and CI

### 5.1 ESLint: replace the dead legacy config with flat config + Astro integration

**Problem:** `.eslintrc.cjs` (legacy `eslintrc` format) references `@typescript-eslint`, but neither `eslint` nor any plugin is in `devDependencies`, and there is no `lint` script — the config is dead. It also has no Astro support, so `.astro` files were never lintable.

**Change:** Delete `.eslintrc.cjs` and set up ESLint in its current form — flat config (`eslint.config.js`) — with the official Astro integration:

- Dev dependencies: `eslint`, `eslint-plugin-astro` (bundles `astro-eslint-parser`), `typescript-eslint`, `@typescript-eslint/parser` (used by the Astro plugin to parse TS inside `.astro` frontmatter), `eslint-plugin-react-hooks` for the React islands, and optionally `eslint-plugin-jsx-a11y` to enable the plugin's `jsx-a11y-recommended` preset for `.astro` templates (supports 4.2/4.3's accessibility work).
- Config shape (reference: <https://github.com/ota-meshi/eslint-plugin-astro>):

  ```js
  // eslint.config.js
  import eslintPluginAstro from "eslint-plugin-astro";
  import tseslint from "typescript-eslint";
  import reactHooks from "eslint-plugin-react-hooks";

  export default [
    ...tseslint.configs.recommended,
    ...eslintPluginAstro.configs.recommended, // or configs["jsx-a11y-recommended"]
    {
      files: ["src/**/*.{ts,tsx}"],
      plugins: { "react-hooks": reactHooks },
      rules: reactHooks.configs.recommended.rules,
    },
    { ignores: ["dist/", ".astro/", "node_modules/"] },
  ];
  ```

- Script: `"lint": "eslint ."` — flat config picks up `.astro` files via the plugin's bundled `files` globs; no extra `--ext` flags needed.
- Fix what the linter finds (expect hits on the `any` casts from 5.4, unused vars, etc.).

**Acceptance:** `pnpm lint` runs clean over `.ts`, `.tsx`, and `.astro` files; legacy `.eslintrc.cjs` deleted; intentionally introducing a hook-deps mistake in `Editor.tsx` or a parse error in an `.astro` file makes lint fail.

### 5.1b Prettier: installed but not wired up for Astro

**Problem (verified):** `prettier` and `prettier-plugin-astro` are in `devDependencies`, but there is **no Prettier config file** in the repo — third-party plugins are not auto-loaded, so the Astro plugin never runs and `.astro` files are not formatted. There is also no `format` script.

**Change:** Per the Astro docs (<https://docs.astro.build/en/editor-setup/#prettier>), add a `.prettierrc` that registers the plugin and pins the parser for `.astro` files:

```json
{
  "plugins": ["prettier-plugin-astro"],
  "overrides": [{ "files": "*.astro", "options": { "parser": "astro" } }]
}
```

Add scripts `"format": "prettier --write ."` and `"format:check": "prettier --check ."`, plus a `.prettierignore` (`dist/`, `.astro/`, `pnpm-lock.yaml`, `__screenshots__/`). Run the initial `format` as its own commit so reviews of later changes stay readable. ESLint and Prettier stay non-overlapping (no `eslint-config-prettier` needed unless stylistic ESLint rules get enabled later; `eslint-plugin-astro`'s recommended set is correctness-only).

**Acceptance:** `pnpm format:check` passes; editing an `.astro` file with bad formatting fails the check; CI (5.2) runs `format:check` alongside `lint`.

### 5.2 CI pipeline

**Problem:** No `.github/workflows` — tests, type-check, and build only run when someone remembers.

**Change:** Add a GitHub Actions workflow: pnpm install (with cache) → `lint` → `format:check` → `astro check` → `vitest run` (node project) → browser tests with Playwright (install chromium) → `astro build`. Run on push/PR to `main`.

**Acceptance:** Workflow green on `main`; failing test or type error blocks PRs.

### 5.3 Dependency classification

**Problem:** Runtime-used packages (`@shoelace-style/shoelace`, `@fontsource/lato`, tailwind packages) sit in `devDependencies` while the published artifact is the prebuilt `dist/` — it works, but `dependencies` still carries build-time-only weight for global installs (`@astrojs/react`, `react`, `react-dom`, `ckeditor5` are all bundled into `dist`).

**Change:** Audit what `dist/server/entry.mjs` actually `require`s at runtime; move everything bundled at build time to `devDependencies` so `npm i -g @witoso/ssg-editor` installs only what the server needs. Verify with a packed tarball install (`pnpm pack` → `npm i -g ./…tgz` → `ssge`).

**Acceptance:** Global install footprint shrinks; `ssge` runs from a clean tarball install.

### 5.4 Loosen remaining type escapes

**Problem:** `useRef<any>` in `Alert.tsx` (type is `SlAlert`), `as DecoupledEditor` casts in `Editor.tsx`, `Astro.locals` untyped (after 3.1).

**Change:** Type the refs and locals; enable `"types"` additions in `src/env.d.ts` for `App.Locals`.

**Acceptance:** `grep -rn ": any\|as any" src/` returns nothing; `astro check` clean.

---

## 6. Suggested execution order

1. **Baseline:** commit the in-flight upload feature; 5.1 ESLint flat config + 5.1b Prettier wiring; 5.2 CI (so every later step is gated).
2. **Correctness:** 1.1, 1.2, 1.3, 1.4, 1.6 — small, independent, high value.
3. **Security:** 2.1, 2.2, 2.3, 2.4.
4. **Server refactor:** 3.1 middleware → 3.2 config cache → 3.3 API tidy-up → 3.4 async I/O → 3.5 image route → 3.6 dead-code removal.
5. **Client/UI:** 4.1, then 1.5 + 4.2 together, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8.
6. **Finish:** 5.3, 5.4.

Each step should land with tests (the project already has good `vitest` node + browser coverage to extend) and keep `pnpm build && pnpm test` green.
