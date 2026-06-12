import { Image } from 'expo-image';
import { useState } from 'react';
import {
	ActivityIndicator,
	FlatList,
	Pressable,
	StyleSheet,
	Text,
	TextInput,
	View
} from 'react-native';
import { Icon } from '@/components/icons/Icon';
import api from '@/lib/api';
import { uploadImageFromUrl } from '@/lib/media';
import { useSettings } from '@/lib/settings';
import { SKIN_TONES, type ImageSearchResult, type SkinTone } from '@/lib/types';

type Strategy = 'brave' | 'open-symbols';

/**
 * The web app's OnlineImageSearchPanel: swaps into the edit-tile panel with
 * Google Images / Open Symbols tabs and a skin-tone picker for symbols.
 */
export function ImageSearchView({
	initialQuery,
	onPick,
	onBack
}: {
	initialQuery: string;
	onPick: (mediaUrl: string) => void;
	onBack: () => void;
}) {
	const { settings, updateSettings } = useSettings();
	const [query, setQuery] = useState(initialQuery);
	const [strategy, setStrategy] = useState<Strategy>('brave');
	const [results, setResults] = useState<ImageSearchResult[] | null>(null);
	const [searching, setSearching] = useState(false);
	const [uploading, setUploading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const search = async (withStrategy = strategy, skinTone = settings.skinTone) => {
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

	const switchStrategy = (next: Strategy) => {
		setStrategy(next);
		setResults(null);
	};

	const pickSkinTone = (tone: SkinTone) => {
		updateSettings({ skinTone: tone });
		// Like the web app: refresh symbol results when the skin tone changes.
		if (strategy === 'open-symbols' && results && results.length > 0) search(strategy, tone);
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
		<View style={styles.container}>
			<Pressable onPress={onBack} hitSlop={8} style={styles.backRow}>
				<Icon name="arrow-left" size={14} color="#d4d4d8" />
				<Text style={styles.backText}>Back</Text>
			</Pressable>

			<View style={styles.tabs}>
				<Pressable onPress={() => switchStrategy('brave')} style={styles.tab}>
					<Icon name="google" size={14} color="#e4e4e7" />
					<Text style={[styles.tabText, strategy === 'brave' && styles.tabTextActive]}>
						Google Images
					</Text>
				</Pressable>
				<Pressable onPress={() => switchStrategy('open-symbols')} style={styles.tab}>
					<Text style={[styles.tabText, strategy === 'open-symbols' && styles.tabTextActive]}>
						Open Symbols
					</Text>
				</Pressable>
			</View>

			{strategy === 'open-symbols' ? (
				<View style={styles.skinToneRow}>
					<Text style={styles.skinToneLabel}>Skin tone:</Text>
					{(Object.keys(SKIN_TONES) as SkinTone[]).map((tone) => (
						<Pressable
							key={tone}
							onPress={() => pickSkinTone(tone)}
							style={[
								styles.skinTone,
								{ backgroundColor: SKIN_TONES[tone] },
								settings.skinTone === tone && styles.skinToneActive
							]}
						/>
					))}
				</View>
			) : null}

			<View style={styles.searchRow}>
				<View style={styles.inputWrap}>
					<Icon name="search" size={13} color="#27272a" />
					<TextInput
						value={query}
						onChangeText={setQuery}
						style={styles.input}
						placeholder={
							strategy === 'brave'
								? 'Search for images online...'
								: 'Search for symbols on Open Symbols...'
						}
						placeholderTextColor="#a1a1aa"
						onSubmitEditing={() => search()}
						returnKeyType="search"
					/>
				</View>
				<Pressable
					onPress={() => search()}
					disabled={searching}
					style={[styles.searchButton, searching && { opacity: 0.5 }]}
				>
					<Text style={styles.searchButtonText}>{searching ? 'Searching...' : 'Search'}</Text>
				</Pressable>
			</View>

			{error ? <Text style={styles.error}>{error}</Text> : null}

			{searching || uploading ? (
				<View style={styles.loading}>
					<ActivityIndicator size="large" color="#3b82f6" />
					<Text style={styles.loadingText}>
						{uploading ? 'Saving image...' : 'Searching for images...'}
					</Text>
					<Text style={styles.loadingHint}>This may take a few seconds</Text>
				</View>
			) : (
				<FlatList
					data={results ?? []}
					numColumns={2}
					keyExtractor={(item, index) => `${item.image_url}-${index}`}
					columnWrapperStyle={{ gap: 12 }}
					contentContainerStyle={{ gap: 12, paddingTop: 8, paddingBottom: 24 }}
					ListEmptyComponent={
						results ? <Text style={styles.noResults}>No results found</Text> : null
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
	container: { flex: 1, padding: 16 },
	backRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
	backText: { color: '#d4d4d8', fontSize: 13 },
	tabs: { flexDirection: 'row', gap: 16, paddingVertical: 12 },
	tab: { flexDirection: 'row', alignItems: 'center', gap: 6 },
	tabText: { color: '#e4e4e7', fontSize: 14 },
	tabTextActive: { textDecorationLine: 'underline' },
	skinToneRow: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingBottom: 12 },
	skinToneLabel: { color: '#e4e4e7', fontSize: 14, paddingRight: 8 },
	skinTone: { flex: 1, height: 40, borderRadius: 4 },
	skinToneActive: { transform: [{ scale: 0.9 }], boxShadow: '0 0 0 2px #ffffff' },
	searchRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
	inputWrap: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		gap: 6,
		backgroundColor: '#ffffff',
		borderWidth: 1,
		borderColor: '#d4d4d8',
		borderRadius: 6,
		paddingHorizontal: 8
	},
	input: { flex: 1, paddingVertical: 6, fontSize: 14, color: '#27272a' },
	searchButton: {
		backgroundColor: '#2563eb',
		borderWidth: 1,
		borderColor: '#3b82f6',
		borderRadius: 6,
		paddingVertical: 5,
		paddingHorizontal: 16
	},
	searchButtonText: { color: '#ffffff', fontSize: 13 },
	loading: { marginTop: 32, alignItems: 'center', justifyContent: 'center', gap: 12 },
	loadingText: { color: '#d4d4d8', fontSize: 14, textAlign: 'center' },
	loadingHint: { color: '#71717a', fontSize: 12, textAlign: 'center' },
	noResults: { color: '#d4d4d8', fontSize: 14, textAlign: 'center', marginTop: 32 },
	resultCell: {
		flex: 1 / 2,
		aspectRatio: 1,
		backgroundColor: '#ffffff',
		borderRadius: 6,
		overflow: 'hidden'
	},
	error: { color: '#f87171', fontSize: 13, marginBottom: 8 }
});
