# Changelog

All notable changes to `@witoso/ssg-editor` are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/).

## Unreleased

- Opening a file no longer triggers a spurious save: the content is now passed
  as the editor's initial data instead of via `setData()`, which Autosave
  treated as an edit and immediately wrote back to disk.
- Long file and folder names in the sidebar now truncate to a single line with
  an ellipsis and a hover tooltip, with tighter tree indentation, instead of
  wrapping or forcing horizontal scroll.
- The CLI now refuses to start when the requested port is already in use
  instead of silently drifting to another port.
- Hide the underlying framework's log lines from the CLI output.

## 0.5.0 (2026-06-12)

- Configurable port and host via `.sserc.js`, the `--port` / `--host` flags,
  and the `PORT` / `HOST` environment variables.
- Editor config extraction, static empty state, accessible status region, and
  keyboard tree navigation.
- Moved the `ckeditor5-frontmatter` plugin into this repo as a workspace
  package (`packages/ckeditor5-frontmatter`).
