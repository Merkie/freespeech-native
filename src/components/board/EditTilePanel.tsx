import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRef, useState } from 'react';
import {
	ActionSheetIOS,
	ActivityIndicator,
	Alert,
	findNodeHandle,
	Modal,
	Platform,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	View
} from 'react-native';
import Svg, { Defs, Pattern, Rect } from 'react-native-svg';
import { Icon } from '@/components/icons/Icon';
import api from '@/lib/api';
import { uploadImageFromDevice } from '@/lib/media';
import { TILE_COLOR_PRESETS } from '@/lib/theme';
import type { Tile, TilePage } from '@/lib/types';
import { ImageSearchView } from './ImageSearchView';

/**
 * The web app's right-docked tile editor (EditTilePanel.svelte): a 350px
 * dark panel rendered beside the grid while a tile is selected in edit mode.
 */
export function EditTilePanel({
	tile,
	pages,
	onSave,
	onDelete
}: {
	tile: Tile;
	pages: TilePage[];
	onSave: (tile: Tile) => void;
	onDelete: (tileId: string) => void;
}) {
	const [draft, setDraft] = useState<Tile>({ ...tile });
	const [view, setView] = useState<'edit' | 'imageSearch'>('edit');
	const [showingDisplayText, setShowingDisplayText] = useState(false);
	const [navigationOpen, setNavigationOpen] = useState(false);
	const [saving, setSaving] = useState(false);
	const [uploading, setUploading] = useState(false);
	const [removingBackground, setRemovingBackground] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const patch = (changes: Partial<Tile>) => setDraft((prev) => ({ ...prev, ...changes }));

	// Like the web's $UnsavedChanges store: compare the draft to the tile on the board.
	const unsavedChanges =
		draft.text !== tile.text ||
		draft.displayText !== tile.displayText ||
		draft.image !== tile.image ||
		draft.backgroundColor !== tile.backgroundColor ||
		draft.borderColor !== tile.borderColor ||
		draft.navigation !== tile.navigation;

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

	const handleUploadFromDevice = async () => {
		const picked = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'] });
		const asset = picked.assets?.[0];
		if (!asset) return;
		setUploading(true);
		setError(null);
		try {
			const url = await uploadImageFromDevice(
				asset.uri,
				asset.fileName ?? 'image.jpg',
				asset.mimeType
			);
			patch({ image: url });
		} catch {
			setError('Could not upload that image — try another one.');
		} finally {
			setUploading(false);
		}
	};

	const handleRemoveBackground = async () => {
		if (!draft.image) return;
		setRemovingBackground(true);
		setError(null);
		try {
			const { image_url } = await api.media.removeBackground(draft.image);
			patch({ image: image_url });
		} catch {
			setError('Background removal failed — try again.');
		} finally {
			setRemovingBackground(false);
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

	const navigationLabel = draft.navigation
		? (pages.find((page) => page.id === draft.navigation)?.name ?? 'No Navigation')
		: 'No Navigation';

	const selectRef = useRef<View>(null);

	const openNavigationPicker = () => {
		if (Platform.OS !== 'ios') {
			setNavigationOpen(true);
			return;
		}
		// Native sheet — anchored to the select, so it presents as a popover on iPad.
		const options = ['No Navigation', ...pages.map((page) => page.name), 'Cancel'];
		ActionSheetIOS.showActionSheetWithOptions(
			{
				options,
				cancelButtonIndex: options.length - 1,
				anchor: findNodeHandle(selectRef.current) ?? undefined
			},
			(index) => {
				if (index === options.length - 1) return;
				patch({ navigation: index === 0 ? '' : pages[index - 1].id });
			}
		);
	};

	return (
		<View style={styles.panel}>
			{view === 'imageSearch' ? (
				<ImageSearchView
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
					contentContainerStyle={styles.content}
					keyboardShouldPersistTaps="handled"
					automaticallyAdjustKeyboardInsets
				>
					<Text style={styles.label}>Tile Text:</Text>
					<TextInput
						value={draft.text}
						onChangeText={(text) => patch({ text })}
						style={styles.input}
					/>

					{showingDisplayText || draft.displayText ? (
						<>
							<Text style={[styles.label, { marginTop: 8 }]}>Tile Display Text:</Text>
							<TextInput
								value={draft.displayText}
								onChangeText={(displayText) => patch({ displayText })}
								style={styles.input}
							/>
						</>
					) : (
						<Pressable onPress={() => setShowingDisplayText(true)} hitSlop={4}>
							<Text style={styles.linkText}>Edit display text separately</Text>
						</Pressable>
					)}

					<Text style={[styles.label, styles.sectionGap]}>Image:</Text>
					{draft.image ? (
						<View style={{ gap: 8 }}>
							<View style={styles.imageBox}>
								<CheckerboardBackground />
								<Image
									source={{ uri: draft.image }}
									style={styles.imagePreview}
									contentFit="contain"
									transition={100}
								/>
							</View>
							<View style={{ flexDirection: 'row', gap: 8 }}>
								<Pressable
									onPress={handleRemoveBackground}
									disabled={removingBackground}
									style={[styles.removeBgButton, removingBackground && styles.disabled]}
								>
									{removingBackground ? (
										<ActivityIndicator size={14} color="#fff" />
									) : (
										<Icon name="eraser-fill" size={14} color="#fff" />
									)}
									<Text style={styles.removeBgText}>Remove Background</Text>
								</Pressable>
								<Pressable onPress={() => patch({ image: '' })} style={styles.trashButton}>
									<Icon name="trash-fill" size={14} color="#fff" />
								</Pressable>
							</View>
						</View>
					) : (
						<View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
							<Pressable
								onPress={handleUploadFromDevice}
								disabled={uploading}
								style={[styles.darkButton, uploading && styles.disabled]}
							>
								{uploading ? (
									<ActivityIndicator size={14} color="#e4e4e7" />
								) : (
									<Icon name="upload" size={14} color="#e4e4e7" />
								)}
								<Text style={styles.darkButtonText}>Upload Image From Device</Text>
							</Pressable>
							<Pressable onPress={() => setView('imageSearch')} style={styles.darkButton}>
								<Icon name="search" size={14} color="#e4e4e7" />
								<Text style={styles.darkButtonText}>Search for Images Online</Text>
							</Pressable>
						</View>
					)}

					<Text style={[styles.label, styles.sectionGap]}>Color:</Text>
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
								>
									<Text style={styles.swatchText}>Aa</Text>
								</Pressable>
							);
						})}
					</View>

					<Text style={[styles.label, styles.sectionGap]}>Navigation:</Text>
					<Pressable ref={selectRef} onPress={openNavigationPicker} style={styles.select}>
						<Text style={styles.selectText} numberOfLines={1}>
							{navigationLabel}
						</Text>
						<Icon name="chevron-down" size={12} color="#27272a" />
					</Pressable>

					{/* Android fallback: an overlay picker, so the panel never shifts. */}
					<Modal
						visible={navigationOpen}
						transparent
						animationType="fade"
						onRequestClose={() => setNavigationOpen(false)}
					>
						<Pressable style={styles.pickerBackdrop} onPress={() => setNavigationOpen(false)}>
							<View style={styles.pickerCard}>
								<ScrollView>
									<SelectOption
										label="No Navigation"
										active={!draft.navigation}
										onPress={() => {
											patch({ navigation: '' });
											setNavigationOpen(false);
										}}
									/>
									{pages.map((page) => (
										<SelectOption
											key={page.id}
											label={page.name}
											active={draft.navigation === page.id}
											onPress={() => {
												patch({ navigation: page.id });
												setNavigationOpen(false);
											}}
										/>
									))}
								</ScrollView>
							</View>
						</Pressable>
					</Modal>

					{error ? <Text style={styles.error}>{error}</Text> : null}

					<Pressable
						onPress={handleSave}
						disabled={!unsavedChanges || saving}
						style={[styles.actionButton, styles.saveButton, !unsavedChanges && styles.disabled]}
					>
						{saving ? (
							<ActivityIndicator size={16} color="#fff" />
						) : (
							<Icon name="check-lg" size={16} color="#fff" />
						)}
						<Text style={styles.actionButtonText}>Save Changes</Text>
					</Pressable>

					<Pressable
						onPress={() => setDraft({ ...tile })}
						disabled={!unsavedChanges}
						style={[styles.actionButton, styles.cancelButton, !unsavedChanges && styles.disabled]}
					>
						<Icon name="x-lg" size={14} color="#fff" />
						<Text style={styles.actionButtonText}>Cancel Changes</Text>
					</Pressable>

					<View style={{ flex: 1 }} />

					<View style={styles.divider}>
						<View style={{ height: 1, backgroundColor: '#27272a' }} />
						<View style={{ height: 1, backgroundColor: '#09090b' }} />
					</View>

					<Pressable onPress={handleDelete} style={[styles.actionButton, styles.deleteButton]}>
						<Icon name="trash-fill" size={14} color="#fff" />
						<Text style={styles.actionButtonText}>Delete Tile</Text>
					</Pressable>
				</ScrollView>
			)}
		</View>
	);
}

