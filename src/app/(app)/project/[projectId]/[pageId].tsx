import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
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
import { useBoardUi } from '@/lib/board-ui';
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
	const { setBoardUi } = useBoardUi();

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
		if (!board) return;
		updateSettings({
			lastVisitedProjectId: projectId,
			lastVisitedPageId: pageId,
			lastVisitedHomePageId: board.project.homePageId
		});
	}, [board, projectId, pageId, updateSettings]);

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

	const exitEditing = useCallback(() => {
		setSelectedTile(null);
		// Regenerate the project thumbnail after editing the home page, like the web app.
		if (editedRef.current && board?.isHomePage && projectId) {
			api.project.updateThumbnail(projectId).catch(() => {});
			editedRef.current = false;
		}
		setEditing(false);
	}, [board?.isHomePage, projectId]);

	const toggleEditing = useCallback(
		() => (editing ? exitEditing() : setEditing(true)),
		[editing, exitEditing]
	);

	// Register edit state with the layout-level bottom nav while this board is mounted.
	useEffect(() => {
		setBoardUi({
			projectId,
			homePageId: board?.project.homePageId ?? null,
			editing,
			toggleEditing,
			exitEditing
		});
	}, [setBoardUi, projectId, board?.project.homePageId, editing, toggleEditing, exitEditing]);

	useEffect(() => () => setBoardUi(null), [setBoardUi]);

	if (error) {
		return (
			<SafeAreaView style={[styles.safeArea, styles.center, { backgroundColor: colors.background }]}>
				<Text style={styles.error}>{error}</Text>
				<Button title="Back to projects" variant="secondary" onPress={() => router.replace('/projects')} />
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
			<StatusBar style="light" />
			<View style={styles.header}>
				{/* Mirrors the web page header: title centered, page actions on the left while editing. */}
				{editing ? (
					<Pressable onPress={() => setPagesSheetOpen(true)} style={styles.headerButton}>
						<Icon name="grid-fill" size={16} color={colors.text} />
						<Text style={styles.headerButtonLabel}>Pages</Text>
					</Pressable>
				) : null}

				<View style={styles.headerTitleBlock} pointerEvents="none">
					<Text style={styles.headerTitle} numberOfLines={1}>
						{board?.page.name ?? '…'}
					</Text>
					{board ? (
						<Text style={styles.headerSubtitle} numberOfLines={1}>
							{board.project.name}
						</Text>
					) : null}
				</View>
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
				style={{ flex: 1, backgroundColor: colors.background }}
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
	safeArea: { flex: 1, backgroundColor: '#18181b' },
	center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 },
	error: { color: colors.danger, fontSize: 16, textAlign: 'center' },
	// Dark zinc header, matching the web app's page header (bg-zinc-900).
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		height: 56,
		paddingHorizontal: 12,
		backgroundColor: '#18181b'
	},
	headerButton: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
		height: 38,
		borderRadius: 8,
		paddingHorizontal: 14,
		backgroundColor: '#27272a',
		borderWidth: 1,
		borderColor: '#3f3f46'
	},
	headerButtonLabel: { color: '#fafafa', fontSize: 14, fontWeight: '500' },
	headerTitleBlock: {
		position: 'absolute',
		// Inset past the Pages button so a long page name never renders under it.
		left: 96,
		right: 96,
		alignItems: 'center'
	},
	headerTitle: { fontSize: 16, fontWeight: '400', color: '#fafafa' },
	headerSubtitle: { fontSize: 11, color: '#a1a1aa' }
});
