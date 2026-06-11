import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/lib/theme';
import type { Tile } from '@/lib/types';
import { TileView } from './Tile';

const GAP = 8;
const PADDING = 8;

/** One subpage: a columns×rows grid of absolutely positioned tiles. */
export function TileGridPage({
	tiles,
	columns,
	rows,
	width,
	height,
	subpage,
	editing,
	selectedTileId,
	onTilePress,
	onAddTile
}: {
	tiles: Tile[];
	columns: number;
	rows: number;
	width: number;
	height: number;
	subpage: number;
	editing: boolean;
	selectedTileId: string | null;
	onTilePress: (tile: Tile) => void;
	onAddTile: (x: number, y: number, subpage: number) => void;
}) {
	const cellWidth = (width - PADDING * 2 - GAP * (columns - 1)) / columns;
	const cellHeight = (height - PADDING * 2 - GAP * (rows - 1)) / rows;

	const cellStyle = (x: number, y: number) => ({
		position: 'absolute' as const,
		left: PADDING + x * (cellWidth + GAP),
		top: PADDING + y * (cellHeight + GAP),
		width: cellWidth,
		height: cellHeight
	});

	const usedCoords = new Set(tiles.map((tile) => `${tile.x},${tile.y}`));
	const emptyCoords: { x: number; y: number }[] = [];
	if (editing) {
		for (let y = 0; y < rows; y++) {
			for (let x = 0; x < columns; x++) {
				if (!usedCoords.has(`${x},${y}`)) emptyCoords.push({ x, y });
			}
		}
	}

	return (
		<View
			style={{
				width,
				height,
				backgroundColor: subpage % 2 === 0 ? colors.background : colors.backgroundAlt
			}}
		>
			{tiles.map((tile) => (
				<View key={tile.id} style={cellStyle(tile.x, tile.y)}>
					<TileView
						tile={tile}
						height={cellHeight}
						onPress={() => onTilePress(tile)}
						dimmed={editing && !!selectedTileId && selectedTileId !== tile.id}
						selected={editing && selectedTileId === tile.id}
					/>
				</View>
			))}

			{emptyCoords.map(({ x, y }) => (
				<Pressable
					key={`${x},${y}`}
					onPress={() => onAddTile(x, y, subpage)}
					style={({ pressed }) => [styles.addButton, cellStyle(x, y), pressed && { opacity: 0.6 }]}
				>
					<Text style={styles.addButtonText}>＋</Text>
				</Pressable>
			))}
		</View>
	);
}

const styles = StyleSheet.create({
	addButton: {
		borderRadius: 6,
		borderWidth: 1,
		borderStyle: 'dashed',
		borderColor: colors.textFaint,
		alignItems: 'center',
		justifyContent: 'center'
	},
	addButtonText: {
		fontSize: 24,
		color: colors.textFaint
	}
});
