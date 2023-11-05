import { ClassicEditor as ClassicEditorBase } from "@ckeditor/ckeditor5-editor-classic";
import { Essentials } from "@ckeditor/ckeditor5-essentials";
import { Autoformat } from "@ckeditor/ckeditor5-autoformat";
import {
  Bold,
  Italic,
  Strikethrough,
  Underline,
} from "@ckeditor/ckeditor5-basic-styles";
import { BlockQuote } from "@ckeditor/ckeditor5-block-quote";
import { Heading } from "@ckeditor/ckeditor5-heading";
import { Link } from "@ckeditor/ckeditor5-link";
import { DocumentList } from "@ckeditor/ckeditor5-list";
import { Markdown } from "@ckeditor/ckeditor5-markdown-gfm";

export class ClassicEditor extends ClassicEditorBase {}

ClassicEditor.builtinPlugins = [
  Essentials,
  Autoformat,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  BlockQuote,
  Heading,
  Link,
  DocumentList,
  Markdown,
];

ClassicEditor.defaultConfig = {
  toolbar: {
    items: [
      "undo",
      "redo",
      "|",
      "heading",
      "|",
      "bold",
      "italic",
      "underline",
      "strikethrough",
      "|",
      "link",
      "bulletedList",
      "numberedList",
      "blockQuote",
    ],
  },
  language: "en",
};
