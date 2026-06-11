import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
	ActivityIndicator,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EditTileSheet } from '@/components/board/EditTileSheet';
import { Icon } from '@/components/icons/Icon';
import { PagesSheet } from '@/components/board/PagesSheet';
import { SentenceBar } from '@/components/board/SentenceBar';
import { TileGridPage } from '@/components/board/TileGridPage';
import { Button } from '@/components/ui';
import api from '@/lib/api';
import { useSettings } from '@/lib/settings';
import { speakText } from '@/lib/speak';
import { colors } from '@/lib/theme';
import type { Project, Tile, TilePage } from '@/lib/types';

type BoardData = {
	page: TilePage;
	project: Project;
	isHomePage: boolean;
};

export default function BoardScreen() {
	const { projectId, pageId } = useLocalSearchParams<{ projectId: string; pageId: string }>();
	if (!projectId || !pageId) return null;
	// Keying by route params resets all board state when navigating between pages.
	return <Board key={`${projectId}/${pageId}`} projectId={projectId} pageId={pageId} />;
}

function Board({ projectId, pageId }: { projectId: string; pageId: string }) {
	const { settings, updateSettings } = useSettings();

	const [board, setBoard] = useState<BoardData | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [sentence, setSentence] = useState<Tile[]>([]);
	const [synthesizing, setSynthesizing] = useState(false);
	const [editing, setEditing] = useState(false);
	const [selectedTile, setSelectedTile] = useState<Tile | null>(null);
	const [projectPages, setProjectPages] = useState<TilePage[]>([]);
	const [pagesSheetOpen, setPagesSheetOpen] = useState(false);
	const [gridSize, setGridSize] = useState<{ width: number; height: number } | null>(null);

	const editedRef = useRef(false);

	const loadBoard = useCallback(async () => {
		try {
			const { page, isHomePage } = await api.project.viewPage(projectId, pageId);
			if (!page?.tilePage || !page?.project) throw new Error('Page not found.');
			setBoard({ page: page.tilePage, project: page.project, isHomePage });
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Failed to load page.');
		}
	}, [projectId, pageId]);

	useEffect(() => {
		// loadBoard is async — state is set after the fetch resolves, not synchronously.
		// eslint-disable-next-line react-hooks/set-state-in-effect
		loadBoard();
	}, [loadBoard]);

	useEffect(() => {
		updateSettings({ lastVisitedProjectId: projectId, lastVisitedPageId: pageId });
	}, [projectId, pageId, updateSettings]);

	// Load the project's pages when entering edit mode (for navigation links + pages sheet).
	useEffect(() => {
		if (!editing || !projectId || projectPages.length > 0) return;
		api.project
			.listPages(projectId)
			.then(({ pages }) => setProjectPages(pages))
			.catch(() => {});
	}, [editing, projectId, projectPages.length]);

	const subpages = useMemo(() => {
		if (!board) return [];
		const grouped: Tile[][] = [];
		for (const tile of board.page.tiles ?? []) {
			(grouped[tile.page] ??= []).push(tile);
		}
		for (let i = 0; i < grouped.length; i++) grouped[i] ??= [];
		if (grouped.length === 0) grouped.push([]);
		if (editing) grouped.push([]);
		return grouped;
	}, [board, editing]);

	const speak = useCallback(
		async (text: string) => {
			setSynthesizing(true);
			try {
				await speakText(text, settings);
			} finally {
				setSynthesizing(false);
			}
		},
		[settings]
	);

	const handleTilePress = (tile: Tile) => {
		if (editing) {
			setSelectedTile((prev) => (prev?.id === tile.id ? null : { ...tile }));
			return;
		}
		if (settings.speakOnTap) speak(tile.text);
		if (tile.navigation) {
			router.push(`/project/${projectId}/${tile.navigation}`);
			return;
		}
		if (settings.sentenceBuilder) setSentence((prev) => [...prev, tile]);
	};

	const handleAddTile = async (x: number, y: number, subpage: number) => {
		if (!board) return;
		try {
			const { tile } = await api.tile.create({ x, y, page: subpage, pageId: board.page.id });
			editedRef.current = true;
			if (tile) {
				setBoard((prev) =>
					prev ? { ...prev, page: { ...prev.page, tiles: [...(prev.page.tiles ?? []), tile] } } : prev
				);
				setSelectedTile({ ...tile });
			} else {
				await loadBoard();
			}
		} catch {
			// Position taken or network error — refresh to stay in sync.
			await loadBoard();
		}
	};

	const handleTileSaved = (tile: Tile) => {
		editedRef.current = true;
		setBoard((prev) =>
			prev
				? {
						...prev,
						page: {
							...prev.page,
							tiles: (prev.page.tiles ?? []).map((t) => (t.id === tile.id ? tile : t))
						}
					}
				: prev
		);
		setSelectedTile(null);
	};

	const handleTileDeleted = (tileId: string) => {
		editedRef.current = true;
		setBoard((prev) =>
			prev
				? {
						...prev,
						page: { ...prev.page, tiles: (prev.page.tiles ?? []).filter((t) => t.id !== tileId) }
					}
				: prev
		);
		setSelectedTile(null);
	};

	const toggleEditing = () => {
		if (editing) {
			setSelectedTile(null);
			// Regenerate the project thumbnail after editing the home page, like the web app.
			if (editedRef.current && board?.isHomePage && projectId) {
				api.project.updateThumbnail(projectId).catch(() => {});
				editedRef.current = false;
			}
		}
		setEditing(!editing);
	};

	if (error) {
		return (
			<SafeAreaView style={[styles.safeArea, styles.center]}>
				<Text style={styles.error}>{error}</Text>
				<Button title="Back to projects" variant="secondary" onPress={() => router.replace('/projects')} />
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
			<View style={styles.header}>
				<Pressable onPress={() => router.replace('/projects')} style={styles.headerButton}>
					<Icon name="arrow-left-short" size={28} color={colors.text} />
				</Pressable>

				<View style={{ flex: 1 }}>
					<Text style={styles.headerTitle} numberOfLines={1}>
						{board?.page.name ?? '…'}
					</Text>
					{board ? (
						<Text style={styles.headerSubtitle} numberOfLines={1}>
							{board.project.name}
						</Text>
					) : null}
				</View>

				{board && !board.isHomePage && board.project.homePageId ? (
					<Pressable
						onPress={() => router.replace(`/project/${projectId}/${board.project.homePageId}`)}
						style={styles.headerButton}
					>
						<Icon name="house-fill" size={20} color={colors.text} />
					</Pressable>
				) : null}

				{editing ? (
					<Pressable onPress={() => setPagesSheetOpen(true)} style={styles.headerButton}>
						<Icon name="grid-fill" size={18} color={colors.text} />
					</Pressable>
				) : null}

				<Pressable
					onPress={toggleEditing}
					style={[styles.headerButton, editing && { backgroundColor: colors.primary, borderColor: colors.primary }]}
				>
					<Icon name={editing ? 'check-lg' : 'pencil-fill'} size={18} color={editing ? '#fff' : colors.text} />
				</Pressable>
			</View>

			{!editing && settings.sentenceBuilder ? (
				<SentenceBar
					sentence={sentence}
					synthesizing={synthesizing}
					copyEnabled={settings.sentenceCopyButton}
					onRemove={(index) => setSentence((prev) => prev.filter((_, i) => i !== index))}
					onSpeak={() => speak(sentence.map((tile) => tile.text).join(' '))}
					onClear={() => setSentence([])}
				/>
			) : null}

			<View
				style={{ flex: 1 }}
				onLayout={(e) => {
					const { width, height } = e.nativeEvent.layout;
					setGridSize({ width, height });
				}}
			>
				{!board || !gridSize ? (
					<View style={styles.center}>
						<ActivityIndicator size="large" color={colors.primary} />
					</View>
				) : (
					<ScrollView pagingEnabled showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
						{subpages.map((tiles, subpage) => (
							<TileGridPage
								key={subpage}
								tiles={tiles}
								columns={board.project.columns}
								rows={board.project.rows}
								width={gridSize.width}
								height={gridSize.height}
								subpage={subpage}
								editing={editing}
								selectedTileId={selectedTile?.id ?? null}
								onTilePress={handleTilePress}
								onAddTile={handleAddTile}
							/>
						))}
					</ScrollView>
				)}
			</View>

			{selectedTile && board ? (
				<EditTileSheet
					key={selectedTile.id}
					tile={selectedTile}
					pages={projectPages}
					skinTone={settings.skinTone}
					onSave={handleTileSaved}
					onDelete={handleTileDeleted}
					onClose={() => setSelectedTile(null)}
				/>
			) : null}

			{board && projectId ? (
				<PagesSheet
					visible={pagesSheetOpen}
					projectId={projectId}
					currentPageId={board.page.id}
					homePageId={board.project.homePageId}
					pages={projectPages}
					onPagesChanged={setProjectPages}
					onClose={() => setPagesSheetOpen(false)}
					onNavigate={(toPageId) => {
						setPagesSheetOpen(false);
						setEditing(false);
						router.replace(`/project/${projectId}/${toPageId}`);
					}}
				/>
			) : null}
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safeArea: { flex: 1, backgroundColor: colors.background },
	center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 },
	error: { color: colors.danger, fontSize: 16, textAlign: 'center' },
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
		paddingHorizontal: 12,
		paddingVertical: 8,
		backgroundColor: colors.surface,
		borderBottomWidth: 1,
		borderBottomColor: colors.backgroundAlt
	},
	headerButton: {
		minWidth: 40,
		height: 40,
		borderRadius: 10,
		alignItems: 'center',
		justifyContent: 'center',
		paddingHorizontal: 10,
		backgroundColor: colors.surface,
		borderWidth: 1,
		borderColor: colors.border
	},
	headerTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
	headerSubtitle: { fontSize: 12, color: colors.textMuted }
});
