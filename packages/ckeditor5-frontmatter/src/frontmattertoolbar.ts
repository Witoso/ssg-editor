import { Plugin, WidgetToolbarRepository } from "ckeditor5";
import ToggleFrontmatterCollapseCommand from "./togglefrontmattercollapsecommand.js";

import "../theme/frontmatter.css";

export default class FrontmatterToolbar extends Plugin {
  public static get pluginName() {
    return "FrontmatterToolbar" as const;
  }

  public static get requires() {
    return [WidgetToolbarRepository] as const;
  }

  public init(): void {
    const editor = this.editor;

    editor.model.schema.extend("frontmatterContainer", {
      allowAttributes: "collapsed",
    });

    this._defineCollapseDowncast();

    editor.commands.add(
      "toggleFrontmatterCollapse",
      new ToggleFrontmatterCollapseCommand(editor),
    );
  }

  // The `collapsed` model attribute is editing-only (never serialized to
  // markdown). It is treated as an override: absent or `true` renders collapsed,
  // only `false` renders expanded — so "collapsed by default" needs no model
  // writes on load.
  private _defineCollapseDowncast(): void {
    this.editor.conversion.for("editingDowncast").add((dispatcher) => {
      // Default collapsed: the attribute is absent on load, so add the class
      // when the widget view element is first created (low priority runs after
      // the element converter has created and mapped the view element).
      dispatcher.on(
        "insert:frontmatterContainer",
        (_evt, data, conversionApi) => {
          const viewElement = conversionApi.mapper.toViewElement(data.item)!;

          conversionApi.writer.addClass("frontmatter-collapsed", viewElement);
        },
        { priority: "low" },
      );

      dispatcher.on(
        "attribute:collapsed:frontmatterContainer",
        (_evt, data, conversionApi) => {
          const viewElement = conversionApi.mapper.toViewElement(data.item)!;

          if (data.attributeNewValue === false) {
            conversionApi.writer.removeClass(
              "frontmatter-collapsed",
              viewElement,
            );
          } else {
            conversionApi.writer.addClass("frontmatter-collapsed", viewElement);
          }
        },
      );
    });
  }
}
