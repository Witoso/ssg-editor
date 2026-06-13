import CKEditorInspector from "@ckeditor/ckeditor5-inspector";
import {
  Autoformat,
  Base64UploadAdapter,
  BlockQuote,
  Bold,
  ClassicEditor,
  Code,
  CodeBlock,
  Essentials,
  Heading,
  Image,
  ImageCaption,
  ImageStyle,
  ImageToolbar,
  ImageUpload,
  Indent,
  Italic,
  Link,
  List,
  Markdown,
  MediaEmbed,
  Paragraph,
  Table,
  TableToolbar,
} from "ckeditor5";

import { Frontmatter } from "../src/index.js";

import "ckeditor5/ckeditor5.css";

declare global {
  interface Window {
    editor: ClassicEditor;
  }
}

ClassicEditor.create({
  attachTo: document.querySelector<HTMLElement>("#editor")!,
  licenseKey: "GPL",
  placeholder: "Start writing...",
  plugins: [
    Frontmatter,
    Markdown,
    Essentials,
    Autoformat,
    BlockQuote,
    Bold,
    Heading,
    Image,
    ImageCaption,
    ImageStyle,
    ImageToolbar,
    ImageUpload,
    Indent,
    Italic,
    Link,
    List,
    MediaEmbed,
    Paragraph,
    Table,
    TableToolbar,
    CodeBlock,
    Code,
    Base64UploadAdapter,
  ],
  toolbar: [
    "frontmatter",
    "|",
    "heading",
    "|",
    "bold",
    "italic",
    "link",
    "code",
    "bulletedList",
    "numberedList",
    "|",
    "outdent",
    "indent",
    "|",
    "uploadImage",
    "blockQuote",
    "insertTable",
    "mediaEmbed",
    "codeBlock",
    "|",
    "undo",
    "redo",
  ],
  image: {
    toolbar: [
      "imageStyle:inline",
      "imageStyle:block",
      "imageStyle:side",
      "|",
      "imageTextAlternative",
    ],
  },
  table: {
    contentToolbar: ["tableColumn", "tableRow", "mergeTableCells"],
  },
  frontmatter: {
    defaults: new Map([
      ["title", ""],
      ["date", "$currentDate"],
    ]),
    collapsible: true,
  },
})
  .then((editor) => {
    window.editor = editor;

    CKEditorInspector.attach(editor);
    window.console.log("CKEditor 5 is ready.", editor);
  })
  .catch((err) => {
    window.console.error(err.stack);
  });
