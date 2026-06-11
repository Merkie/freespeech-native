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
import { Icon } from '@/components/icons/Icon';
import { Button, ErrorText, Field } from '@/components/ui';
import api from '@/lib/api';
import { mediaUrl } from '@/lib/config';
import { useSession } from '@/lib/session';
import { colors } from '@/lib/theme';
import type { Project } from '@/lib/types';

export default function ProjectsScreen() {
	const { user } = useSession();
	const { width } = useWindowDimensions();
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

	const filtered = useMemo(() => {
		if (!projects) return null;
		const q = search.trim().toLowerCase();
		if (!q) return projects;
		return projects.filter((p) => p.name.toLowerCase().includes(q));
	}, [projects, search]);

	const numColumns = Math.max(2, Math.min(4, Math.floor(width / 220)));

	return (
		<SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
			<View style={styles.header}>
				<Text style={styles.title}>Projects</Text>
				<View style={styles.headerActions}>
					<Pressable onPress={() => router.push('/settings')} style={styles.headerButton}>
						<Icon name="gear" size={19} color={colors.text} />
					</Pressable>
					<Pressable onPress={() => setCreating(true)} style={[styles.headerButton, styles.headerButtonPrimary]}>
						<Icon name="plus-lg" size={19} color="#fff" />
					</Pressable>
				</View>
			</View>

			{user ? <Text style={styles.welcome}>Signed in as {user.name}</Text> : null}

			<View style={styles.search}>
				<Icon name="search" size={16} color={colors.textFaint} />
				<TextInput
					value={search}
					onChangeText={setSearch}
					placeholder="Search projects…"
					placeholderTextColor={colors.textFaint}
					style={styles.searchInput}
				/>
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
					columnWrapperStyle={{ gap: 12 }}
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
					renderItem={({ item }) => <ProjectCard project={item} />}
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
		</SafeAreaView>
	);
}

function ProjectCard({ project }: { project: Project }) {
	const thumbnail = mediaUrl(project.imageUrl);

	return (
		<Pressable
			onPress={() => router.push(`/project/${project.id}`)}
			style={({ pressed }) => [styles.card, pressed && { opacity: 0.8 }]}
		>
			<View style={styles.cardThumb}>
				{thumbnail ? (
					<Image source={{ uri: thumbnail }} style={{ flex: 1 }} contentFit="cover" transition={150} />
				) : (
					<View style={styles.cardThumbPlaceholder}>
						<Text style={styles.cardThumbLetter}>{project.name.charAt(0).toUpperCase()}</Text>
					</View>
				)}
			</View>
			<View style={styles.cardBody}>
				<Text style={styles.cardName} numberOfLines={1}>
					{project.name}
				</Text>
				<Text style={styles.cardMeta}>
					{project.columns}×{project.rows}
				</Text>
			</View>
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
	safeArea: { flex: 1, backgroundColor: colors.background },
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: 20,
		paddingTop: 8
	},
	title: { fontSize: 28, fontWeight: '800', color: colors.text },
	headerActions: { flexDirection: 'row', gap: 8 },
	headerButton: {
		width: 40,
		height: 40,
		borderRadius: 10,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: colors.surface,
		borderWidth: 1,
		borderColor: colors.border
	},
	headerButtonPrimary: { backgroundColor: colors.primary, borderColor: colors.primary },
	welcome: { paddingHorizontal: 20, paddingTop: 2, color: colors.textMuted, fontSize: 14 },
	search: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
		marginHorizontal: 20,
		marginTop: 12,
		marginBottom: 4,
		backgroundColor: colors.surface,
		borderWidth: 1,
		borderColor: colors.border,
		borderRadius: 10,
		paddingHorizontal: 14
	},
	searchInput: {
		flex: 1,
		paddingVertical: 10,
		fontSize: 16,
		color: colors.text
	},
	center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
	emptyTitle: { fontSize: 20, fontWeight: '700', color: colors.text },
	emptyText: { fontSize: 15, color: colors.textMuted, marginTop: 4, textAlign: 'center' },
	grid: { padding: 20, gap: 12 },
	card: {
		flex: 1,
		backgroundColor: colors.surface,
		borderRadius: 12,
		borderWidth: 1,
		borderColor: colors.border,
		overflow: 'hidden'
	},
	cardThumb: { aspectRatio: 16 / 10, backgroundColor: colors.backgroundAlt },
	cardThumbPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
	cardThumbLetter: { fontSize: 36, fontWeight: '800', color: colors.textFaint },
	cardBody: { padding: 12 },
	cardName: { fontSize: 16, fontWeight: '600', color: colors.text },
	cardMeta: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
	modal: { flex: 1, padding: 24, gap: 14, backgroundColor: colors.background },
	modalTitle: { fontSize: 24, fontWeight: '800', color: colors.text, marginBottom: 8 }
});
