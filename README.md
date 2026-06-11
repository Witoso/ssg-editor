[![npm version](https://badge.fury.io/js/@witoso%2Fssg-editor.svg)](https://badge.fury.io/js/@witoso%2Fssg-editor)

> [!NOTE]
> This is in a beta mode. Things can change 😊

# SSG Editor

A WYSIWYG editor that can power your SSG page. No more remembering how to add a link in Markdown. Use great CKEditor 5 with perfect editing experience.

```
  |-----------------------|-----------------------|
Text editor        ✨ SSG Editor ✨              CMS
```

## Installation

> [!IMPORTANT]
> `npm` or any other package manager is required.

Run the command in the terminal. `npm` or any other package manager is required.

```sh
npm install -g @witoso/ssg-editor@latest
```

## Usage

Run the command in the terminal to start writing:

```sh
ssge path/to/folder/with/files/to/write
```

Everything runs locally. When you run the command, you should see the local server starting.

```sh
SSG Editor is running at http://localhost:4321
```

Navigate to this page in the browser. Create new files or edit the current markdown ones in this folder.

The default port is `4321`; override it with `--port` (or the `PORT` environment variable):

```sh
ssge path/to/folder --port 8989
```

## Configuration

SSG Editor reads optional configuration from `.sserc.js` in the edited folder,
falling back to the directory where you run the `ssge` command.

```js
export default {
  images: {
    uploadDir: "public/uploads",
    publicPath: "/uploads",
  },
};
```

Image uploads are written to `uploadDir`, relative to the edited folder. The
editor inserts URLs using `publicPath`.

## Development

This project uses `pnpm`.

```sh
pnpm install
pnpm run build
```

For local development, `pnpm start` copies `test/fixtures/site` to a temporary
directory and launches Astro against that copy, using the fixture `.sserc.js`
config. This keeps editor autosaves out of Vite's watched project files.

## To do

- [ ] More CKEditor 5 plugins (dynamic config?)
- [ ] Tree view of files.
- [ ] Image upload and storage.
- [ ] Page preview?
