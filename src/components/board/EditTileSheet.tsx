import { Image } from 'expo-image';
import { useState } from 'react';
import {
	ActivityIndicator,
	Alert,
	FlatList,
	Modal,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '@/lib/api';
import { uploadImageFromUrl } from '@/lib/media';
import { colors, TILE_COLOR_PRESETS } from '@/lib/theme';
import type { ImageSearchResult, SkinTone, Tile, TilePage } from '@/lib/types';
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
			<SafeAreaView style={styles.sheet} edges={['bottom']}>
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
					<ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
						<View style={styles.headerRow}>
							<Text style={styles.title}>Edit tile</Text>
							<Pressable onPress={onClose} hitSlop={8}>
								<Text style={styles.close}>✕</Text>
							</Pressable>
						</View>

						<View style={styles.preview}>
							<View style={{ width: 140, height: 110 }}>
								<TileView tile={draft} height={110} />
							</View>
						</View>

						<Text style={styles.label}>Spoken text</Text>
						<TextInput
							value={draft.text}
							onChangeText={(text) => patch({ text })}
							style={styles.input}
							placeholder="What this tile says"
							placeholderTextColor={colors.textFaint}
						/>

						<Text style={styles.label}>Display text (optional)</Text>
						<TextInput
							value={draft.displayText}
							onChangeText={(displayText) => patch({ displayText })}
							style={styles.input}
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
							<Pressable onPress={() => setView('imageSearch')} style={styles.smallButton}>
								<Text style={styles.smallButtonText}>Search images</Text>
							</Pressable>
							{draft.image ? (
								<Pressable onPress={() => patch({ image: '' })} style={styles.smallButton}>
									<Text style={[styles.smallButtonText, { color: colors.danger }]}>Remove image</Text>
								</Pressable>
							) : null}
						</View>

						<Text style={styles.label}>Links to page</Text>
						<View style={styles.swatches}>
							<Chip
								label="None"
								active={!draft.navigation}
								onPress={() => patch({ navigation: '' })}
							/>
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

						{error ? <Text style={styles.error}>{error}</Text> : null}

						<Pressable onPress={handleSave} disabled={saving} style={styles.saveButton}>
							{saving ? (
								<ActivityIndicator color="#fff" />
							) : (
								<Text style={styles.saveButtonText}>Save tile</Text>
							)}
						</Pressable>
						<Pressable onPress={handleDelete} style={styles.deleteButton}>
							<Text style={styles.deleteButtonText}>Delete tile</Text>
						</Pressable>
					</ScrollView>
				)}
			</SafeAreaView>
		</Modal>
	);
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
	return (
		<Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
			<Text style={[styles.chipText, active && { color: '#fff' }]} numberOfLines={1}>
				{label}
			</Text>
		</Pressable>
	);
}

