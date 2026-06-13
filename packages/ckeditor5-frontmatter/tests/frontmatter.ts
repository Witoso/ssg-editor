import FrontmatterDataProcessor from "../src/frontmatterdataprocessor.js";
import Frontmatter from "../src/frontmatter.js";
import {
  _getModelData,
  BlockQuote,
  ClassicEditor,
  Essentials,
  Heading,
  Markdown,
  Paragraph,
  Plugin,
  type ModelElement,
  type ViewElement,
} from "ckeditor5";

describe("Frontmatter", () => {
  it("should be named", () => {
    expect(Frontmatter.pluginName).toBe("Frontmatter");
  });

  describe("init()", () => {
    let domElement: HTMLElement, editor: ClassicEditor | undefined;

    beforeEach(async () => {
      domElement = document.createElement("div");
      document.body.appendChild(domElement);

      editor = await ClassicEditor.create(domElement, {
        plugins: [Paragraph, Heading, Essentials, Frontmatter, Markdown],
        toolbar: ["frontmatter"],
        licenseKey: "GPL",
      });
    });

    afterEach(() => {
      domElement.remove();
      return editor?.destroy();
    });

    it("should load Frontmatter", () => {
      const myPlugin = editor.plugins.get("Frontmatter");

      expect(myPlugin).toBeInstanceOf(Frontmatter);
    });

    it("should add an icon to the toolbar", () => {
      expect(editor.ui.componentFactory.has("frontmatter")).toBe(true);
    });

    it("should wrap the final Markdown data processor", async () => {
      class CustomMarkdownProcessorPlugin extends Plugin {
        public static get requires() {
          return [Markdown] as const;
        }

        public afterInit(): void {
          const processor = this.editor.data.processor;

          this.editor.data.processor = {
            toView: (data) =>
              processor.toView(data.replace("{{custom}}", "## Custom")),
            toData: (viewFragment) => processor.toData(viewFragment),
            registerRawContentMatcher: (pattern) =>
              processor.registerRawContentMatcher(pattern),
            useFillerType: (type) => processor.useFillerType(type),
            get skipComments() {
              return processor.skipComments;
            },
            set skipComments(value) {
              processor.skipComments = value;
            },
          };
        }
      }

      domElement.remove();
      await editor.destroy();

      domElement = document.createElement("div");
      document.body.appendChild(domElement);

      editor = await ClassicEditor.create(domElement, {
        plugins: [
          Paragraph,
          Heading,
          Essentials,
          CustomMarkdownProcessorPlugin,
          Frontmatter,
        ],
        licenseKey: "GPL",
      });

      const processor = editor.data.processor;

      expect(processor).toBeInstanceOf(FrontmatterDataProcessor);
      expect(
        (processor as FrontmatterDataProcessor).innerProcessor,
      ).not.toBeInstanceOf(FrontmatterDataProcessor);

      editor.setData("---\ntitle: Title\n---\n\n{{custom}}");

      expect(editor.getData()).toBe("---\ntitle: Title\n---\n\n## Custom");
    });
  });

  describe("editing", () => {
    let domElement: HTMLElement, editor: ClassicEditor | undefined;

    beforeEach(async () => {
      domElement = document.createElement("div");
      document.body.appendChild(domElement);

      editor = await ClassicEditor.create(domElement, {
        plugins: [Paragraph, Heading, Essentials, Frontmatter, Markdown],
        toolbar: ["frontmatter"],
        licenseKey: "GPL",
      });
    });

    afterEach(() => {
      domElement.remove();
      return editor?.destroy();
    });

    it("empty frontmatter and editor will return empty", () => {
      const icon = editor.ui.componentFactory.create("frontmatter");

      expect(editor.getData()).toBe("");

      icon.fire("execute");

      expect(editor.getData()).toBe("");
    });

    it("should set/get frontmatter correctly through the data processor", () => {
      expect(editor.getData()).toBe("");

      editor.setData("---\ntitle: Title\ndraft: false\n---\n\n## Heading 1");

      expect(editor.getData()).toBe(
        "---\ntitle: Title\ndraft: false\n---\n\n## Heading 1",
      );
    });

    it("should keep the previous frontmatter data API as aliases", () => {
      editor.setDataWithFrontmatter("---\ntitle: Title\n---\n\n## Heading 1");

      expect(editor.getDataWithFrontmatter()).toBe(
        "---\ntitle: Title\n---\n\n## Heading 1",
      );
    });

    it("should preserve YAML characters escaped by Markdown", () => {
      const content =
        '---\ntags: [alpha, beta]\nsummary: "A > B"\nslug: front-matter\n---\n\n## Heading 1';

      editor.setData(content);

      expect(editor.getData()).toBe(content);
    });

    it("should normalize CRLF frontmatter input", () => {
      editor.setData("---\r\ntitle: Title\r\n---\r\n\r\n## Heading 1");

      expect(editor.getData()).toBe("---\ntitle: Title\n---\n\n## Heading 1");
    });

    it("should only treat a document-start block as frontmatter", () => {
      const content = "## Heading 1\n\n---\ntitle: false\n---\n\nParagraph.";

      editor.setData(content);

      expect(editor.getData()).not.toMatch(/^---\ntitle: false\n---/);
    });

    it("should not be possible to create a second frontmatter", () => {
      editor.setData("---\ndraft: false\n---\n\n## Heading 1");

      expect(editor.commands.get("insertFrontmatter")?.isEnabled).toBe(false);
    });

    it("should move frontmatter to the top", () => {
      editor.setData("## Heading 1");

      editor.model.change((writer) => {
        // Move selection to the end of the document.
        writer.setSelection(
          writer.createPositionAt(editor.model.document.getRoot()!, "end"),
        );

        editor.execute("insertFrontmatter");
      });

      expect(editor.getData()).toBe("---\n\n---\n\n## Heading 1");
    });

    it("should be symmetrical", () => {
      expect(editor.getData()).toBe("");

      const content = "---\ntitle: Title\ndraft: false\n---\n\n## Heading 1.";

      editor.setData(content);

      expect(editor.getData()).toBe(content);

      editor.setData(editor.getData());
      expect(editor.getData()).toBe(content);
    });
  });

  describe("clipboard", () => {
    let domElement: HTMLElement, editor: ClassicEditor | undefined;

    beforeEach(async () => {
      domElement = document.createElement("div");
      document.body.appendChild(domElement);

      editor = await ClassicEditor.create(domElement, {
        plugins: [Paragraph, Heading, Essentials, Frontmatter, Markdown],
        toolbar: ["frontmatter"],
        licenseKey: "GPL",
      });
    });

    afterEach(() => {
      domElement.remove();
      return editor?.destroy();
    });

    function createDataTransfer(data: Record<string, string>) {
      return {
        getData(type: string) {
          return data[type];
        },
        setData() {},
      };
    }

    function getFrontmatterElement() {
      const container = editor!.model.document
        .getRoot()!
        .getChild(0) as ModelElement;

      return container.getChild(0) as ModelElement;
    }

    function setSelectionAtFrontmatterEnd() {
      editor!.model.change((writer) => {
        writer.setSelection(getFrontmatterElement(), "end");
      });
    }

    function paste(data: Record<string, string>) {
      editor!.editing.view.document.fire("paste", {
        dataTransfer: createDataTransfer(data),
        stopPropagation() {},
        preventDefault() {},
      });
    }

    it("should paste multi-block content into the frontmatter as plain text", () => {
      editor!.setData("---\ntitle: Title\n---\n\nBody.");
      setSelectionAtFrontmatterEnd();

      paste({
        "text/html": "<p>foo</p><p>bar</p>",
        "text/plain": "foo\n\nbar",
      });

      expect(_getModelData(editor!.model, { withoutSelection: true })).toBe(
        "<frontmatterContainer>" +
          "<frontmatter>" +
          "title: Titlefoo" +
          "<softBreak></softBreak><softBreak></softBreak>" +
          "bar" +
          "</frontmatter>" +
          "</frontmatterContainer>" +
          "<paragraph>Body.</paragraph>",
      );

      expect(editor!.getData()).toBe(
        "---\ntitle: Titlefoo\n\nbar\n---\n\nBody.",
      );
    });

    it("should paste multi-line plain text into the frontmatter as soft breaks", () => {
      editor!.setData("---\ntitle: Title\n---\n\nBody.");
      setSelectionAtFrontmatterEnd();

      paste({
        "text/plain": "foo\nbar",
      });

      expect(_getModelData(editor!.model, { withoutSelection: true })).toBe(
        "<frontmatterContainer>" +
          "<frontmatter>" +
          "title: Titlefoo" +
          "<softBreak></softBreak>" +
          "bar" +
          "</frontmatter>" +
          "</frontmatterContainer>" +
          "<paragraph>Body.</paragraph>",
      );

      expect(editor!.getData()).toBe("---\ntitle: Titlefoo\nbar\n---\n\nBody.");
    });

    it("should keep the default paste behavior outside the frontmatter", () => {
      editor!.setData("---\ntitle: Title\n---\n\nBody.");

      editor!.model.change((writer) => {
        writer.setSelection(
          editor!.model.document.getRoot()!.getChild(1) as ModelElement,
          "end",
        );
      });

      paste({
        "text/html": "<p>foo</p><p>bar</p>",
        "text/plain": "foo\n\nbar",
      });

      expect(editor!.getData()).toBe(
        "---\ntitle: Title\n---\n\nBody.foo\n\nbar",
      );
    });
  });

  describe("schema", () => {
    let domElement: HTMLElement, editor: ClassicEditor | undefined;

    beforeEach(async () => {
      domElement = document.createElement("div");
      document.body.appendChild(domElement);

      editor = await ClassicEditor.create(domElement, {
        plugins: [
          Paragraph,
          Heading,
          BlockQuote,
          Essentials,
          Frontmatter,
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

    function getContainerElement() {
      return editor!.model.document.getRoot()!.getChild(0) as ModelElement;
    }

    function getFrontmatterElement() {
      return getContainerElement().getChild(0) as ModelElement;
    }

    it("should disallow block elements inside the frontmatter container", () => {
      editor!.setData("---\ntitle: Title\n---\n\nBody.");

      const schema = editor!.model.schema;
      const container = getContainerElement();

      expect(schema.checkChild(container, "paragraph")).toBe(false);
      expect(schema.checkChild(container, "frontmatter")).toBe(true);
    });

    it("should only allow the frontmatter container in the document root", () => {
      const schema = editor!.model.schema;

      expect(schema.checkChild(["$root"], "frontmatterContainer")).toBe(true);
      expect(
        schema.checkChild(["$root", "blockQuote"], "frontmatterContainer"),
      ).toBe(false);
    });

    it("should not allow inserting a paragraph inside the frontmatter container", () => {
      editor!.setData("---\ntitle: Title\n---\n\nBody.");

      const model = editor!.model;

      model.change((writer) => {
        const paragraph = writer.createElement("paragraph");

        writer.insertText("foo", paragraph, 0);

        model.insertContent(
          paragraph,
          model.createPositionAt(getContainerElement(), "end"),
        );
      });

      expect(_getModelData(editor!.model, { withoutSelection: true })).toBe(
        "<frontmatterContainer>" +
          "<frontmatter>title: Title</frontmatter>" +
          "</frontmatterContainer>" +
          "<paragraph>Body.</paragraph>",
      );
    });

    it("should not merge the first body paragraph into the frontmatter on backspace", () => {
      editor!.setData("---\ntitle: Title\n---\n\nBody.");

      editor!.model.change((writer) => {
        writer.setSelection(
          editor!.model.document.getRoot()!.getChild(1) as ModelElement,
          0,
        );
      });

      editor!.execute("delete");

      expect(editor!.getData()).toBe("---\ntitle: Title\n---\n\nBody.");
    });

    it("should not pull body text into the frontmatter on forward delete", () => {
      editor!.setData("---\ntitle: Title\n---\n\nBody.");

      editor!.model.change((writer) => {
        writer.setSelection(getFrontmatterElement(), "end");
      });

      editor!.execute("deleteForward");

      expect(editor!.getData()).toBe("---\ntitle: Title\n---\n\nBody.");
    });

    it("should keep select-all inside the frontmatter container", () => {
      editor!.setData("---\ntitle: Title\n---\n\nBody.");

      editor!.model.change((writer) => {
        writer.setSelection(getFrontmatterElement(), "end");
      });

      editor!.execute("selectAll");

      const range = editor!.model.document.selection.getFirstRange()!;
      const bodyParagraph = editor!.model.document
        .getRoot()!
        .getChild(1) as ModelElement;

      expect(range.containsItem(bodyParagraph)).toBe(false);
    });
  });

  describe("collapsible", () => {
    let domElement: HTMLElement, editor: ClassicEditor | undefined;

    beforeEach(async () => {
      domElement = document.createElement("div");
      document.body.appendChild(domElement);

      editor = await ClassicEditor.create(domElement, {
        plugins: [Paragraph, Heading, Essentials, Frontmatter, Markdown],
        toolbar: ["frontmatter"],
        licenseKey: "GPL",
        frontmatter: {
          collapsible: true,
        },
      });
    });

    afterEach(() => {
      domElement.remove();
      return editor?.destroy();
    });

    function getViewContainer() {
      return editor!.editing.view.document
        .getRoot()!
        .getChild(0) as ViewElement;
    }

    function getModelFrontmatter() {
      const container = editor!.model.document
        .getRoot()!
        .getChild(0) as ModelElement;

      return container.getChild(0) as ModelElement;
    }

    it("should mark the frontmatter container as collapsible", () => {
      editor!.setData("---\ntitle: Title\n---\n\nBody.");

      expect(getViewContainer().hasClass("frontmatter-collapsible")).toBe(true);
    });

    it("should mark the container while the selection is inside the focused frontmatter", () => {
      editor!.setData("---\ntitle: Title\n---\n\nBody.");

      // The default selection lands inside the frontmatter, but the editor
      // is not focused yet — the frontmatter must stay collapsed on load.
      expect(getViewContainer().hasClass("frontmatter-selected")).toBe(false);

      editor!.editing.view.document.isFocused = true;

      expect(getViewContainer().hasClass("frontmatter-selected")).toBe(true);

      editor!.model.change((writer) => {
        writer.setSelection(
          editor!.model.document.getRoot()!.getChild(1) as ModelElement,
          "end",
        );
      });

      expect(getViewContainer().hasClass("frontmatter-selected")).toBe(false);

      editor!.model.change((writer) => {
        writer.setSelection(getModelFrontmatter(), "end");
      });

      expect(getViewContainer().hasClass("frontmatter-selected")).toBe(true);

      editor!.editing.view.document.isFocused = false;

      expect(getViewContainer().hasClass("frontmatter-selected")).toBe(false);
    });

    it("should not affect the data output", () => {
      const content = "---\ntitle: Title\n---\n\nBody.";

      editor!.setData(content);

      expect(editor!.getData()).toBe(content);
    });

    it("should not mark the container when the option is disabled", async () => {
      domElement.remove();
      await editor!.destroy();

      domElement = document.createElement("div");
      document.body.appendChild(domElement);

      editor = await ClassicEditor.create(domElement, {
        plugins: [Paragraph, Heading, Essentials, Frontmatter, Markdown],
        toolbar: ["frontmatter"],
        licenseKey: "GPL",
      });

      editor.setData("---\ntitle: Title\n---\n\nBody.");

      expect(getViewContainer().hasClass("frontmatter-collapsible")).toBe(
        false,
      );

      editor.model.change((writer) => {
        writer.setSelection(getModelFrontmatter(), "end");
      });

      expect(getViewContainer().hasClass("frontmatter-selected")).toBe(false);
    });
  });

  describe("configuration", () => {
    let domElement: HTMLElement, editor: ClassicEditor | undefined;
    const fixedDate = new Date("2023-10-01T00:00:00Z");

    beforeEach(async () => {
      vi.useFakeTimers();
      vi.setSystemTime(fixedDate);

      domElement = document.createElement("div");
      document.body.appendChild(domElement);

      editor = await ClassicEditor.create(domElement, {
        plugins: [Paragraph, Heading, Essentials, Frontmatter, Markdown],
        toolbar: ["frontmatter"],
        licenseKey: "GPL",
        frontmatter: {
          defaults: new Map([
            ["title", ""],
            ["draft", "true"],
            ["date", "$currentDate"],
          ]),
        },
      });
    });

    afterEach(() => {
      vi.useRealTimers();
      domElement.remove();
      return editor?.destroy();
    });

    it("should set/get frontmatter with a predefined config", () => {
      const icon = editor.ui.componentFactory.create("frontmatter");
      icon.fire("execute");

      // The test runner has some problem with spaces comparision.
      expect(editor.getData()).toContain("title:");
      expect(editor.getData()).toContain("draft: true");
      expect(editor.getData()).toContain("date: 2023-10-01");
    });
  });
});
