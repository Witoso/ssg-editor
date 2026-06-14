import Frontmatter from "../src/frontmatter.js";
import FrontmatterToolbar from "../src/frontmattertoolbar.js";
import { getSelectedFrontmatterWidget } from "../src/utils.js";
import {
  ButtonView,
  ClassicEditor,
  Essentials,
  Heading,
  HorizontalLine,
  Markdown,
  Paragraph,
  type ModelElement,
  type ViewElement,
} from "ckeditor5";

describe("FrontmatterToolbar", () => {
  let domElement: HTMLElement, editor: ClassicEditor | undefined;

  beforeEach(async () => {
    domElement = document.createElement("div");
    document.body.appendChild(domElement);

    editor = await ClassicEditor.create(domElement, {
      plugins: [
        Paragraph,
        Heading,
        Essentials,
        Frontmatter,
        FrontmatterToolbar,
        HorizontalLine,
        Markdown,
      ],
      toolbar: ["frontmatter"],
      licenseKey: "GPL",
    });
  });

  afterEach(() => {
    domElement.remove();
    return editor?.destroy();
  });

  function getViewContainer() {
    return editor!.editing.view.document.getRoot()!.getChild(0) as ViewElement;
  }

  it("should be named", () => {
    expect(FrontmatterToolbar.pluginName).toBe("FrontmatterToolbar");
  });

  describe("collapse downcast", () => {
    it("collapses the frontmatter by default", () => {
      editor!.setData("---\ntitle: Title\n---\n\nBody.");

      expect(getViewContainer().hasClass("frontmatter-collapsed")).toBe(true);
    });

    it("expands when toggled off", () => {
      editor!.setData("---\ntitle: Title\n---\n\nBody.");

      editor!.execute("toggleFrontmatterCollapse");

      expect(getViewContainer().hasClass("frontmatter-collapsed")).toBe(false);
    });

    it("collapses again when toggled twice", () => {
      editor!.setData("---\ntitle: Title\n---\n\nBody.");

      editor!.execute("toggleFrontmatterCollapse");
      editor!.execute("toggleFrontmatterCollapse");

      expect(getViewContainer().hasClass("frontmatter-collapsed")).toBe(true);
    });

    it("does not affect the data output", () => {
      const content = "---\ntitle: Title\n---\n\nBody.";

      editor!.setData(content);
      editor!.execute("toggleFrontmatterCollapse");

      expect(editor!.getData()).toBe(content);
    });

    it("stays expanded when the post-fixer relocates the frontmatter", () => {
      editor!.setData("---\ntitle: Title\n---\n\nBody.");
      editor!.execute("toggleFrontmatterCollapse");

      // Insert content before the frontmatter so the post-fixer moves it,
      // which re-inserts the widget in the editing view.
      editor!.model.change((writer) => {
        const paragraph = writer.createElement("paragraph");

        writer.insertText("Intro", paragraph, 0);
        writer.insert(
          paragraph,
          writer.createPositionAt(editor!.model.document.getRoot()!, 0),
        );
      });

      expect(getViewContainer().hasClass("frontmatter-collapsed")).toBe(false);
    });
  });

  describe("toggleFrontmatterCollapse command", () => {
    function command() {
      return editor!.commands.get("toggleFrontmatterCollapse")!;
    }

    it("is disabled without a frontmatter", () => {
      editor!.setData("Body.");

      expect(command().isEnabled).toBe(false);
    });

    it("is enabled with a frontmatter", () => {
      editor!.setData("---\ntitle: Title\n---\n\nBody.");

      expect(command().isEnabled).toBe(true);
    });

    it("value reflects the collapsed state", () => {
      editor!.setData("---\ntitle: Title\n---\n\nBody.");

      expect(command().value).toBe(true);

      editor!.execute("toggleFrontmatterCollapse");

      expect(command().value).toBe(false);
    });

    it("value is false without a frontmatter", () => {
      editor!.setData("Body.");

      expect(command().value).toBe(false);
    });

    it("execute is a no-op without a frontmatter", () => {
      editor!.setData("Body.");

      expect(() => editor!.execute("toggleFrontmatterCollapse")).not.toThrow();
    });
  });

  describe("getSelectedFrontmatterWidget", () => {
    function viewSelection() {
      return editor!.editing.view.document.selection;
    }

    function getModelContainer() {
      return editor!.model.document.getRoot()!.getChild(0) as ModelElement;
    }

    it("returns the widget when it is selected as an object", () => {
      editor!.setData("---\ntitle: Title\n---\n\nBody.");

      editor!.model.change((writer) => {
        writer.setSelection(getModelContainer(), "on");
      });

      expect(getSelectedFrontmatterWidget(viewSelection())).toBe(
        getViewContainer(),
      );
    });

    it("returns the widget when the selection is inside it", () => {
      editor!.setData("---\ntitle: Title\n---\n\nBody.");

      editor!.model.change((writer) => {
        writer.setSelection(
          getModelContainer().getChild(0) as ModelElement,
          "end",
        );
      });

      expect(getSelectedFrontmatterWidget(viewSelection())).toBe(
        getViewContainer(),
      );
    });

    it("returns null when the selection is in the body", () => {
      editor!.setData("---\ntitle: Title\n---\n\nBody.");

      editor!.model.change((writer) => {
        writer.setSelection(
          editor!.model.document.getRoot()!.getChild(1) as ModelElement,
          "end",
        );
      });

      expect(getSelectedFrontmatterWidget(viewSelection())).toBe(null);
    });

    it("returns null when another widget is selected", () => {
      editor!.setData("---\ntitle: Title\n---\n\nBody.");
      editor!.execute("horizontalLine");

      expect(getSelectedFrontmatterWidget(viewSelection())).toBe(null);
    });

    it("returns null when the selection has no position", () => {
      editor!.setData("---\ntitle: Title\n---\n\nBody.");

      editor!.editing.view.change((writer) => {
        writer.setSelection(null);
      });

      expect(getSelectedFrontmatterWidget(viewSelection())).toBe(null);
    });
  });

  describe("toggle button", () => {
    it("registers the toggleFrontmatterCollapse component", () => {
      expect(
        editor!.ui.componentFactory.has("toggleFrontmatterCollapse"),
      ).toBe(true);
    });

    it("registers the frontmatter widget toolbar", () => {
      const repository = editor!.plugins.get("WidgetToolbarRepository");

      // Registering twice with the same id throws — proves "frontmatter" is taken.
      expect(() =>
        repository.register("frontmatter", {
          items: ["toggleFrontmatterCollapse"],
          getRelatedElement: () => null,
        }),
      ).toThrow();
    });

    it("labels the button for the current collapsed state", () => {
      editor!.setData("---\ntitle: Title\n---\n\nBody.");

      const button = editor!.ui.componentFactory.create(
        "toggleFrontmatterCollapse",
      ) as ButtonView;

      expect(button.label).toBe("Expand frontmatter");
      expect(button.isOn).toBe(true);

      editor!.execute("toggleFrontmatterCollapse");

      expect(button.label).toBe("Collapse frontmatter");
      expect(button.isOn).toBe(false);

      button.destroy();
    });

    it("executes the command when the button fires execute", () => {
      editor!.setData("---\ntitle: Title\n---\n\nBody.");

      const button = editor!.ui.componentFactory.create(
        "toggleFrontmatterCollapse",
      ) as ButtonView;

      button.fire("execute");

      expect(editor!.commands.get("toggleFrontmatterCollapse")!.value).toBe(
        false,
      );

      button.destroy();
    });
  });
});
