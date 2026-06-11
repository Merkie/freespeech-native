import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
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
						<TileView tile={tile} height={70} />
					</Pressable>
				))}
			</ScrollView>

			<View style={styles.actions}>
				{copyEnabled ? (
					<Pressable
						onPress={handleCopy}
						style={[styles.actionButton, { backgroundColor: copied ? '#4ade80' : '#22c55e' }]}
					>
						<Text style={styles.actionText}>{copied ? '✓' : '⧉'}</Text>
					</Pressable>
				) : null}

				<Pressable
					onPress={onSpeak}
					disabled={synthesizing || sentence.length === 0}
					style={[styles.actionButton, { backgroundColor: colors.primary }]}
				>
					{synthesizing ? <ActivityIndicator color="#fff" /> : <Text style={styles.actionText}>🔊</Text>}
				</Pressable>

				<Pressable
					onPress={onClear}
					disabled={sentence.length === 0}
					style={[styles.actionButton, { backgroundColor: colors.danger }]}
				>
					<Text style={styles.actionText}>🗑</Text>
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
	actionText: {
		fontSize: 26,
		color: '#fff'
	}
});
