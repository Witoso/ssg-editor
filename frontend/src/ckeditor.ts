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
import { DocumentList, TodoDocumentList } from "@ckeditor/ckeditor5-list";
import { Markdown } from "@ckeditor/ckeditor5-markdown-gfm";
import { html, render } from "lit-html";
import { PostSelectedEvent } from "./posts-select";

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
  TodoDocumentList,
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
      "todoList",
      "|",
      "blockQuote",
    ],
  },
  language: "en",
};

export class CKEditorComponent extends HTMLElement {
  editor: ClassicEditor;

  constructor() {
    super();
  }

  async connectedCallback() {
    this.render();
    await this.initializeEditor();
    this.listenForPostChange();
  }

  async initializeEditor() {
    this.editor = await ClassicEditor.create(
      this.querySelector("#editor") as HTMLElement, // Changed to querySelector
      { placeholder: "Start writing..." }
    );
    this.editor.enableReadOnlyMode("post-not-loaded");
  }

  render() {
    const template = html`
      <h2>Post</h2>
      <div class="block mx-auto" id="editor"></div>
    `;
    render(template, this);
  }

  private listenForPostChange = () => {
    document.addEventListener("post-selected", (event: Event) => {
      const post = event as PostSelectedEvent;
      const content = post.detail.value.content;
      if (this.editor) {
        this.editor.disableReadOnlyMode("post-not-loaded");
        this.editor.setData(content);
      } else {
        console.error("Editor is not initialized");
      }
    });
  };
}
