# Frontmatter Plugin Monorepo Import Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move `@witoso/ckeditor5-frontmatter` from `~/workspace/ckeditor5-frontmatter` into this repo as a pnpm workspace package at `packages/ckeditor5-frontmatter/`, keep publishing it separately to npm, and archive the old GitHub repo.

**Architecture:** Fresh import (no history graft) of the plugin's working tree — including its ~630 lines of uncommitted work — as one commit. The app stays at the repo root; `pnpm-workspace.yaml` gains a `packages` list; the app depends on the plugin via `workspace:^`. Root-level lint/format/typecheck tooling is scoped to ignore `packages/` because the plugin carries its own self-contained tooling.

**Tech Stack:** pnpm 11 workspaces, Astro (app), CKEditor 5 / Vite / Vitest+WebdriverIO (plugin), GitHub Actions, `gh` CLI.

**Spec:** `docs/superpowers/specs/2026-06-12-frontmatter-monorepo-design.md`

**Key facts the executor must know:**

- The GitHub remote of this repo is `git@github.com:Witoso/ssg-wysiwig.git` — the repo is named **`ssg-wysiwig`**, not `ssg-editor`. All GitHub URLs below use `Witoso/ssg-wysiwig`.
- The old plugin repo at `/Users/witold/workspace/ckeditor5-frontmatter` has **uncommitted changes in 10 files** (collapsible frontmatter feature, defaults config, tests). These migrate via the file copy in Task 1 and are stashed (not discarded) in the old repo in Task 9. Do NOT commit them in the old repo, do NOT discard them before Task 9.
- This is a migration, not feature development — TDD does not apply. Verification is running the existing test/build suites of both packages.
- Commit messages: NO `Co-Authored-By` trailer (user preference).

---

### Task 1: Copy the plugin into `packages/ckeditor5-frontmatter/`

**Files:**

- Create: `packages/ckeditor5-frontmatter/**` (copied from `/Users/witold/workspace/ckeditor5-frontmatter/`)

- [ ] **Step 1: Copy the working tree with exclusions**

```bash
cd /Users/witold/workspace/ssg-editor
mkdir -p packages
rsync -a \
  --exclude='.git' \
  --exclude='node_modules' \
  --exclude='dist' \
  --exclude='tmp' \
  --exclude='coverage' \
  --exclude='.husky' \
  --exclude='.claude' \
  --exclude='.DS_Store' \
  --exclude='pnpm-lock.yaml' \
  --exclude='pnpm-workspace.yaml' \
  --exclude='docs/superpowers' \
  /Users/witold/workspace/ckeditor5-frontmatter/ packages/ckeditor5-frontmatter/
```

Rationale for exclusions: `.git`/`node_modules`/`dist`/`tmp`/`coverage` are derived or repo-local; `pnpm-lock.yaml` and `pnpm-workspace.yaml` are superseded by the root workspace (single lockfile); `.husky` is dropped per spec (monorepo root owns conventions); `docs/superpowers` are the old repo's local AI working docs.

- [ ] **Step 2: Verify the copy**

```bash
ls packages/ckeditor5-frontmatter
```

Expected: `CHANGELOG.md  LICENSE.md  README.md  ckeditor5-metadata.json  docs  eslint.config.js  lang  package.json  sample  scripts  src  tests  theme  tsconfig.build.json  tsconfig.json  typings  vite.config.ts` plus dotfiles (`.editorconfig`, `.gitattributes`, `.gitignore`, `.stylelintrc`). Confirm dotfiles:

```bash
ls -A packages/ckeditor5-frontmatter | grep '^\.'
```

Expected: `.editorconfig  .gitattributes  .gitignore  .stylelintrc` (no `.git`, no `.husky`).

No commit yet — the import is committed as one piece in Task 7.

---

### Task 2: Adapt the plugin's `package.json`

**Files:**

- Modify: `packages/ckeditor5-frontmatter/package.json`

- [ ] **Step 1: Point `repository` at the monorepo**

Replace:

```json
  "repository": {
    "type": "git",
    "url": "git+https://github.com/Witoso/ckeditor5-frontmatter/"
  },
```

with:

```json
  "repository": {
    "type": "git",
    "url": "git+https://github.com/Witoso/ssg-wysiwig.git",
    "directory": "packages/ckeditor5-frontmatter"
  },
```

- [ ] **Step 2: Remove husky and lint-staged**

Delete these two lines from `devDependencies`:

```json
    "husky": "^4.2.5",
    "lint-staged": "^10.2.6",
```

Delete the two top-level config blocks at the end of the file:

```json
  "lint-staged": {
    "**/*": [
      "eslint"
    ],
    "**/*.css": [
      "stylelint --quiet --allow-empty-input"
    ]
  },
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged"
    }
  }
```

(Watch the trailing comma on the preceding `scripts` block when removing the last members.)

- [ ] **Step 3: Validate JSON**

```bash
node -e "JSON.parse(require('fs').readFileSync('packages/ckeditor5-frontmatter/package.json','utf8')); console.log('ok')"
```

