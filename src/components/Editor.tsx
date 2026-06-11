import { useRef } from "react";

import { CKEditor } from "@ckeditor/ckeditor5-react";
import { DecoupledEditor } from "ckeditor5";

import { saveStatus } from "./savingStore.js";
import { saveFile } from "./editorSave.js";
import { editorConfig } from "./editorConfig.js";

import "ckeditor5/ckeditor5.css";
import "@witoso/ckeditor5-frontmatter/index.css";

import "./Editor.css";

type EditorProps = {
  content: string;
  filePath: string;
};

export function Editor({ content, filePath }: EditorProps) {
  const editorRef = useRef<DecoupledEditor | null>(null);
  const editorToolbarRef = useRef<HTMLDivElement>(null);

  const focusEditor = () => {
    editorRef.current?.editing.view.focus();
  };

  return (
    <div className="ssge-editor">
      <div className="editor-container__toolbar" ref={editorToolbarRef}></div>
      <div className="ssge-editor__editable-shell" onClick={focusEditor}>
        <div className="prose w-full">
          <CKEditor
            editor={DecoupledEditor}
            config={{
              ...editorConfig,
              autosave: {
                save(editor) {
                  return saveFile(
                    filePath,
                    (editor as DecoupledEditor).getDataWithFrontmatter(),
                  );
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

              editor.setDataWithFrontmatter(content);
              const toolbar = editor.ui?.view?.toolbar;
              if (editorToolbarRef?.current && toolbar?.element) {
                editorToolbarRef.current.appendChild(toolbar.element);
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}
