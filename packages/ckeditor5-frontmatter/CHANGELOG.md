# Changelog

## Unreleased

### Breaking changes

- The `frontmatter` configuration is now an object. The previous Map of default fields moved to its `defaults` property: `frontmatter: { defaults: new Map( [ ... ] ) }`.

### Added

- A `FrontmatterToolbar` plugin (opt-in). When loaded, the frontmatter becomes a widget that renders collapsed (`---` / `...` / `---`) by default. A widget toolbar — shown whenever the frontmatter is selected or being edited — toggles between collapsed and expanded. The collapsed state is editing-only and does not affect the data output.

### Fixed

- Pasting multi-block content (e.g. several paragraphs) into the frontmatter no longer splits it. Clipboard input targeting the frontmatter is inserted as plain text with soft breaks.
- Hardened the schema: block elements are no longer allowed inside the frontmatter container, the container is only allowed at the document root, and editing operations no longer leak content across the frontmatter boundary (backspace/forward-delete merges, select-all).

## 1.0.0 (2026-06-07)

- First stable release.
