# Design: Move ckeditor5-frontmatter into the ssg-editor repo

Date: 2026-06-12
Status: approved

## Goal

Bring the `@witoso/ckeditor5-frontmatter` CKEditor 5 plugin (currently at
`~/workspace/ckeditor5-frontmatter`, GitHub `Witoso/ckeditor5-frontmatter`)
into this repo as a pnpm workspace package. The plugin keeps being published
separately to npm. The old GitHub repo is archived with a pointer in its
README.

## Decisions

- **Fresh import, no history graft.** The plugin's working tree is copied in
  as a single commit. Full pre-import history stays browsable in the archived
  GitHub repo.
- **App stays at root.** ssg-editor keeps its current root layout; the plugin
  lands in `packages/ckeditor5-frontmatter/`. No changes to the app's build,
  `bin`, or publish setup.
- **Uncommitted plugin work comes along.** The plugin repo has ~630 lines of
  uncommitted work (collapsible frontmatter, defaults config, tests). It is
  imported as part of the initial monorepo commit and is NOT committed to the
  old repo. The monorepo becomes the source of truth.

## Target layout

```
ssg-editor/
├── package.json            @witoso/ssg-editor (app, workspace root)
├── pnpm-workspace.yaml     packages: ["packages/*"] + existing settings
├── pnpm-lock.yaml          single lockfile for the workspace
├── src/ bin/ scripts/ …    app unchanged
└── packages/
    └── ckeditor5-frontmatter/
        ├── package.json    @witoso/ckeditor5-frontmatter
        ├── src/ tests/ theme/ sample/ lang/ scripts/ typings/
        ├── vite.config.ts, tsconfig*.json, eslint.config.js
        └── README.md, CHANGELOG.md, LICENSE.md, ckeditor5-metadata.json
```

## Workspace conversion

- `pnpm-workspace.yaml` gains `packages: ["packages/*"]`; the existing
  `allowBuilds` and `peerDependencyRules` entries stay.
- The app's devDependency `@witoso/ckeditor5-frontmatter` changes from
  `^1.0.0` to `workspace:^` so dev always uses the local plugin.

## Plugin import

Copy everything from the plugin working tree EXCEPT: `node_modules/`,
`dist/`, `tmp/`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `.git/`.

Plugin `package.json` changes:

- `repository` → `git+https://github.com/Witoso/ssg-wysiwig.git` with
  `"directory": "packages/ckeditor5-frontmatter"`. (The GitHub repo backing
  this working dir is named `ssg-wysiwig`, not `ssg-editor`.)
- Remove `husky` and `lint-staged` (devDeps, `scripts` hooks, config blocks).
  The monorepo root owns repo-level conventions.
- Everything else (build/test tooling, peerDeps, `files`, `exports`,
  `prepublishOnly`) stays as-is; the package remains self-contained.

License split is intentional: plugin GPL-2.0-or-later, app GPL-3.0-or-later.

## Publishing

`pnpm publish` from `packages/ckeditor5-frontmatter` (its `prepublishOnly`
already runs the full build). pnpm rewrites `workspace:^` references on
publish. Versions stay independent.

## CI

- Bump Node from 22 to 24 in `.github/workflows/ci.yml` (plugin engines
  require >=24.11; app requires >=18).
- Add plugin steps: `pnpm --filter @witoso/ckeditor5-frontmatter lint`,
  `test`, `build`. Fallback if the webdriverio browser tests are flaky on
  GitHub runners: keep lint + build only and note it in the workflow.

## Old repo archival

In `Witoso/ckeditor5-frontmatter` (the uncommitted work migrates via the
import, then is stashed in the old repo so the README notice lands clean):

1. Prepend a notice to README.md: development moved to
   `Witoso/ssg-wysiwig` under `packages/ckeditor5-frontmatter`; the npm
   package `@witoso/ckeditor5-frontmatter` continues to be published from
   there.
2. Commit and push the README change only.
3. `gh repo archive Witoso/ckeditor5-frontmatter -y`.

## Verification

- `pnpm install` at root links the workspace package.
- `pnpm --filter @witoso/ckeditor5-frontmatter test` and `build` pass.
- Root `pnpm test` and `pnpm build` pass (app consumes the local plugin).
- `pnpm publish --dry-run` in the package dir produces a sane tarball
  (dist + ckeditor5-metadata.json, no stray files).
