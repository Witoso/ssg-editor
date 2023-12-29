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
import { Autosave } from "@ckeditor/ckeditor5-autosave";
import { Frontmatter } from "@witoso/ckeditor5-frontmatter";

export class ClassicEditor extends ClassicEditorBase {}

ClassicEditor.builtinPlugins = [
  Essentials,
  Autoformat,
  Autosave,
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
  Frontmatter
];

ClassicEditor.defaultConfig = {
  toolbar: {
    items: [
      "frontmatter",
      '|',
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
  frontmatter: new Map(
    [
      ['title', ''],
      ['draft', 'true'],
      ['date', '$currentDate']
    ])
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
      {
        placeholder: "Start writing...",
        autosave: {
          save: (editor: ClassicEditor) => {
            return new Promise<void>((resolve) => {
              console.log('Saving stub...');
              resolve();
            });
          },
        },
      }
    );
    this.editor.enableReadOnlyMode("post-not-loaded");
  }

  render() {
    const template = html`
      <h2>Post</h2>
      <div id="editor"></div>
    `;
    render(template, this);
  }

  private listenForPostChange = () => {
    document.addEventListener("post-selected", (event: Event) => {
      const post = event as PostSelectedEvent;
      const content = post.detail.value.content;
      if (this.editor) {
        this.editor.disableReadOnlyMode("post-not-loaded");
        console.log(content)
        this.editor.setDataWithFrontmatter(content);
      } else {
        console.error("Editor is not initialized");
      }
    });
  };
}