function SelectOption({
	label,
	active,
	onPress
}: {
	label: string;
	active: boolean;
	onPress: () => void;
}) {
	return (
		<Pressable
			onPress={onPress}
			style={({ pressed }) => [
				styles.selectOption,
				(active || pressed) && { backgroundColor: '#e4e4e7' }
			]}
		>
			<Text style={styles.selectText} numberOfLines={1}>
				{label}
			</Text>
		</Pressable>
	);
}

/** The web panel's transparent-texture backdrop behind image previews. */
function CheckerboardBackground() {
	return (
		<Svg style={StyleSheet.absoluteFill}>
			<Defs>
				<Pattern id="checker" width={16} height={16} patternUnits="userSpaceOnUse">
					<Rect width={16} height={16} fill="#ffffff" />
					<Rect width={8} height={8} fill="#e4e4e7" />
					<Rect x={8} y={8} width={8} height={8} fill="#e4e4e7" />
				</Pattern>
			</Defs>
			<Rect width="100%" height="100%" fill="url(#checker)" />
		</Svg>
	);
}

const styles = StyleSheet.create({
	// Web: w-[350px] border-zinc-800 bg-zinc-900 p-4 text-zinc-200 shadow-md
	panel: {
		width: 350,
		backgroundColor: '#18181b',
		borderLeftWidth: 1,
		borderColor: '#27272a'
	},
	content: { flexGrow: 1, padding: 16 },
	label: { color: '#e4e4e7', fontSize: 15, marginBottom: 8 },
	sectionGap: { marginTop: 24 },
	input: {
		backgroundColor: '#ffffff',
		borderWidth: 1,
		borderColor: '#d4d4d8',
		borderRadius: 6,
		paddingVertical: 6,
		paddingHorizontal: 8,
		fontSize: 15,
		color: '#27272a'
	},
	linkText: { color: '#d4d4d8', fontSize: 13, marginTop: 8 },
	imageBox: {
		borderWidth: 1,
		borderColor: '#3f3f46',
		borderRadius: 4,
		padding: 8,
		overflow: 'hidden'
	},
	imagePreview: { width: 150, height: 150, alignSelf: 'center' },
	removeBgButton: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 6,
		height: 30,
		paddingHorizontal: 8,
		borderRadius: 6,
		backgroundColor: '#3f3f46',
		borderWidth: 1,
		borderColor: '#52525b'
	},
	removeBgText: { color: '#ffffff', fontSize: 13 },
	trashButton: {
		width: 30,
		height: 30,
		borderRadius: 6,
		backgroundColor: '#ef4444',
		alignItems: 'center',
		justifyContent: 'center'
	},
	darkButton: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 6,
		paddingVertical: 6,
		paddingHorizontal: 12,
		borderRadius: 6,
		backgroundColor: '#27272a',
		borderWidth: 1,
		borderColor: '#3f3f46'
	},
	darkButtonText: { color: '#e4e4e7', fontSize: 13 },
	swatches: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
	swatch: {
		borderRadius: 6,
		borderWidth: 1,
		paddingVertical: 14,
		paddingHorizontal: 14,
		shadowColor: '#000',
		shadowOpacity: 0.2,
		shadowRadius: 3,
		shadowOffset: { width: 0, height: 2 },
		elevation: 2
	},
	// Web: ring-2 ring-zinc-50
	swatchActive: { boxShadow: '0 0 0 2px #fafafa' },
	swatchText: { fontSize: 15, fontWeight: '500', color: '#18181b' },
	select: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		gap: 8,
		alignSelf: 'flex-start',
		minWidth: 180,
		backgroundColor: '#ffffff',
		borderWidth: 1,
		borderColor: '#d4d4d8',
		borderRadius: 6,
		paddingVertical: 6,
		paddingHorizontal: 8
	},
	selectText: { fontSize: 14, color: '#27272a', flexShrink: 1 },
	pickerBackdrop: {
		flex: 1,
		backgroundColor: 'rgba(0,0,0,0.4)',
		alignItems: 'center',
		justifyContent: 'center',
		padding: 24
	},
	pickerCard: {
		width: 280,
		maxHeight: 400,
		backgroundColor: '#ffffff',
		borderRadius: 10,
		paddingVertical: 6,
		overflow: 'hidden'
	},
	selectOption: { paddingVertical: 12, paddingHorizontal: 16 },
	actionButton: {
		marginTop: 16,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 8,
		borderRadius: 6,
		borderWidth: 1,
		paddingVertical: 6
	},
	saveButton: { backgroundColor: '#2563eb', borderColor: '#3b82f6' },
	cancelButton: { backgroundColor: '#52525b', borderColor: '#71717a' },
	deleteButton: { backgroundColor: '#dc2626', borderColor: '#ef4444' },
	actionButtonText: { color: '#ffffff', fontSize: 15 },
	disabled: { opacity: 0.5 },
	divider: { marginVertical: 24 },
	error: { color: '#f87171', fontSize: 13, marginTop: 12 }
});
