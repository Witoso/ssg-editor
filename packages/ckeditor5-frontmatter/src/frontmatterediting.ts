import {
  Plugin,
  ViewUpcastWriter,
  type Editor,
  type ViewDocumentClipboardInputEvent,
} from "ckeditor5";
import FrontmatterDataProcessor from "./frontmatterdataprocessor.js";
import InsertFrontmatterCommand from "./insertfrontmattercommand.js";
import {
  findFrontmatterContainer,
  inFrontmatter,
  isFrontmatterEnd,
  rawTextToViewDocumentFragment,
  removeSoftBreakBeforeSelection,
} from "./utils.js";

export default class FrontmatterEditing extends Plugin {
  public static get pluginName() {
    return "FrontmatterEditing" as const;
  }

  declare public frontmatterLoaded: boolean;

  constructor(editor: Editor) {
    super(editor);

    // Define an observable property
    this.set("frontmatterLoaded", false);
  }

  public init(): void {
    this._defineSchema();
    this._defineConversion();

    // Augment editor with backwards-compatible frontmatter API aliases.
    this._defineDataApi();

    // Enter is a soft break inside the frontmatter.
    this._defineEnterInFrontmatter();

    // Pasted blocks must not split the frontmatter.
    this._defineClipboardHandling();

    // Move frontmatter to the top.
    this._registerFrontmatterPostfixer();

    // TODO fix the HTML clipboard. The frontmatter is not detected on paste.

    // Access the configuration
    const frontmatterConfig = this.editor.config.get("frontmatter");

    if (frontmatterConfig?.collapsible) {
      this._defineCollapseHandling();
    }

    this.editor.commands.add(
      "insertFrontmatter",
      new InsertFrontmatterCommand(this.editor, frontmatterConfig),
    );
  }

  public afterInit(): void {
    this._defineDataProcessor();
  }

  private _defineSchema() {
    const editor = this.editor;
    const schema = editor.model.schema;

    schema.register("frontmatterContainer", {
      // Only the frontmatter itself may live in the container — block elements landing
      // here would be silently dropped by the data processor. The limit flag stops
      // cross-boundary operations (backspace/delete merges, select-all) from leaking
      // content in or out.
      allowIn: "$root",
      allowChildren: "frontmatter",
      isLimit: true,
    });

    schema.register("frontmatter", {
      allowIn: "frontmatterContainer",
      allowChildren: "$text",
      // Disallow `$inlineObject` and its derivatives like `inlineWidget` inside `codeBlock` to ensure that only text,
      // not other inline elements like inline images, are allowed. This maintains the semantic integrity of code blocks.
      disallowChildren: "$inlineObject",
      isBlock: true,
      // Select-all needs a limit element that can directly hold text to use as its scope;
      // the container cannot (it only allows the frontmatter), so without this flag
      // select-all escapes to the document root.
      isLimit: true,
    });

    // Add a check to disallow attributes inside frontmatter.
    schema.addAttributeCheck((context) => {
      if (context.endsWith("frontmatter $text")) {
        return false;
      }
    });
  }

  private _defineConversion() {
    const editor = this.editor;
    const conversion = editor.conversion;

    // <frontmatterContainer> converters
    conversion.for("upcast").elementToElement({
      model: "frontmatterContainer",
      view: {
        name: "section",
        classes: "frontmatter-container",
      },
    });

    conversion.for("editingDowncast").elementToElement({
      model: "frontmatterContainer",
      view: {
        name: "section",
        classes: "frontmatter-container",
      },
    });

    conversion.for("dataDowncast").elementToStructure({
      model: "frontmatterContainer",
      view: (_model, conversionApi) => {
        const { writer } = conversionApi;

        return writer.createContainerElement(
          "section",
          {
            class: "frontmatter-container",
          },
          [writer.createSlot()],
        );
      },
    });

    // <frontmatter> converters
    conversion.for("upcast").elementToElement({
      view: {
        name: "div",
        classes: "frontmatter",
      },
      model: "frontmatter",
    });

    // Model to View conversion.
    conversion.for("editingDowncast").elementToElement({
      model: "frontmatter",
      view: {
        // We use custom element if someone would like to
        // keepHtml div for example.
        name: "div",
        classes: "frontmatter",
      },
    });

    conversion.for("dataDowncast").elementToElement({
      model: "frontmatter",
      view: {
        // We use custom element if someone would like to
        // keepHtml div for example.
        name: "frontmatter",
      },
    });
  }

  private _defineDataProcessor() {
    const editor = this.editor;

    if (editor.data.processor instanceof FrontmatterDataProcessor) {
      return;
    }

    editor.data.processor = new FrontmatterDataProcessor(editor.data.processor);
  }

  private _defineDataApi() {
    const editor = this.editor;

    editor.setDataWithFrontmatter = (data: string) => {
      editor.setData(data);
    };

    editor.getDataWithFrontmatter = (): string => {
      return editor.getData();
    };
  }

