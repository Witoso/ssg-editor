export type FrontmatterConfig = {
  /**
   * Fields prefilled when the frontmatter is inserted from the toolbar.
   * The `'$currentDate'` value is replaced with the current date.
   */
  defaults?: FrontmatterDefaults;

  /**
   * When `true`, the frontmatter is collapsed in the editing view and only shows
   * its full content while hovered or while the selection is inside it.
   */
  collapsible?: boolean;
};

export type FrontmatterDefaults = Map<string, FrontmatterConfigValue>;

type FrontmatterConfigValue = "$currentDate" | string;
