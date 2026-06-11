import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Icon } from '@/components/icons/Icon';
import { colors } from '@/lib/theme';
import type { Tile } from '@/lib/types';
import { TileView } from './Tile';

export function SentenceBar({
	sentence,
	synthesizing,
	copyEnabled,
	onRemove,
	onSpeak,
	onClear
}: {
	sentence: Tile[];
	synthesizing: boolean;
	copyEnabled: boolean;
	onRemove: (index: number) => void;
	onSpeak: () => void;
	onClear: () => void;
}) {
	const [copied, setCopied] = useState(false);

	const handleCopy = async () => {
		await Clipboard.setStringAsync(sentence.map((tile) => tile.text).join(' '));
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	return (
		<View style={styles.bar}>
			<ScrollView
				horizontal
				showsHorizontalScrollIndicator={false}
				contentContainerStyle={styles.tiles}
				style={{ flex: 1 }}
			>
				{sentence.map((tile, index) => (
					<Pressable key={`${tile.id}-${index}`} onPress={() => onRemove(index)} style={styles.sentenceTile}>
						<TileView tile={tile} height={70} width={100} />
					</Pressable>
				))}
			</ScrollView>

			<View style={styles.actions}>
				{copyEnabled ? (
					<Pressable
						onPress={handleCopy}
						style={[styles.actionButton, { backgroundColor: copied ? '#4ade80' : '#22c55e' }]}
					>
						{/* Mirrors the web sentence bar: a check appears over the clipboard while "copied". */}
						<View>
							<Icon name="clipboard" size={28} color="#fff" />
							{copied ? (
								<View style={styles.copiedCheck}>
									<Icon name="check" size={24} color="#fff" />
								</View>
							) : null}
						</View>
					</Pressable>
				) : null}

				<Pressable
					onPress={onSpeak}
					disabled={synthesizing || sentence.length === 0}
					style={[styles.actionButton, { backgroundColor: colors.primary }]}
				>
					{synthesizing ? <ActivityIndicator color="#fff" /> : <Icon name="volume-up-fill" size={30} color="#fff" />}
				</Pressable>

				<Pressable
					onPress={onClear}
					disabled={sentence.length === 0}
					style={[styles.actionButton, { backgroundColor: colors.danger }]}
				>
					<Icon name="trash-fill" size={26} color="#fff" />
				</Pressable>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	bar: {
		minHeight: 96,
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
		padding: 8,
		backgroundColor: '#fafafa',
		borderBottomWidth: 1,
		borderBottomColor: colors.backgroundAlt
	},
	tiles: {
		alignItems: 'center',
		gap: 8
	},
	sentenceTile: {
		width: 100,
		height: 70
	},
	actions: {
		flexDirection: 'row',
		gap: 8
	},
	actionButton: {
		width: 64,
		height: 64,
		borderRadius: 10,
		alignItems: 'center',
		justifyContent: 'center'
	},
	copiedCheck: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		alignItems: 'center',
		justifyContent: 'center'
	}
});
