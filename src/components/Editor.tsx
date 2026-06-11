import { useRef } from "react";

import { saveStatus } from "./savingStore.js";
import { saveFile } from "./editorSave.js";

import { CKEditor } from "@ckeditor/ckeditor5-react";
import {
  Autoformat,
  AutoLink,
  Autosave,
  BalloonToolbar,
  BlockQuote,
  Bold,
  Code,
  CodeBlock,
  Essentials,
  Heading,
  HorizontalLine,
  HtmlEmbed,
  ImageBlock,
  ImageCaption,
  ImageStyle,
  ImageTextAlternative,
  ImageToolbar,
  ImageUpload,
  Italic,
  Link,
  List,
  ListProperties,
  Markdown,
  Paragraph,
  PasteFromMarkdownExperimental,
  PasteFromOffice,
  Strikethrough,
  Table,
  TableCaption,
  TableCellProperties,
  TableColumnResize,
  TableProperties,
  TableToolbar,
  TextTransformation,
  DecoupledEditor,
  SimpleUploadAdapter,
} from "ckeditor5";

import { Frontmatter } from "@witoso/ckeditor5-frontmatter";

import "ckeditor5/ckeditor5.css";
import "@witoso/ckeditor5-frontmatter/index.css";

import "./Editor.css";

type EditorProps = {
  content?: string;
  readOnly?: boolean;
  filePath?: string;
};

export function Editor({ content, readOnly, filePath }: EditorProps) {
  const editorRef = useRef<DecoupledEditor | null>(null);
  const editorToolbarRef = useRef<HTMLDivElement>(null);

  const focusEditor = () => {
    if (!readOnly) {
      editorRef.current?.editing.view.focus();
    }
  };

  const saveData = (editor: DecoupledEditor) => {
    if (!filePath) {
      return Promise.resolve();
    }

    return saveFile(filePath, editor.getDataWithFrontmatter());
  };

  return (
    <div className="ssge-editor">
      <div className="editor-container__toolbar" ref={editorToolbarRef}></div>
      <div className="ssge-editor__editable-shell" onClick={focusEditor}>
        <div className="prose w-full">
          <CKEditor
            editor={DecoupledEditor}
            config={{
              licenseKey: "GPL",
              plugins: [
                ...(readOnly ? [] : [Autosave]),
                Essentials,
                Frontmatter,
                Autoformat,
                AutoLink,
                BalloonToolbar,
                BlockQuote,
                Bold,
                Code,
                CodeBlock,
                Essentials,
                Heading,
                HorizontalLine,
                HtmlEmbed,
                ImageBlock,
                ImageCaption,
                ImageStyle,
                ImageTextAlternative,
                ImageToolbar,
                ImageUpload,
                Italic,
                Link,
                List,
                ListProperties,
                Markdown,
                Paragraph,
                PasteFromMarkdownExperimental,
                PasteFromOffice,
                Strikethrough,
                Table,
                TableCaption,
                TableCellProperties,
                TableColumnResize,
                TableProperties,
                TableToolbar,
                TextTransformation,
                SimpleUploadAdapter,
              ],
              balloonToolbar: [
                "bold",
                "italic",
                "|",
                "link",
                "|",
                "bulletedList",
                "numberedList",
              ],

              toolbar: [
                "undo",
                "redo",
                "|",
                "frontmatter",
                "|",
                "heading",
                "|",
                "bold",
                "italic",
                "strikethrough",
                "code",
                "|",
                "link",
                "uploadImage",
                "insertTable",
                "blockQuote",
                "codeBlock",
                "htmlEmbed",
                "|",
                "bulletedList",
                "numberedList",
              ],
              ui: {
                poweredBy: {
                  position: "inside",
                  side: "right",
                  verticalOffset: -10,
                  horizontalOffset: 0,
                  label: "Powered by",
                },
              },
              image: {
                toolbar: [
                  "toggleImageCaption",
                  "imageTextAlternative",
                  "|",
                  "imageStyle:alignBlockLeft",
                  "imageStyle:block",
                  "imageStyle:alignBlockRight",
                ],
                styles: {
                  options: ["alignBlockLeft", "block", "alignBlockRight"],
                },
              },
              simpleUpload: {
                uploadUrl: "/upload",
              },
              link: {
                addTargetToExternalLinks: true,
                defaultProtocol: "https://",
              },
              list: {
                properties: {
                  styles: true,
                  startIndex: true,
                  reversed: true,
                },
              },
              placeholder: "Type or paste your content here!",
              table: {
                contentToolbar: [
                  "tableColumn",
                  "tableRow",
                  "mergeTableCells",
                  "tableProperties",
                  "tableCellProperties",
                ],
              },
              autosave: {
                save(editor) {
                  return saveData(editor as DecoupledEditor);
                },
              },
            }}
            onReady={(editor) => {
              editorRef.current = editor as DecoupledEditor;

              const pendingActions = editor.plugins.get("PendingActions");
              pendingActions.on(
                "change:hasAny",
                (_evt, _propertyName, hasAny) => {
                  saveStatus.set(hasAny ? "saving" : "idle");
                },
              );

              editor.setDataWithFrontmatter(content!);
              const toolbar = editor.ui?.view?.toolbar;
              if (editorToolbarRef?.current && toolbar?.element) {
                editorToolbarRef.current.appendChild(toolbar.element);
              }
            }}
            disabled={readOnly}
          />
        </div>
      </div>
    </div>
  );
}
