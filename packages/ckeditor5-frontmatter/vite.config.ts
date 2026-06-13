import { resolve, isAbsolute, extname } from 'node:path';
import { defineConfig, mergeConfig, type ViteUserConfig } from 'vitest/config';
import { translations } from '@ckeditor/ckeditor5-dev-build-tools';
import { webdriverio } from '@vitest/browser-webdriverio';
import svg from 'vite-plugin-svgo';
import pkgJson from './package.json' with { type: 'json' };

export default defineConfig( ( { mode } ) => {
	const entry = resolve( import.meta.dirname, 'src/index.ts' );

	function externals( externalPackages: Record<string, string> ): ( id: string ) => boolean {
		const externals = Object.keys( externalPackages );
		const extensions = [ '.ts', '.mts', '.mjs', '.js', '.json', '.node' ];

		return ( id: string ) => {
			if ( id.startsWith( '.' ) || isAbsolute( id ) ) {
				return false;
			}

			if ( externals.includes( id ) ) {
				return true;
			}

			const packageName = id
				.split( '/' )
				.slice( 0, id.startsWith( '@' ) ? 2 : 1 )
				.join( '/' );

			const extension = extname( id );

			return externals.includes( packageName ) && ( !extension || extensions.includes( extension ) );
		};
	}

	const sharedConfig: ViteUserConfig = {
		root: resolve( import.meta.dirname, 'sample' ),
		plugins: [
			svg()
		],
		build: {
			emptyOutDir: false,
			target: 'es2022'
		},
		test: {
			dir: resolve( import.meta.dirname ),
			include: [
				'tests/**/*.[jt]s'
			],
			browser: {
				enabled: true,
				instances: [
					{ browser: 'chrome' }
				],
				provider: webdriverio(),
				headless: true,
				ui: false
			},
			globals: true,
			watch: false,
			coverage: {
				allowExternal: true,
				thresholds: {
					lines: 100,
					functions: 100,
					branches: 100,
					statements: 100
				},
				provider: 'istanbul',
				include: [
					'src/**/*.[jt]s'
				]
			}
		}
	};

	const npmConfig: ViteUserConfig = {
		plugins: [
			translations( {
				source: '**/*.po'
			} )
		],
		build: {
			minify: false,
			outDir: resolve( import.meta.dirname, 'dist' ),
			lib: {
				entry,
				formats: [ 'es' ],
				cssFileName: 'index',
				fileName: ( format: string, name: string ) => name + '.js'
			},
			rolldownOptions: {
				external: externals( {
					...pkgJson.dependencies,
					...pkgJson.peerDependencies
				} )
			}
		}
	};

	const browserConfig: ViteUserConfig = {
		build: {
			minify: 'terser',
			outDir: resolve( import.meta.dirname, 'dist/browser' ),
			lib: {
				entry,
				name: 'CKEditor5Frontmatter',
				formats: [ 'es', 'umd' ],
				cssFileName: 'index',
				fileName: ( format: string, name: string ) => name + '.' + format + '.js'
			},
			rolldownOptions: {
				external: externals( pkgJson.peerDependencies ),
				output: {
					codeSplitting: false,
					globals: {
						'@ckeditor/ckeditor5-core': 'CKEDITOR.Core',
						ckeditor5: 'CKEDITOR'
					}
				}
			}
		}
	};

	const BUILD_SETTINGS: Record<string, ViteUserConfig> = {
		npm: npmConfig,
		browser: browserConfig
	};

	return mergeConfig(
		sharedConfig,
		BUILD_SETTINGS[ mode ] || {}
	);
} );
