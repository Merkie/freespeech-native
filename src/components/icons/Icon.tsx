import Svg, { Path } from 'react-native-svg';
import { ICON_PATHS, type IconName } from './icon-paths';

export type { IconName };

/** Bootstrap Icon rendered as an inline SVG — same glyphs as the web app's `bi bi-*` classes. */
export function Icon({ name, size = 20, color = '#000' }: { name: IconName; size?: number; color?: string }) {
	return (
		<Svg width={size} height={size} viewBox="0 0 16 16">
			{ICON_PATHS[name].map((p, i) => (
				<Path
					key={i}
					d={p.d}
					fill={color}
					fillRule={'evenodd' in p && p.evenodd ? 'evenodd' : 'nonzero'}
				/>
			))}
		</Svg>
	);
}
