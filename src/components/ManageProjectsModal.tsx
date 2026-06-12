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
import { cacheDeleteProject } from '@/lib/cache';
import type { Project } from '@/lib/types';
import { Icon } from './icons/Icon';

/**
 * The web app's Manage Projects modal (EditProjectsModal): each project in a
 * row with Edit and Delete, where Edit opens the web's Edit Project form
 * (name + dimensions) and returns here on submit. Dark-themed like the web
 * ModalShell. Unlike the web, Delete asks for confirmation first — matching
 * the native PagesSheet convention for destructive actions.
 */
export function ManageProjectsModal({
	visible,
	projects,
	onChanged,
	onClose
}: {
	visible: boolean;
	projects: Project[];
	/** A project was deleted or edited — the parent should reload its list. */
	onChanged: () => void;
	onClose: () => void;
}) {
	const [editing, setEditing] = useState<Project | null>(null);
	const [error, setError] = useState<string | null>(null);

	const handleClose = () => {
		setEditing(null);
		setError(null);
		onClose();
	};

	const handleDelete = (project: Project) => {
		Alert.alert('Delete project', `Delete "${project.name}" and all of its pages?`, [
			{ text: 'Cancel', style: 'cancel' },
			{
				text: 'Delete',
				style: 'destructive',
				onPress: async () => {
					try {
						await api.project.delete(project.id);
						cacheDeleteProject(project.id);
						onChanged();
					} catch (e) {
						setError(e instanceof Error ? e.message : 'Failed to delete project.');
					}
				}
			}
		]);
	};

	return (
		<Modal visible={visible} animationType="slide" presentationStyle="formSheet" onRequestClose={handleClose}>
			<SafeAreaView style={styles.sheet} edges={['bottom']}>
				<View style={styles.header}>
					{editing ? (
						<Pressable onPress={() => setEditing(null)} hitSlop={8}>
							<Icon name="arrow-left" size={18} color="#e4e4e7" />
						</Pressable>
					) : null}
					<Text style={styles.headerTitle}>{editing ? 'Edit Project' : 'Manage Projects'}</Text>
					<Pressable onPress={handleClose} hitSlop={8}>
						<Icon name="x-lg" size={18} color="#e4e4e7" />
					</Pressable>
				</View>

				{editing ? (
					<EditProjectForm
						project={editing}
						onSaved={() => {
							setEditing(null);
							onChanged();
						}}
					/>
				) : (
					<FlatList
						data={projects}
						keyExtractor={(project) => project.id}
						contentContainerStyle={styles.listBody}
						ListHeaderComponent={error ? <Text style={styles.error}>{error}</Text> : null}
						renderItem={({ item: project, index }) => (
							<View style={[styles.row, index !== 0 && styles.rowBorder]}>
								<Text style={styles.rowName} numberOfLines={1}>
									{project.name}
								</Text>
								<Pressable
									onPress={() => setEditing({ ...project })}
									style={({ pressed }) => [styles.editButton, pressed && { opacity: 0.8 }]}
								>
									<Text style={styles.rowButtonText}>Edit</Text>
								</Pressable>
								<Pressable
									onPress={() => handleDelete(project)}
									style={({ pressed }) => [styles.deleteButton, pressed && { opacity: 0.8 }]}
								>
									<Text style={styles.rowButtonText}>Delete</Text>
								</Pressable>
							</View>
						)}
					/>
				)}
			</SafeAreaView>
		</Modal>
	);
}

