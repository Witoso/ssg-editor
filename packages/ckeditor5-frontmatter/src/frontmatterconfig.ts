export type FrontmatterConfig = {
  /**
   * Fields prefilled when the frontmatter is inserted from the toolbar.
   * The `'$currentDate'` value is replaced with the current date.
   */
  defaults?: FrontmatterDefaults;
};

export type FrontmatterDefaults = Map<string, FrontmatterConfigValue>;

type FrontmatterConfigValue = "$currentDate" | string;
