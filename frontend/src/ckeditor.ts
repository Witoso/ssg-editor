import type GFMDataProcessor from "@ckeditor/ckeditor5-markdown-gfm/src/gfmdataprocessor";
import { Frontmatter } from "@witoso/ckeditor5-frontmatter";
import { html, render } from "lit-html";
import { PostSaveRequestSchema } from "../../types/post";
import { PostSelectedEvent } from "./posts-select";
import {
  Autoformat,
  Essentials,
  ClassicEditor as ClassicEditorBase,
  Autosave,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  BlockQuote,
  Heading,
  Link,
  List,
  TodoList,
  CodeBlock,
  Markdown,
  HtmlEmbed,
} from "ckeditor5";

export class ClassicEditor extends ClassicEditorBase {}

ClassicEditor.builtinPlugins = [
  Essentials,
  Autoformat,
  Autosave,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  BlockQuote,
  Heading,
  Link,
  List,
  TodoList,
  CodeBlock,
  Markdown,
  Frontmatter,
  HtmlEmbed,
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
      "|",
      "bulletedList",
      "numberedList",
      "todoList",
      "|",
      "blockQuote",
      "codeBlock",
      "htmlEmbed",
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
    this.autosaveIndicator();
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
    const gfm = this.editor.data.processor as GFMDataProcessor;
    gfm.keepHtml("ruby");
    gfm.keepHtml("div");
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

  private autosaveIndicator = () => {
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
