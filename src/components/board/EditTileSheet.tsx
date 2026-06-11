import { useState } from 'react';
import {
	ActivityIndicator,
	Alert,
	Modal,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '@/components/icons/Icon';
import { Chip, SheetHeader } from '@/components/ui';
import api from '@/lib/api';
import { colors, TILE_COLOR_PRESETS } from '@/lib/theme';
import type { SkinTone, Tile, TilePage } from '@/lib/types';
import { ImageSearchView } from './ImageSearchView';
import { sheetStyles } from './sheet-styles';
import { TileView } from './Tile';

export function EditTileSheet({
	tile,
	pages,
	skinTone,
	onSave,
	onDelete,
	onClose
}: {
	tile: Tile;
	pages: TilePage[];
	skinTone: SkinTone;
	onSave: (tile: Tile) => void;
	onDelete: (tileId: string) => void;
	onClose: () => void;
}) {
	const [draft, setDraft] = useState<Tile>({ ...tile });
	const [view, setView] = useState<'edit' | 'imageSearch'>('edit');
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const patch = (changes: Partial<Tile>) => setDraft((prev) => ({ ...prev, ...changes }));

	const handleSave = async () => {
		setSaving(true);
		setError(null);
		try {
			await api.tile.edit(draft.id, {
				x: draft.x,
				y: draft.y,
				page: draft.page,
				text: draft.text,
				displayText: draft.displayText,
				backgroundColor: draft.backgroundColor,
				borderColor: draft.borderColor,
				image: draft.image,
				navigation: draft.navigation
			});
			onSave(draft);
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Failed to save tile.');
		} finally {
			setSaving(false);
		}
	};

	const handleDelete = () => {
		Alert.alert('Delete tile', `Delete "${draft.displayText || draft.text}"?`, [
			{ text: 'Cancel', style: 'cancel' },
			{
				text: 'Delete',
				style: 'destructive',
				onPress: async () => {
					try {
						await api.tile.delete(draft.id);
						onDelete(draft.id);
					} catch (e) {
						setError(e instanceof Error ? e.message : 'Failed to delete tile.');
					}
				}
			}
		]);
	};

	return (
		<Modal visible animationType="slide" presentationStyle="formSheet" onRequestClose={onClose}>
			<SafeAreaView style={sheetStyles.sheet} edges={['bottom']}>
				{view === 'imageSearch' ? (
					<ImageSearchView
						skinTone={skinTone}
						initialQuery={draft.text}
						onPick={(url) => {
							patch({ image: url });
							setView('edit');
						}}
						onBack={() => setView('edit')}
					/>
				) : (
					<ScrollView
						style={{ flex: 1 }}
						contentContainerStyle={[sheetStyles.content, { paddingBottom: 40 }]}
						keyboardShouldPersistTaps="handled"
						automaticallyAdjustKeyboardInsets
					>
						<SheetHeader title="Edit tile" onClose={onClose} />

						<View style={styles.preview}>
							<View style={{ width: 140, height: 110 }}>
								<TileView tile={draft} height={110} width={140} />
							</View>
						</View>

						<Text style={styles.label}>Spoken text</Text>
						<TextInput
							value={draft.text}
							onChangeText={(text) => patch({ text })}
							style={sheetStyles.input}
							placeholder="What this tile says"
							placeholderTextColor={colors.textFaint}
						/>

						<Text style={styles.label}>Display text (optional)</Text>
						<TextInput
							value={draft.displayText}
							onChangeText={(displayText) => patch({ displayText })}
							style={sheetStyles.input}
							placeholder="Shown on the tile if different"
							placeholderTextColor={colors.textFaint}
						/>

						<Text style={styles.label}>Color</Text>
						<View style={styles.swatches}>
							{TILE_COLOR_PRESETS.map((preset) => {
								const active =
									draft.backgroundColor === preset.backgroundColor &&
									draft.borderColor === preset.borderColor;
								return (
									<Pressable
										key={preset.name}
										onPress={() =>
											patch({
												backgroundColor: preset.backgroundColor,
												borderColor: preset.borderColor
											})
										}
										style={[
											styles.swatch,
											{ backgroundColor: preset.backgroundColor, borderColor: preset.borderColor },
											active && styles.swatchActive
										]}
									/>
								);
							})}
						</View>

						<Text style={styles.label}>Image</Text>
						<View style={{ flexDirection: 'row', gap: 10 }}>
							<Pressable onPress={() => setView('imageSearch')} style={sheetStyles.smallButton}>
								<Icon name="search" size={14} color={colors.text} />
								<Text style={sheetStyles.smallButtonText}>Search images</Text>
							</Pressable>
							{draft.image ? (
								<Pressable onPress={() => patch({ image: '' })} style={sheetStyles.smallButton}>
									<Icon name="eraser-fill" size={14} color={colors.danger} />
									<Text style={[sheetStyles.smallButtonText, { color: colors.danger }]}>
										Remove image
									</Text>
								</Pressable>
							) : null}
						</View>

						<Text style={styles.label}>Links to page</Text>
						<View style={styles.swatches}>
							<Chip label="None" active={!draft.navigation} onPress={() => patch({ navigation: '' })} />
							{pages
								.filter((page) => page.id !== draft.tilePageId)
								.map((page) => (
									<Chip
										key={page.id}
										label={page.name}
										active={draft.navigation === page.id}
										onPress={() => patch({ navigation: page.id })}
									/>
								))}
						</View>

						{error ? <Text style={sheetStyles.error}>{error}</Text> : null}

						<Pressable onPress={handleSave} disabled={saving} style={styles.saveButton}>
							{saving ? (
								<ActivityIndicator color="#fff" />
							) : (
								<View style={sheetStyles.buttonRow}>
									<Icon name="check-lg" size={16} color="#fff" />
									<Text style={styles.saveButtonText}>Save tile</Text>
								</View>
							)}
						</Pressable>
						<Pressable onPress={handleDelete} style={styles.deleteButton}>
							<View style={sheetStyles.buttonRow}>
								<Icon name="trash-fill" size={14} color={colors.danger} />
								<Text style={styles.deleteButtonText}>Delete tile</Text>
							</View>
						</Pressable>
					</ScrollView>
				)}
			</SafeAreaView>
		</Modal>
	);
}

const styles = StyleSheet.create({
	preview: { alignItems: 'center', paddingVertical: 8 },
	label: { fontSize: 14, fontWeight: '600', color: colors.textMuted, marginTop: 8 },
	swatches: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
	swatch: {
		width: 44,
		height: 44,
		borderRadius: 8,
		borderWidth: 2
	},
	swatchActive: {
		transform: [{ scale: 1.1 }],
		shadowColor: '#000',
		shadowOpacity: 0.25,
		shadowRadius: 4,
		shadowOffset: { width: 0, height: 2 },
		elevation: 3
	},
	saveButton: {
		marginTop: 16,
		backgroundColor: colors.primary,
		borderRadius: 10,
		paddingVertical: 14,
		alignItems: 'center'
	},
	saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
	deleteButton: { paddingVertical: 12, alignItems: 'center' },
	deleteButtonText: { color: colors.danger, fontSize: 15, fontWeight: '600' }
});
