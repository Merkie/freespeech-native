import { useState } from 'react';
import { Alert, FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '@/components/icons/Icon';
import { SheetHeader } from '@/components/ui';
import api from '@/lib/api';
import { cacheDeletePage } from '@/lib/cache';
import { colors } from '@/lib/theme';
import type { TilePage } from '@/lib/types';
import { PageNameModal } from './PageNameModal';
import { sheetStyles } from './sheet-styles';

/**
 * The web app's "View All Pages" modal: rows navigate, non-home pages can be
 * renamed or deleted. Page creation lives in the Page Actions dropdown.
 */
export function PagesSheet({
	visible,
	currentPageId,
	homePageId,
	pages,
	onPagesChanged,
	onNavigate,
	onClose
}: {
	visible: boolean;
	currentPageId: string;
	homePageId: string | null;
	pages: TilePage[];
	onPagesChanged: (pages: TilePage[]) => void;
	onNavigate: (pageId: string) => void;
	onClose: () => void;
}) {
	const [renaming, setRenaming] = useState<TilePage | null>(null);
	const [error, setError] = useState<string | null>(null);

	const handleRename = async (name: string) => {
		if (!renaming) return;
		await api.page.update(renaming.id, { name });
		onPagesChanged(pages.map((p) => (p.id === renaming.id ? { ...p, name } : p)));
		setRenaming(null);
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
						cacheDeletePage(page.id);
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
			<SafeAreaView style={sheetStyles.sheet} edges={['bottom']}>
				<View style={[sheetStyles.content, { flex: 1 }]}>
					<SheetHeader title="Pages" onClose={onClose} />

					{error ? <Text style={sheetStyles.error}>{error}</Text> : null}

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
										<View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
											<Text style={styles.pageName} numberOfLines={1}>
												{page.name}
											</Text>
											{isHome ? <Icon name="house-fill" size={14} color={colors.textMuted} /> : null}
										</View>
										{isCurrent ? <Text style={styles.pageMeta}>Current page</Text> : null}
									</Pressable>
									{!isHome ? (
										<>
											<Pressable onPress={() => setRenaming(page)} hitSlop={8}>
												<Icon name="pencil" size={16} color={colors.textMuted} />
											</Pressable>
											<Pressable onPress={() => handleDelete(page)} hitSlop={8}>
												<Icon name="trash-fill" size={18} color={colors.danger} />
											</Pressable>
										</>
									) : null}
								</View>
							);
						}}
					/>
				</View>

				{renaming ? (
					<PageNameModal
						title="Edit Page"
						initialName={renaming.name}
						submitLabel="Submit Edits"
						onSubmit={handleRename}
						onClose={() => setRenaming(null)}
					/>
				) : null}
			</SafeAreaView>
		</Modal>
	);
}

const styles = StyleSheet.create({
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
