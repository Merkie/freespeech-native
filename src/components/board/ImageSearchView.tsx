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
import { Chip } from '@/components/ui';
import api from '@/lib/api';
import { uploadImageFromUrl } from '@/lib/media';
import { colors } from '@/lib/theme';
import type { ImageSearchResult, SkinTone } from '@/lib/types';
import { sheetStyles } from './sheet-styles';

export function ImageSearchView({
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
		<View style={[sheetStyles.content, { flex: 1 }]}>
			<View style={styles.headerRow}>
				<Pressable onPress={onBack} hitSlop={8} style={sheetStyles.buttonRow}>
					<Icon name="arrow-left" size={16} color={colors.textMuted} />
					<Text style={styles.back}>Back</Text>
				</Pressable>
				<Text style={styles.title}>Find an image</Text>
				<View style={{ width: 50 }} />
			</View>

			<View style={{ flexDirection: 'row', gap: 8 }}>
				<TextInput
					value={query}
					onChangeText={setQuery}
					style={[sheetStyles.input, { flex: 1 }]}
					placeholder="Search…"
					placeholderTextColor={colors.textFaint}
					onSubmitEditing={() => search()}
					returnKeyType="search"
				/>
				<Pressable
					onPress={() => search()}
					style={[sheetStyles.smallButton, { justifyContent: 'center' }]}
				>
					<Icon name="search" size={14} color={colors.text} />
					<Text style={sheetStyles.smallButtonText}>Search</Text>
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

			{error ? <Text style={sheetStyles.error}>{error}</Text> : null}

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
	headerRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginBottom: 6
	},
	title: { fontSize: 20, fontWeight: '800', color: colors.text },
	back: { fontSize: 18, color: colors.textMuted, fontWeight: '600' },
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
