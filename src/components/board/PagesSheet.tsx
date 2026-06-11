import { useState } from 'react';
import {
	Alert,
	FlatList,
	Modal,
	Pressable,
	StyleSheet,
	Text,
	TextInput,
	View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '@/lib/api';
import { colors } from '@/lib/theme';
import type { TilePage } from '@/lib/types';

export function PagesSheet({
	visible,
	projectId,
	currentPageId,
	homePageId,
	pages,
	onPagesChanged,
	onNavigate,
	onClose
}: {
	visible: boolean;
	projectId: string;
	currentPageId: string;
	homePageId: string | null;
	pages: TilePage[];
	onPagesChanged: (pages: TilePage[]) => void;
	onNavigate: (pageId: string) => void;
	onClose: () => void;
}) {
	const [newPageName, setNewPageName] = useState('');
	const [error, setError] = useState<string | null>(null);
	const [creating, setCreating] = useState(false);

	const handleCreate = async () => {
		const name = newPageName.trim();
		if (!name) return;
		setCreating(true);
		setError(null);
		try {
			await api.page.create({ name, projectId });
			const { pages: refreshed } = await api.project.listPages(projectId);
			onPagesChanged(refreshed);
			setNewPageName('');
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Failed to create page.');
		} finally {
			setCreating(false);
		}
	};

	const handleDelete = (page: TilePage) => {
		Alert.alert('Delete page', `Delete "${page.name}" and all of its tiles?`, [
			{ text: 'Cancel', style: 'cancel' },
			{
				text: 'Delete',
				style: 'destructive',
				onPress: async () => {
					try {
						await api.page.delete(page.id);
						onPagesChanged(pages.filter((p) => p.id !== page.id));
					} catch (e) {
						setError(e instanceof Error ? e.message : 'Failed to delete page.');
					}
				}
			}
		]);
	};

	return (
		<Modal visible={visible} animationType="slide" presentationStyle="formSheet" onRequestClose={onClose}>
			<SafeAreaView style={styles.sheet} edges={['bottom']}>
				<View style={styles.content}>
					<View style={styles.headerRow}>
						<Text style={styles.title}>Pages</Text>
						<Pressable onPress={onClose} hitSlop={8}>
							<Text style={styles.close}>✕</Text>
						</Pressable>
					</View>

					<View style={{ flexDirection: 'row', gap: 8 }}>
						<TextInput
							value={newPageName}
							onChangeText={setNewPageName}
							style={[styles.input, { flex: 1 }]}
							placeholder="New page name…"
							placeholderTextColor={colors.textFaint}
							onSubmitEditing={handleCreate}
							maxLength={50}
						/>
						<Pressable
							onPress={handleCreate}
							disabled={creating || !newPageName.trim()}
							style={[styles.addButton, (creating || !newPageName.trim()) && { opacity: 0.5 }]}
						>
							<Text style={{ color: '#fff', fontSize: 15, fontWeight: '700' }}>Add</Text>
						</Pressable>
					</View>

					{error ? <Text style={styles.error}>{error}</Text> : null}

					<FlatList
						data={pages}
						keyExtractor={(page) => page.id}
						contentContainerStyle={{ gap: 8, paddingTop: 8, paddingBottom: 24 }}
						renderItem={({ item: page }) => {
							const isHome = page.id === homePageId;
							const isCurrent = page.id === currentPageId;
							return (
								<View style={[styles.pageRow, isCurrent && { borderColor: colors.primary }]}>
									<Pressable style={{ flex: 1 }} onPress={() => onNavigate(page.id)}>
										<Text style={styles.pageName} numberOfLines={1}>
											{page.name}
											{isHome ? '  ⌂' : ''}
										</Text>
										{isCurrent ? <Text style={styles.pageMeta}>Current page</Text> : null}
									</Pressable>
									{!isHome ? (
										<Pressable onPress={() => handleDelete(page)} hitSlop={8}>
											<Text style={{ color: colors.danger, fontSize: 18 }}>🗑</Text>
										</Pressable>
									) : null}
								</View>
							);
						}}
					/>
				</View>
			</SafeAreaView>
		</Modal>
	);
}

const styles = StyleSheet.create({
	sheet: { flex: 1, backgroundColor: colors.background },
	content: { flex: 1, padding: 20, gap: 10 },
	headerRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginBottom: 6
	},
	title: { fontSize: 20, fontWeight: '800', color: colors.text },
	close: { fontSize: 18, color: colors.textMuted, fontWeight: '600' },
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
	addButton: {
		backgroundColor: colors.primary,
		borderRadius: 10,
		paddingHorizontal: 18,
		alignItems: 'center',
		justifyContent: 'center'
	},
	error: { color: colors.danger, fontSize: 14 },
	pageRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
		backgroundColor: colors.surface,
		borderWidth: 1,
		borderColor: colors.border,
		borderRadius: 10,
		paddingVertical: 12,
		paddingHorizontal: 14
	},
	pageName: { fontSize: 16, fontWeight: '600', color: colors.text },
	pageMeta: { fontSize: 12, color: colors.primaryDark, marginTop: 2 }
});