/** Web EditProjectModal: name + dimensions, Submit returns to the list. */
function EditProjectForm({ project, onSaved }: { project: Project; onSaved: () => void }) {
	const [name, setName] = useState(project.name);
	const [columns, setColumns] = useState(String(project.columns));
	const [rows, setRows] = useState(String(project.rows));
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	const handleSubmit = async () => {
		if (loading) return;
		const cols = parseInt(columns, 10);
		const rws = parseInt(rows, 10);
		if (!name.trim()) return setError('Please enter a project name.');
		if (!cols || !rws || cols < 1 || rws < 1 || cols > 60 || rws > 60)
			return setError('Columns and rows must be between 1 and 60.');

		setLoading(true);
		setError(null);
		try {
			await api.project.update(project.id, { name: name.trim(), columns: cols, rows: rws });
			onSaved();
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Failed to update project.');
			setLoading(false);
		}
	};

	return (
		<ScrollView contentContainerStyle={styles.formBody} keyboardShouldPersistTaps="handled">
			<Text style={styles.label}>Project name:</Text>
			<TextInput value={name} onChangeText={setName} style={styles.input} placeholderTextColor="#a1a1aa" />

			<Text style={styles.label}>Project Dimensions:</Text>
			<View style={styles.dimensionsRow}>
				<TextInput
					value={columns}
					onChangeText={setColumns}
					keyboardType="number-pad"
					style={[styles.input, { flex: 1 }]}
					placeholder="Columns"
					placeholderTextColor="#a1a1aa"
				/>
				<Text style={styles.dimensionsX}>X</Text>
				<TextInput
					value={rows}
					onChangeText={setRows}
					keyboardType="number-pad"
					style={[styles.input, { flex: 1 }]}
					placeholder="Rows"
					placeholderTextColor="#a1a1aa"
				/>
			</View>

			{error ? <Text style={styles.error}>{error}</Text> : null}

			<Pressable
				onPress={handleSubmit}
				style={({ pressed }) => [styles.submitButton, (pressed || loading) && { opacity: 0.5 }]}
			>
				{loading ? (
					<ActivityIndicator color="#eff6ff" />
				) : (
					<Text style={styles.submitButtonText}>Submit</Text>
				)}
			</Pressable>
		</ScrollView>
	);
}

// Web ModalShell palette: zinc-900 sheet, zinc-200 text.
const styles = StyleSheet.create({
	sheet: { flex: 1, backgroundColor: '#18181b' },
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
		paddingHorizontal: 24,
		paddingTop: 24,
		paddingBottom: 8
	},
	headerTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: '#e4e4e7' },
	listBody: { paddingHorizontal: 24, paddingVertical: 16 },

	row: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10 },
	rowBorder: { borderTopWidth: 1, borderTopColor: '#3f3f46' },
	rowName: { flex: 1, fontSize: 16, color: '#e4e4e7' },
	// Web: yellow-600 bg, yellow-500 border / red-600 bg, red-500 border.
	editButton: {
		borderRadius: 6,
		borderWidth: 1,
		borderColor: '#eab308',
		backgroundColor: '#ca8a04',
		paddingVertical: 5,
		paddingHorizontal: 10
	},
	deleteButton: {
		borderRadius: 6,
		borderWidth: 1,
		borderColor: '#ef4444',
		backgroundColor: '#dc2626',
		paddingVertical: 5,
		paddingHorizontal: 10
	},
	rowButtonText: { color: '#fafafa', fontSize: 14 },

	formBody: { padding: 24, paddingTop: 16, gap: 16 },
	label: { fontSize: 15, color: '#e4e4e7' },
	// Web inputs are light on the dark modal: border-zinc-300 text-zinc-800.
	input: {
		backgroundColor: '#ffffff',
		borderWidth: 1,
		borderColor: '#d4d4d8',
		borderRadius: 6,
		paddingVertical: 10,
		paddingHorizontal: 16,
		fontSize: 16,
		color: '#27272a'
	},
	dimensionsRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
	dimensionsX: { color: '#e4e4e7', fontSize: 15 },
	submitButton: {
		marginTop: 8,
		alignItems: 'center',
		justifyContent: 'center',
		borderRadius: 6,
		borderWidth: 1,
		borderColor: '#3b82f6',
		backgroundColor: '#2563eb',
		padding: 12
	},
	submitButtonText: { color: '#eff6ff', fontSize: 16 },
	error: { color: '#ef4444', fontSize: 14, marginBottom: 8 }
});
