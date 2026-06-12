import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
	ActivityIndicator,
	FlatList,
	Modal,
	Pressable,
	RefreshControl,
	StyleSheet,
	Text,
	TextInput,
	View,
	useWindowDimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DashboardHeader } from '@/components/DashboardHeader';
import { Icon } from '@/components/icons/Icon';
import { Button, ErrorText, Field } from '@/components/ui';
import api from '@/lib/api';
import { mediaUrl } from '@/lib/config';
import { useSettings } from '@/lib/settings';
import { colors } from '@/lib/theme';
import type { Project } from '@/lib/types';

const GRID_PADDING = 24;
const GRID_GAP = 24;

export default function ProjectsScreen() {
	const { width } = useWindowDimensions();
	const { settings } = useSettings();
	const [projects, setProjects] = useState<Project[] | null>(null);
	const [refreshing, setRefreshing] = useState(false);
	const [search, setSearch] = useState('');
	const [creating, setCreating] = useState(false);

	const loadProjects = useCallback(async () => {
		try {
			const { projects: list } = await api.project.list();
			setProjects(list);
		} catch {
			setProjects((prev) => prev ?? []);
		}
	}, []);

	useFocusEffect(
		useCallback(() => {
			loadProjects();
		}, [loadProjects])
	);

	const lastVisitedProjectId = settings.lastVisitedProjectId;

	const filtered = useMemo(() => {
		if (!projects) return null;
		const q = search.trim().toLowerCase();
		const matches = q ? projects.filter((p) => p.name.toLowerCase().includes(q)) : projects;
		// Like the web app: the last-visited project sorts first.
		return [...matches].sort((a, b) => {
			if (a.id === lastVisitedProjectId) return -1;
			if (b.id === lastVisitedProjectId) return 1;
			return 0;
		});
	}, [projects, search, lastVisitedProjectId]);

	// Web: grid-cols-2 on small screens, grid-cols-3 from md up.
	const numColumns = Math.max(2, Math.min(3, Math.floor(width / 320)));
	// Fixed card width so a lone card in the last row doesn't stretch.
	const cardWidth = (width - GRID_PADDING * 2 - GRID_GAP * (numColumns - 1)) / numColumns;

	return (
		<SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
			<DashboardHeader />

			<View style={styles.body}>
				{/* Web SearchBar: search input + Create New Project in one bordered row. */}
				<View style={styles.searchRow}>
					<View style={styles.search}>
						<Icon name="search" size={14} color={colors.text} />
						<TextInput
							value={search}
							onChangeText={setSearch}
							placeholder="Search..."
							placeholderTextColor={colors.textMuted}
							style={styles.searchInput}
						/>
					</View>
					<Pressable onPress={() => setCreating(true)} style={styles.createButton}>
						<Icon name="plus-lg" size={14} color="#eff6ff" />
						<Text style={styles.createButtonText}>Create New Project</Text>
					</Pressable>
				</View>

				{!filtered ? (
				<View style={styles.center}>
					<ActivityIndicator size="large" color={colors.primary} />
				</View>
			) : filtered.length === 0 ? (
				<View style={styles.center}>
					<Text style={styles.emptyTitle}>No projects yet</Text>
					<Text style={styles.emptyText}>Create a project to start building your board.</Text>
					<Button title="Create project" onPress={() => setCreating(true)} style={{ marginTop: 16 }} />
				</View>
			) : (
				<FlatList
					key={numColumns}
					data={filtered}
					numColumns={numColumns}
					keyExtractor={(item) => item.id}
					contentContainerStyle={styles.grid}
					columnWrapperStyle={{ gap: GRID_GAP }}
					refreshControl={
						<RefreshControl
							refreshing={refreshing}
							onRefresh={async () => {
								setRefreshing(true);
								await loadProjects();
								setRefreshing(false);
							}}
						/>
					}
					renderItem={({ item }) => (
							<ProjectCard
								project={item}
								selected={item.id === lastVisitedProjectId}
								width={cardWidth}
							/>
						)}
				/>
			)}

				<CreateProjectModal
					visible={creating}
					onClose={() => setCreating(false)}
					onCreated={(projectId) => {
						setCreating(false);
						loadProjects();
						router.push(`/project/${projectId}`);
					}}
				/>
			</View>
		</SafeAreaView>
	);
}

/** Mirror of the web ProjectCard: zinc-200 card, inset 16:9 preview, SELECTED badge. */
function ProjectCard({
	project,
	selected,
	width
}: {
	project: Project;
	selected: boolean;
	width: number;
}) {
	const thumbnail = mediaUrl(project.imageUrl);

	return (
		<Pressable
			onPress={() => router.push(`/project/${project.id}`)}
			style={({ pressed }) => [
				styles.card,
				{ width },
				selected && styles.cardSelected,
				pressed && { opacity: 0.8 }
			]}
		>
			<View style={styles.cardThumb}>
				{thumbnail ? (
					<Image
						source={{ uri: thumbnail }}
						style={styles.cardThumbImage}
						contentFit="cover"
						transition={150}
					/>
				) : (
					<View style={styles.cardThumbPlaceholder}>
						<Text style={styles.cardThumbLetter}>{project.name.charAt(0).toUpperCase()}</Text>
					</View>
				)}
			</View>
			<View style={styles.cardTitleRow}>
				<Text style={styles.cardName} numberOfLines={1}>
					{project.name}
				</Text>
				{selected ? (
					<View style={styles.selectedBadge}>
						<Text style={styles.selectedBadgeText}>SELECTED</Text>
					</View>
				) : null}
			</View>
			{selected ? <View pointerEvents="none" style={styles.selectedOverlay} /> : null}
		</Pressable>
	);
}

