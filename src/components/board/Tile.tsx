import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Tile as TileType } from '@/lib/types';

export function TileView({
	tile,
	height,
	onPress,
	onLongPress,
	dimmed = false,
	selected = false
}: {
	tile: TileType;
	height: number;
	onPress?: () => void;
	onLongPress?: () => void;
	dimmed?: boolean;
	selected?: boolean;
}) {
	const label = tile.displayText || tile.text;
	const hasImage = !!tile.image;
	const textAreaHeight = hasImage ? height * 0.25 : height;
	const fontSize = Math.max(
		9,
		Math.min(hasImage ? Math.floor(textAreaHeight * 0.55) : Math.floor(height * 0.22), 24)
	);

	return (
		<View style={[styles.wrapper, dimmed && { opacity: 0.4 }]}>
			{tile.navigation ? (
				<View
					style={[
						styles.navIndicator,
						{ backgroundColor: tile.backgroundColor, borderColor: tile.borderColor }
					]}
				/>
			) : null}
			<Pressable
				onPress={onPress}
				onLongPress={onLongPress}
				disabled={!onPress && !onLongPress}
				style={({ pressed }) => [
					styles.tile,
					{
						backgroundColor: tile.backgroundColor,
						borderColor: selected ? '#3b82f6' : tile.borderColor,
						borderWidth: selected ? 2 : 1
					},
					pressed && { opacity: 0.7 }
				]}
			>
				{hasImage ? (
					<>
						<View style={{ height: textAreaHeight, justifyContent: 'center' }}>
							<Text numberOfLines={1} style={[styles.text, { fontSize }]}>
								{label}
							</Text>
						</View>
						<Image
							source={{ uri: tile.image }}
							style={{ flex: 1, width: '100%' }}
							contentFit="contain"
							transition={100}
						/>
					</>
				) : (
					<View style={{ flex: 1, justifyContent: 'center' }}>
						<Text numberOfLines={2} style={[styles.text, { fontSize }]}>
							{label}
						</Text>
					</View>
				)}
			</Pressable>
		</View>
	);
}

const styles = StyleSheet.create({
	wrapper: { flex: 1 },
	tile: {
		flex: 1,
		borderRadius: 6,
		overflow: 'hidden',
		paddingVertical: 2
	},
	navIndicator: {
		position: 'absolute',
		top: -4,
		left: 0,
		width: '50%',
		height: 10,
		borderTopLeftRadius: 6,
		borderTopRightRadius: 6,
		borderWidth: 1,
		borderBottomWidth: 0
	},
	text: {
		textAlign: 'center',
		paddingHorizontal: 4,
		color: '#18181b',
		fontWeight: '500'
	}
});