Expected: `ok`

---

### Task 3: Wire up the workspace at the root

**Files:**

- Modify: `pnpm-workspace.yaml`
- Modify: `package.json` (root)
- Modify: `eslint.config.js` (root)
- Modify: `.prettierignore`
- Modify: `tsconfig.json` (root)

- [ ] **Step 1: Declare the packages dir in `pnpm-workspace.yaml`**

New full content (existing settings preserved):

```yaml
packages:
  - "packages/*"

allowBuilds:
  esbuild: true
  protobufjs: true
  sharp: true

peerDependencyRules:
  allowedVersions:
    tailwindcss: "4"
```

- [ ] **Step 2: Use the workspace plugin in the root `package.json`**

In `devDependencies`, replace:

```json
    "@witoso/ckeditor5-frontmatter": "^1.0.0",
```

with:

```json
    "@witoso/ckeditor5-frontmatter": "workspace:^",
```

- [ ] **Step 3: Build the plugin before the app in `prepare`**

The root `prepare` script runs `pnpm run build` on every `pnpm install`, and the app build imports the plugin's `dist/` — which no longer exists after a fresh clone (we excluded it from the copy). In root `package.json` `scripts`, replace:

```json
    "prepare": "pnpm run build",
```

with:

```json
    "prepare": "pnpm --filter @witoso/ckeditor5-frontmatter build && pnpm run build",
```

- [ ] **Step 4: Scope root tooling away from `packages/`**

The plugin ships its own eslint (ckeditor5 config, tabs), stylelint, and tsconfig; root tools must not double-lint it.

`eslint.config.js` — add `"packages/"` to the ignores line:

```js
  { ignores: ["dist/", ".astro/", "node_modules/", "demo/", "packages/"] },
```

`.prettierignore` — append:

```
packages/
```