  private _defineEnterInFrontmatter() {
    const editor = this.editor;
    const selection = editor.model.document.selection;

    editor.editing.view.document.on(
      "enter",
      (evt, data) => {
        if (!inFrontmatter(selection)) {
          return;
        }

        if (isFrontmatterEnd(selection)) {
          const frontmatterContainer = findFrontmatterContainer(selection);

          if (!frontmatterContainer) {
            return;
          }

          removeSoftBreakBeforeSelection(selection, editor.model);

          editor.model.change((writer) => {
            const positionAfterElement =
              writer.createPositionAfter(frontmatterContainer);

            editor.execute("insertParagraph", {
              position: positionAfterElement,
            });
          });

          // Still need to prevent the enter.
          data.preventDefault();
          evt.stop();
          editor.editing.view.scrollToTheSelection();
        } else {
          data.preventDefault();
          evt.stop();
          editor.execute("shiftEnter");
          editor.editing.view.scrollToTheSelection();
        }
      },
      { priority: "high" },
    );
  }

  private _defineCollapseHandling() {
    const editor = this.editor;
    const model = editor.model;
    const viewDocument = editor.editing.view.document;

    // The selection only keeps the frontmatter expanded while the editor is focused —
    // otherwise the default selection placed at document start would render every
    // loaded document with the frontmatter expanded.
    this.listenTo(viewDocument, "change:isFocused", () => {
      editor.editing.view.change(() => {});
    });

    // The CSS collapses the container unless it is hovered or carries the
    // `frontmatter-selected` class. A view post-fixer (rather than a one-shot selection
    // listener) keeps the classes correct across reconversion and undo.
    viewDocument.registerPostFixer((writer) => {
      const root = model.document.getRoot();
      const containerModel = root?.getChild(0);

      if (
        !containerModel ||
        !containerModel.is("element", "frontmatterContainer")
      ) {
        return false;
      }

      const containerView = editor.editing.mapper.toViewElement(containerModel);

      if (!containerView) {
        return false;
      }

      let changed = false;

      if (!containerView.hasClass("frontmatter-collapsible")) {
        writer.addClass("frontmatter-collapsible", containerView);
        changed = true;
      }

      const selectionInside =
        viewDocument.isFocused && inFrontmatter(model.document.selection);

      if (selectionInside !== containerView.hasClass("frontmatter-selected")) {
        if (selectionInside) {
          writer.addClass("frontmatter-selected", containerView);
        } else {
          writer.removeClass("frontmatter-selected", containerView);
        }

        changed = true;
      }

      return changed;
    });
  }

  private _defineClipboardHandling() {
    const editor = this.editor;
    const model = editor.model;

    // Intercept the clipboard input (paste) when the selection is anchored in the frontmatter
    // and force the clipboard data to be pasted as plain text with soft breaks. Otherwise,
    // block elements (e.g. multiple pasted paragraphs) split the frontmatter and "spill out"
    // into the container.
    this.listenTo<ViewDocumentClipboardInputEvent>(
      editor.editing.view.document,
      "clipboardInput",
      (evt, data) => {
        const anchor = model.document.selection.anchor!;

        if (!anchor.parent.is("element", "frontmatter")) {
          return;
        }

        const text = data.dataTransfer.getData("text/plain");
        const writer = new ViewUpcastWriter(editor.editing.view.document);

        // Pass the view fragment to the default clipboardInput handler.
        data.content = rawTextToViewDocumentFragment(writer, text);
      },
    );
  }

  private _registerFrontmatterPostfixer() {
    const model = this.editor.model;
    const document = model.document;

    document.registerPostFixer((writer) => {
      const root = document.getRoot();

      if (!root) {
        return false;
      }

      const changes = document.differ.getChanges();

      for (const entry of changes) {
        if (entry.type == "insert" && entry.name === "frontmatterContainer") {
          this.set("frontmatterLoaded", true);

          const possibleFrontmatterContainer = root.getChild(0);

          if (
            possibleFrontmatterContainer &&
            possibleFrontmatterContainer.is("element", "frontmatterContainer")
          ) {
            // If the frontmatterContainer is already at the top, no change is needed
            return false;
          }

          const frontmatterContainer = entry.position.nodeAfter;

          if (!frontmatterContainer) {
            return false;
          }

          const startPosition = model.createPositionAt(root, 0);

          // Move the frontmatterContainer to the start of the document
          writer.move(
            writer.createRangeOn(frontmatterContainer),
            startPosition,
          );

          // Indicate that changes were made
          return true;
        }

        // const range = model.createRangeIn( root );
        if (entry.type == "remove" && entry.name === "frontmatterContainer") {
          this.set("frontmatterLoaded", false);
        }
      }

      // No changes were made
      return false;
    });
  }
}
