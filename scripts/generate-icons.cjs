// Extracts the Bootstrap Icons used by the app into src/components/icons/icon-paths.ts.
// The web app loads bootstrap-icons from CDN; the native app inlines the same SVG paths.
// Add icon names to NAMES and run: node scripts/generate-icons.cjs
const fs = require('fs');
const path = require('path');

const NAMES = [
	'arrow-left',
	'arrow-left-short',
	'arrow-right',
	'arrow-right-short',
	'arrow-repeat',
	'box-arrow-in-right',
	'check',
	'check-lg',
	'chevron-down',
	'clipboard',
	'download',
	'envelope',
	'eraser-fill',
	'gear',
	'gear-fill',
	'google',
	'grid',
	'grid-fill',
	'house-fill',
	'image',
	'lock-fill',
	'palette-fill',
	'pencil',
	'pencil-fill',
	'people-fill',
	'plus-lg',
	'search',
	'sliders',
	'trash',
	'trash-fill',
	'upload',
	'volume-up',
	'volume-up-fill',
	'x-lg'
];

const dir = path.join(__dirname, '..', 'node_modules', 'bootstrap-icons', 'icons');
const out = {};
for (const name of NAMES) {
	const svg = fs.readFileSync(path.join(dir, `${name}.svg`), 'utf8');
	const paths = [...svg.matchAll(/<path[^>]*\sd="([^"]+)"[^>]*\/?>/g)].map((m) => ({
		d: m[1],
		evenodd: /fill-rule="evenodd"/.test(m[0])
	}));
	if (!paths.length) throw new Error(`no paths in ${name}`);
	out[name] = paths;
}

const version = require('bootstrap-icons/package.json').version;
let ts = `// Generated from bootstrap-icons ${version} — the same icon set the FreeSpeech web app loads from CDN.\n`;
ts += '// Regenerate with scripts/generate-icons.cjs after adding names there.\n\n';
ts += 'export type IconPath = { d: string; evenodd?: boolean };\n\n';
ts += 'export const ICON_PATHS = {\n';
for (const [name, paths] of Object.entries(out)) {
	ts += `\t${JSON.stringify(name)}: [\n`;
	for (const p of paths) {
		ts += `\t\t{ d: ${JSON.stringify(p.d)}${p.evenodd ? ', evenodd: true' : ''} },\n`;
	}
	ts += '\t],\n';
}
ts += '} as const satisfies Record<string, readonly IconPath[]>;\n\n';
ts += 'export type IconName = keyof typeof ICON_PATHS;\n';

const dest = path.join(__dirname, '..', 'src', 'components', 'icons', 'icon-paths.ts');
fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.writeFileSync(dest, ts);
console.log(`wrote ${Object.keys(out).length} icons to ${path.relative(process.cwd(), dest)}`);
