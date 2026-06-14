import Frontmatter from "../src/frontmatter.js";
import FrontmatterToolbar from "../src/frontmattertoolbar.js";
import {
  ClassicEditor,
  Essentials,
  Heading,
  Markdown,
  Paragraph,
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
});
