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
import { PostSaveRequestSchema } from "../../types/post";

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
  Frontmatter,
];

ClassicEditor.defaultConfig = {
  placeholder: "Start writing...",
  toolbar: {
    items: [
      "frontmatter",
      "|",
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
  frontmatter: new Map([
    ["title", ""],
    ["draft", "true"],
    ["date", "$currentDate"],
  ]),
};

export class CKEditorComponent extends HTMLElement {
  private currentPostFilename: string;
  editor: ClassicEditor;

  constructor() {
    super();
  }

  async connectedCallback() {
    this.render();
    await this.initializeEditor();
    this.listenForPostChange();
    this.autosave();
  }

  initializeEditor = async () => {
    this.editor = await ClassicEditor.create(
      this.querySelector("#editor") as HTMLElement, // Changed to querySelector
      {
        autosave: {
          save: (editor: ClassicEditor) => {
            return saveData(editor, this.currentPostFilename);
          },
        },
      },
    );
    this.editor.enableReadOnlyMode("post-not-loaded");
  };

  render() {
    const template = html` <div id="editor"></div> `;
    render(template, this);
  }

  private listenForPostChange = () => {
    document.addEventListener("post-selected", (event: Event) => {
      const post = event as PostSelectedEvent;
      const content = post.detail.value.content;
      this.currentPostFilename = post.detail.value.filename;

      if (this.editor) {
        this.editor.disableReadOnlyMode("post-not-loaded");
        this.editor.setDataWithFrontmatter(content);
      } else {
        console.error("Editor is not initialized");
      }
    });
  };

  private autosave = () => {
    const pendingActions = this.editor.plugins.get("PendingActions");
    const autosaveStatus = document.getElementById("autosave-status");

    pendingActions.on("change:hasAny", (_evt, _propertyName, newValue) => {
      if (newValue) {
        autosaveStatus.textContent = "Saving...";
      } else {
        autosaveStatus.textContent = "Saved!";
      }
    });
  };
}

function saveData(editor: ClassicEditor, filename: string) {
  const apiUrl = "http://localhost:8989/posts";
  return new Promise<void>((resolve, reject) => {
    const content = editor.getDataWithFrontmatter();

    const data = {
      content: content,
      filename: filename,
    };

    try {
      const postSaveRequest = PostSaveRequestSchema.parse(data);

      fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(postSaveRequest),
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error("Network response was not ok");
          }
          return response.json();
        })
        .then(() => {
          resolve();
        })
        .catch((error) => {
          console.error("Error:", error);
          reject();
        });
    } catch (error) {
      console.error("Error:", error);
      reject();
    }
  });
}
