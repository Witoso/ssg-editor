import type { FrontmatterConfig } from "./frontmatterconfig.js";
import type FrontmatterEditing from "./frontmatterediting.js";
import type FrontmatterToolbar from "./frontmattertoolbar.js";
import type { Frontmatter } from "./index.js";
import type InsertFrontmatterCommand from "./insertfrontmattercommand.js";
import type ToggleFrontmatterCollapseCommand from "./togglefrontmattercollapsecommand.js";

declare module "@ckeditor/ckeditor5-core" {
  interface PluginsMap {
    [Frontmatter.pluginName]: Frontmatter;
    [FrontmatterEditing.pluginName]: FrontmatterEditing;
    [FrontmatterToolbar.pluginName]: FrontmatterToolbar;
  }

  interface CommandsMap {
    insertFrontmatter: InsertFrontmatterCommand;
    toggleFrontmatterCollapse: ToggleFrontmatterCollapseCommand;
  }

  interface Editor {
    setDataWithFrontmatter: (data: string) => void;
    getDataWithFrontmatter: () => string;
  }

  interface EditorConfig {
    frontmatter?: FrontmatterConfig;
  }
}
