# Changelog

## Unreleased

### Breaking changes

- The `frontmatter` configuration is now an object. The previous Map of default fields moved to its `defaults` property: `frontmatter: { defaults: new Map( [ ... ] ) }`.

### Added

- The `frontmatter.collapsible` option. When enabled, the frontmatter renders collapsed (`---` / `...` / `---`) in the editing view and only shows its full content while hovered or while the selection is inside it (with the editor focused). The data output is unaffected.

### Fixed

- Pasting multi-block content (e.g. several paragraphs) into the frontmatter no longer splits it. Clipboard input targeting the frontmatter is inserted as plain text with soft breaks.
- Hardened the schema: block elements are no longer allowed inside the frontmatter container, the container is only allowed at the document root, and editing operations no longer leak content across the frontmatter boundary (backspace/forward-delete merges, select-all).

## 1.0.0 (2026-06-07)

- First stable release.
