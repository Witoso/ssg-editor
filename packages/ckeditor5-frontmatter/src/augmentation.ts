import type { FrontmatterConfig } from './frontmatterconfig.js';
import type FrontmatterEditing from './frontmatterediting.js';
import type { Frontmatter } from './index.js';
import type InsertFrontmatterCommand from './insertfrontmattercommand.js';

declare module '@ckeditor/ckeditor5-core' {
	interface PluginsMap {
		[Frontmatter.pluginName]: Frontmatter;
		[FrontmatterEditing.pluginName]: FrontmatterEditing;
	}

	interface CommandsMap {
		insertFrontmatter: InsertFrontmatterCommand;
	}

	interface Editor {
		setDataWithFrontmatter: ( data: string ) => void;
		getDataWithFrontmatter: () => string;
	}

	interface EditorConfig {
		frontmatter?: FrontmatterConfig;
	}
}
