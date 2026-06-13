import { Plugin, type PluginDependencies } from "ckeditor5";
import FrontmatterEditing from "./frontmatterediting.js";
import FrontmatterUI from "./frontmatterui.js";

export default class Frontmatter extends Plugin {
  public static get pluginName(): "Frontmatter" {
    return "Frontmatter" as const;
  }

  public static get requires(): PluginDependencies {
    return ["Markdown", FrontmatterEditing, FrontmatterUI] as const;
  }
}