function CreateProjectModal({
	visible,
	onClose,
	onCreated
}: {
	visible: boolean;
	onClose: () => void;
	onCreated: (projectId: string) => void;
}) {
	const [name, setName] = useState('');
	const [columns, setColumns] = useState('6');
	const [rows, setRows] = useState('4');
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	const handleCreate = async () => {
		const cols = parseInt(columns, 10);
		const rws = parseInt(rows, 10);
		if (!name.trim()) return setError('Please enter a project name.');
		if (!cols || !rws || cols < 1 || rws < 1 || cols > 60 || rws > 60)
			return setError('Columns and rows must be between 1 and 60.');

		setLoading(true);
		setError(null);
		try {
			const { projectId } = await api.project.create({ name: name.trim(), columns: cols, rows: rws });
			if (!projectId) throw new Error('Project creation failed.');
			setName('');
			onCreated(projectId);
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Project creation failed.');
		} finally {
			setLoading(false);
		}
	};

	return (
		<Modal visible={visible} animationType="slide" presentationStyle="formSheet" onRequestClose={onClose}>
			<View style={styles.modal}>
				<Text style={styles.modalTitle}>New project</Text>

				<Field label="Name" value={name} onChangeText={setName} placeholder="My communication board" />
				<View style={{ flexDirection: 'row', gap: 12 }}>
					<View style={{ flex: 1 }}>
						<Field label="Columns" value={columns} onChangeText={setColumns} keyboardType="number-pad" />
					</View>
					<View style={{ flex: 1 }}>
						<Field label="Rows" value={rows} onChangeText={setRows} keyboardType="number-pad" />
					</View>
				</View>

				<ErrorText>{error}</ErrorText>

				<Button title="Create project" onPress={handleCreate} loading={loading} />
				<Button title="Cancel" variant="ghost" onPress={onClose} />
			</View>
		</Modal>
	);
}

const styles = StyleSheet.create({
	safeArea: { flex: 1, backgroundColor: '#18181b' },
	body: { flex: 1, backgroundColor: colors.background },
	// Web SearchBar: flex items-center gap-2 border-b border-zinc-300 p-2
	searchRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
		padding: 8,
		marginBottom: 8,
		borderBottomWidth: 1,
		borderBottomColor: colors.border
	},
	search: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
		backgroundColor: colors.backgroundAlt,
		borderWidth: 1,
		borderColor: colors.border,
		borderRadius: 6,
		paddingVertical: 4,
		paddingHorizontal: 16
	},
	searchInput: {
		flex: 1,
		paddingVertical: 4,
		fontSize: 14,
		color: colors.text
	},
	createButton: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 6,
		backgroundColor: '#2563eb',
		borderWidth: 1,
		borderColor: '#3b82f6',
		borderRadius: 6,
		paddingVertical: 8,
		paddingHorizontal: 16
	},
	createButtonText: { color: '#eff6ff', fontSize: 13 },
	center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
	emptyTitle: { fontSize: 20, fontWeight: '700', color: colors.text },
	emptyText: { fontSize: 15, color: colors.textMuted, marginTop: 4, textAlign: 'center' },
	// Web projects grid: m-8 gap-8.
	grid: { padding: GRID_PADDING, gap: GRID_GAP },
	// Web ProjectCard: rounded-lg border-zinc-300 bg-zinc-200 p-2 shadow-sm, gap-4.
	card: {
		backgroundColor: colors.backgroundAlt,
		borderRadius: 8,
		borderWidth: 1,
		borderColor: colors.border,
		padding: 8,
		gap: 16,
		shadowColor: '#000',
		shadowOpacity: 0.05,
		shadowRadius: 2,
		shadowOffset: { width: 0, height: 1 },
		elevation: 1
	},
	// Web: ring-4 ring-blue-200 ring-offset-2 ring-offset-zinc-100 border-blue-200.
	cardSelected: {
		borderColor: '#bfdbfe',
		boxShadow: '0 0 0 2px #f4f4f5, 0 0 0 6px #bfdbfe'
	},
	cardThumb: {
		aspectRatio: 16 / 9,
		backgroundColor: colors.background,
		borderRadius: 6,
		padding: 4
	},
	cardThumbImage: { flex: 1, borderRadius: 4 },
	cardThumbPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
	cardThumbLetter: { fontSize: 36, fontWeight: '800', color: colors.textFaint },
	cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
	cardName: { flex: 1, fontSize: 18, fontWeight: '400', color: colors.text },
	selectedBadge: {
		backgroundColor: '#3b82f6',
		borderRadius: 6,
		paddingVertical: 4,
		paddingHorizontal: 8,
		shadowColor: '#000',
		shadowOpacity: 0.15,
		shadowRadius: 3,
		shadowOffset: { width: 0, height: 2 },
		elevation: 2
	},
	selectedBadgeText: { color: '#ffffff', fontSize: 13, fontWeight: '700' },
	selectedOverlay: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		backgroundColor: 'rgba(191, 219, 254, 0.2)',
		borderRadius: 8
	},
	modal: { flex: 1, padding: 24, gap: 14, backgroundColor: colors.background },
	modalTitle: { fontSize: 24, fontWeight: '800', color: colors.text, marginBottom: 8 }
});