function ImageSearchView({
	skinTone,
	initialQuery,
	onPick,
	onBack
}: {
	skinTone: SkinTone;
	initialQuery: string;
	onPick: (mediaUrl: string) => void;
	onBack: () => void;
}) {
	const [query, setQuery] = useState(initialQuery);
	const [strategy, setStrategy] = useState<'open-symbols' | 'brave'>('open-symbols');
	const [results, setResults] = useState<ImageSearchResult[] | null>(null);
	const [searching, setSearching] = useState(false);
	const [uploading, setUploading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const search = async (withStrategy = strategy) => {
		if (!query.trim()) return;
		setSearching(true);
		setError(null);
		try {
			const { results: found } = await api.media.searchImages(withStrategy, query.trim(), skinTone);
			setResults(found);
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Search failed.');
		} finally {
			setSearching(false);
		}
	};

	const pick = async (result: ImageSearchResult) => {
		setUploading(true);
		setError(null);
		try {
			// Copy the image into FreeSpeech media storage so it never breaks, like the web app.
			const url = await uploadImageFromUrl(result.image_url);
			onPick(url);
		} catch {
			setError('Could not save that image — try another one.');
		} finally {
			setUploading(false);
		}
	};

	return (
		<View style={[styles.content, { flex: 1 }]}>
			<View style={styles.headerRow}>
				<Pressable onPress={onBack} hitSlop={8}>
					<Text style={styles.close}>‹ Back</Text>
				</Pressable>
				<Text style={styles.title}>Find an image</Text>
				<View style={{ width: 50 }} />
			</View>

			<View style={{ flexDirection: 'row', gap: 8 }}>
				<TextInput
					value={query}
					onChangeText={setQuery}
					style={[styles.input, { flex: 1 }]}
					placeholder="Search…"
					placeholderTextColor={colors.textFaint}
					onSubmitEditing={() => search()}
					returnKeyType="search"
				/>
				<Pressable onPress={() => search()} style={[styles.smallButton, { justifyContent: 'center' }]}>
					<Text style={styles.smallButtonText}>Search</Text>
				</Pressable>
			</View>

			<View style={{ flexDirection: 'row', gap: 8 }}>
				<Chip
					label="Symbols"
					active={strategy === 'open-symbols'}
					onPress={() => {
						setStrategy('open-symbols');
						if (results) search('open-symbols');
					}}
				/>
				<Chip
					label="Photos"
					active={strategy === 'brave'}
					onPress={() => {
						setStrategy('brave');
						if (results) search('brave');
					}}
				/>
			</View>

			{error ? <Text style={styles.error}>{error}</Text> : null}

			{searching || uploading ? (
				<View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
					<ActivityIndicator size="large" color={colors.primary} />
					{uploading ? <Text style={{ color: colors.textMuted }}>Saving image…</Text> : null}
				</View>
			) : (
				<FlatList
					data={results ?? []}
					numColumns={3}
					keyExtractor={(item, index) => `${item.image_url}-${index}`}
					columnWrapperStyle={{ gap: 8 }}
					contentContainerStyle={{ gap: 8, paddingBottom: 24 }}
					ListEmptyComponent={
						results ? (
							<Text style={{ color: colors.textMuted, textAlign: 'center', marginTop: 24 }}>
								No results found.
							</Text>
						) : null
					}
					renderItem={({ item }) => (
						<Pressable onPress={() => pick(item)} style={styles.resultCell}>
							<Image
								source={{ uri: item.thumbnail_url }}
								style={{ flex: 1 }}
								contentFit="contain"
								transition={100}
							/>
						</Pressable>
					)}
				/>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	sheet: { flex: 1, backgroundColor: colors.background },
	content: { padding: 20, gap: 10 },
	headerRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginBottom: 6
	},
	title: { fontSize: 20, fontWeight: '800', color: colors.text },
	close: { fontSize: 18, color: colors.textMuted, fontWeight: '600' },
	preview: { alignItems: 'center', paddingVertical: 8 },
	label: { fontSize: 14, fontWeight: '600', color: colors.textMuted, marginTop: 8 },
	input: {
		backgroundColor: colors.surface,
		borderWidth: 1,
		borderColor: colors.border,
		borderRadius: 10,
		paddingVertical: 10,
		paddingHorizontal: 14,
		fontSize: 16,
		color: colors.text
	},
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
	chip: {
		paddingVertical: 8,
		paddingHorizontal: 14,
		borderRadius: 999,
		backgroundColor: colors.surface,
		borderWidth: 1,
		borderColor: colors.border,
		maxWidth: 180
	},
	chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
	chipText: { color: colors.text, fontSize: 14, fontWeight: '500' },
	smallButton: {
		paddingVertical: 10,
		paddingHorizontal: 14,
		borderRadius: 10,
		backgroundColor: colors.surface,
		borderWidth: 1,
		borderColor: colors.border
	},
	smallButtonText: { color: colors.text, fontSize: 14, fontWeight: '600' },
	error: { color: colors.danger, fontSize: 14, marginTop: 6 },
	saveButton: {
		marginTop: 16,
		backgroundColor: colors.primary,
		borderRadius: 10,
		paddingVertical: 14,
		alignItems: 'center'
	},
	saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
	deleteButton: { paddingVertical: 12, alignItems: 'center' },
	deleteButtonText: { color: colors.danger, fontSize: 15, fontWeight: '600' },
	resultCell: {
		flex: 1 / 3,
		aspectRatio: 1,
		backgroundColor: colors.surface,
		borderRadius: 8,
		borderWidth: 1,
		borderColor: colors.border,
		overflow: 'hidden'
	}
});
