import { Command, type ModelElement } from "ckeditor5";

export default class ToggleFrontmatterCollapseCommand extends Command {
  declare public value: boolean;

  public override refresh(): void {
    const container = this._getFrontmatterContainer();

    this.isEnabled = !!container;
    this.value = container
      ? container.getAttribute("collapsed") !== false
      : false;
  }

  public override execute(): void {
    const container = this._getFrontmatterContainer();

    if (!container) {
      return;
    }

    this.editor.model.change((writer) => {
      writer.setAttribute("collapsed", !this.value, container);
    });
  }

  private _getFrontmatterContainer(): ModelElement | null {
    const root = this.editor.model.document.getRoot()!;

    for (const child of root.getChildren()) {
      if (child.is("element", "frontmatterContainer")) {
        return child;
      }
    }

    return null;
  }
}
