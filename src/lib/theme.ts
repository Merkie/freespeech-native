/** Zinc palette matching the web app's Tailwind styling. */
export const colors = {
	background: '#f4f4f5', // zinc-100
	backgroundAlt: '#e4e4e7', // zinc-200
	surface: '#ffffff',
	border: '#d4d4d8', // zinc-300
	text: '#18181b', // zinc-900
	textMuted: '#71717a', // zinc-500
	textFaint: '#a1a1aa', // zinc-400
	primary: '#3b82f6', // blue-500
	primaryDark: '#2563eb', // blue-600
	danger: '#ef4444', // red-500
	dark: '#18181b', // zinc-900 (edit panel bg on web)
	darkBorder: '#27272a' // zinc-800
};

/** Tile color presets from the web EditTilePanel. */
export const TILE_COLOR_PRESETS = [
	{ name: 'white', backgroundColor: '#fafafa', borderColor: '#71717a' },
	{ name: 'purple', backgroundColor: '#f3e8ff', borderColor: '#a855f7' },
	{ name: 'yellow', backgroundColor: '#fef9c3', borderColor: '#eab308' },
	{ name: 'pink', backgroundColor: '#fce7f3', borderColor: '#ec4899' },
	{ name: 'green', backgroundColor: '#dcfce7', borderColor: '#22c55e' },
	{ name: 'blue', backgroundColor: '#dbeafe', borderColor: '#3b82f6' },
	{ name: 'orange', backgroundColor: '#ffedd5', borderColor: '#f97316' },
	{ name: 'red', backgroundColor: '#fee2e2', borderColor: '#ef4444' }
];