`tsconfig.json` (root) — add an `exclude` so `astro check` doesn't typecheck the plugin with the app's strict/JSX settings (the astro base config's own exclude is replaced by this, so re-list `dist`):

```json
{
  "extends": "astro/tsconfigs/strict",
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "react",
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "exclude": ["dist", "node_modules", "packages"]
}
```

(Root `vitest.config.ts` needs no change — its projects only include `src/**`.)

---

### Task 4: Install and verify the workspace link

- [ ] **Step 1: Install**

```bash
cd /Users/witold/workspace/ssg-editor
pnpm install
```

Expected: succeeds; lockfile is rewritten with two importers (`.` and `packages/ckeditor5-frontmatter`). Because of the new `prepare` script this also builds the plugin and then the app — slow but proves the chain works. If `prepare` fails here, debug before continuing (likely a plugin build issue).

- [ ] **Step 2: Verify the symlink**

```bash
ls -l node_modules/@witoso/
```

Expected: `ckeditor5-frontmatter -> ../../packages/ckeditor5-frontmatter`

```bash
ls packages/ckeditor5-frontmatter/dist/index.js
```

Expected: file exists (built by `prepare`).

---

### Task 5: Verify the plugin package standalone

- [ ] **Step 1: Lint**

```bash
pnpm --filter @witoso/ckeditor5-frontmatter lint
pnpm --filter @witoso/ckeditor5-frontmatter stylelint
```

Expected: both exit 0.

- [ ] **Step 2: Tests (run mode, not watch)**

```bash
pnpm --filter @witoso/ckeditor5-frontmatter exec vitest run
```

Expected: PASS (browser tests run via WebdriverIO headless Chrome). Note: the plugin's `test` script is bare `vitest` (watch mode locally) — always use `vitest run` for verification.

- [ ] **Step 3: Build**

```bash
pnpm --filter @witoso/ckeditor5-frontmatter build
```

Expected: exits 0; `dist/` contains `index.js`, type declarations, browser build, translations.

---

### Task 6: Verify the app against the local plugin

- [ ] **Step 1: Root lint, format, tests**

```bash
pnpm lint
pnpm format:check
pnpm test
```

Expected: all exit 0. If `format:check` flags files inside `packages/`, the `.prettierignore` entry from Task 3 is wrong — fix there, don't reformat the plugin.

- [ ] **Step 2: Root build**

```bash
pnpm build
```

Expected: `astro check` passes (0 errors; it must NOT report files under `packages/`) and `astro build` completes.

---

### Task 7: Commit the import

- [ ] **Step 1: Review what's being committed**

```bash
git status --short
git diff --stat
```

Expected: untracked `packages/ckeditor5-frontmatter/**`; modified `pnpm-workspace.yaml`, `package.json`, `pnpm-lock.yaml`, `eslint.config.js`, `.prettierignore`, `tsconfig.json`. Nothing else.

- [ ] **Step 2: Commit (single import commit, per spec)**

```bash
git add -A
git commit -m "feat: import @witoso/ckeditor5-frontmatter as a workspace package

Moved from github.com/Witoso/ckeditor5-frontmatter (now archived) at its
working-tree state, including the unreleased collapsible/defaults work.
The package keeps its own tooling and is still published separately;
root lint/format/typecheck are scoped to exclude packages/."
```

---

### Task 8: Update CI and commit

**Files:**

- Modify: `.github/workflows/ci.yml`

- [ ] **Step 1: Bump Node and add plugin steps**

New full content of `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: pnpm

      - run: pnpm install --frozen-lockfile

      - run: pnpm lint

      - run: pnpm format:check

      - name: Install Playwright browsers
        run: pnpm exec playwright install chromium --with-deps

      - name: Test (node + browser)
        run: pnpm test

      - name: Type-check and build
        run: pnpm build

      - name: Plugin lint
        run: pnpm --filter @witoso/ckeditor5-frontmatter lint

      - name: Plugin tests
        run: pnpm --filter @witoso/ckeditor5-frontmatter exec vitest run

      - name: Plugin build
        run: pnpm --filter @witoso/ckeditor5-frontmatter build
```

Node goes 22 → 24 because the plugin's `engines` require `>=24.11.0` (the app requires `>=18`, satisfied). Per spec: if the "Plugin tests" step proves flaky on GitHub runners (WebdriverIO/Chrome), remove that step, keep lint + build, and add a comment in the workflow noting tests run locally.

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: run plugin lint/test/build, bump Node to 24"
```

- [ ] **Step 3: Push and watch CI**

```bash
git push
gh run watch --exit-status $(gh run list --branch main --limit 1 --json databaseId --jq '.[0].databaseId')
```

Expected: CI green. (Pushing now is also required before Task 9 — the archive notice links to `packages/ckeditor5-frontmatter` on GitHub, which must exist.) If only the "Plugin tests" step fails with browser/driver errors, apply the documented fallback and re-push.

---

### Task 9: Publish dry-run

- [ ] **Step 1: Dry-run from the package dir**

```bash
cd /Users/witold/workspace/ssg-editor/packages/ckeditor5-frontmatter
pnpm publish --dry-run
cd /Users/witold/workspace/ssg-editor
```

Expected: `prepublishOnly` rebuilds, then the tarball listing shows `dist/**`, `ckeditor5-metadata.json`, `package.json`, `README.md`, `LICENSE.md`, `CHANGELOG.md` — and nothing else (no `src/`, `sample/`, `tests/`). No `workspace:` strings appear in the printed manifest. Do NOT actually publish — the next release happens whenever the in-flight feature work is done.

---

### Task 10: Archive the old repo

Only run this task after Task 8's push succeeded (the README link must resolve, and the migrated work must be safely committed here).

- [ ] **Step 1: Stash the old repo's working tree (recoverable, not discarded)**

```bash
cd /Users/witold/workspace/ckeditor5-frontmatter
git stash push -m "work migrated to ssg-wysiwig monorepo (packages/ckeditor5-frontmatter)"
git status --short
```

Expected: stash created; status clean. The working tree now matches the last commit (`ea8d972`), so the archive notice lands on a clean README without smuggling in the unreleased feature docs.

- [ ] **Step 2: Prepend the archive notice to README.md**

Insert at the very top of `/Users/witold/workspace/ckeditor5-frontmatter/README.md`, above the title:

```markdown
> [!IMPORTANT]
> **This repository is archived.** Development moved to the
> [ssg-wysiwig](https://github.com/Witoso/ssg-wysiwig) monorepo, under
> [`packages/ckeditor5-frontmatter`](https://github.com/Witoso/ssg-wysiwig/tree/main/packages/ckeditor5-frontmatter).
> The npm package [`@witoso/ckeditor5-frontmatter`](https://www.npmjs.com/package/@witoso/ckeditor5-frontmatter)
> continues to be published from there.
```

(Keep the blank line after the blockquote.)

- [ ] **Step 3: Commit and push the notice**

```bash
cd /Users/witold/workspace/ckeditor5-frontmatter
git add README.md
git commit -m "docs: archive notice — development moved to the ssg-wysiwig monorepo"
git push
```

Expected: only README.md in the commit.

- [ ] **Step 4: Archive on GitHub**

```bash
gh repo archive Witoso/ckeditor5-frontmatter --yes
```

Expected: `✓ Archived repository Witoso/ckeditor5-frontmatter`.

- [ ] **Step 5: Confirm**

```bash
gh repo view Witoso/ckeditor5-frontmatter --json isArchived --jq .isArchived
```

Expected: `true`

---

## Done criteria (from spec)

- [ ] `pnpm install` at root links `@witoso/ckeditor5-frontmatter` from `packages/`
- [ ] Plugin lint/test/build pass via `--filter`
- [ ] Root lint/format/test/build pass, untouched by plugin tooling
- [ ] `pnpm publish --dry-run` shows a sane tarball with monorepo `repository.directory`
- [ ] CI green on Node 24 with plugin steps
- [ ] Old repo: clean README notice committed, repo archived, in-flight work stashed (recoverable) and committed here
