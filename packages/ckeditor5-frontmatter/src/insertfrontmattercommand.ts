import { type Editor, Command, type ModelWriter } from "ckeditor5";
import type {
  FrontmatterConfig,
  FrontmatterDefaults,
} from "./frontmatterconfig.js";

export default class InsertFrontmatterCommand extends Command {
  declare public value: boolean;

  declare public frontmatterLoaded: boolean;

  private _frontmatterConfig: FrontmatterConfig | undefined;

  constructor(
    editor: Editor,
    frontmatterConfig: FrontmatterConfig | undefined,
  ) {
    super(editor);
    this._frontmatterConfig = frontmatterConfig;

    const frontmatterEditing = editor.plugins.get("FrontmatterEditing");

    this.bind("frontmatterLoaded").to(frontmatterEditing, "frontmatterLoaded");
  }

  public override execute(): void {
    const root = this.editor.model.document.getRoot();

    if (!root) {
      return;
    }

    this.editor.model.change((writer) => {
      // Create a position at the start of the document
      const startPosition = writer.createPositionAt(root, 0);
      const frontmatterContainer = this._createFrontmatter(writer);

      this.editor.model.insertContent(frontmatterContainer, startPosition);
      // If there's a paragraph with a placeholder, and we insert frontmatter, frontmatter hijacks it.
      this.editor.editing.view.document.getRoot("main")!.placeholder = "";
    });
  }

  public override refresh(): void {
    const model = this.editor.model;
    const selection = model.document.selection;

    let allowedIn = null;
    const firstPosition = selection.getFirstPosition();

    if (firstPosition) {
      allowedIn = model.schema.findAllowedParent(
        firstPosition,
        "frontmatterContainer",
      );
    }

    const allowed = allowedIn !== null;
    this.isEnabled = allowed && !this.frontmatterLoaded;
  }

  private _createFrontmatter(writer: ModelWriter) {
    const frontmatterContainer = writer.createElement("frontmatterContainer");

    const frontmatter = writer.createElement("frontmatter");

    const defaults = this._frontmatterConfig?.defaults;

    if (defaults) {
      const config = this._processConfig(defaults);
      config.forEach((item, index) => {
        writer.appendText(item, frontmatter);

        // Add a soft break only if it's not the last item
        if (index < config.length - 1) {
          writer.appendElement("softBreak", frontmatter);
        }
      });
    }

    writer.append(frontmatter, frontmatterContainer);

    return frontmatterContainer;
  }

  private _processConfig(defaults: FrontmatterDefaults) {
    const config = [];
    for (const [key, rawValue] of defaults) {
      const value =
        rawValue === "$currentDate" ? this._getCurrentDate() : rawValue;

      config.push(`${key}: ${value}`);
    }

    return config;
  }

  private _getCurrentDate() {
    let date = new Date();
    const offset = date.getTimezoneOffset();
    date = new Date(date.getTime() - offset * 60 * 1000);
    return date.toISOString().split("T")[0];
  }
}
