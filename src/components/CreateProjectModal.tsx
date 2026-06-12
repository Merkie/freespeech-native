import { Image } from 'expo-image';
import { useState } from 'react';
import {
	ActivityIndicator,
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
import { MEDIA_URL } from '@/lib/config';
import { fetchOpenBoardFile } from '@/lib/open-board';
import { PROJECT_TEMPLATES, type ProjectTemplate } from '@/lib/templates';
import { Icon } from './icons/Icon';
import type { IconName } from './icons/icon-paths';

type Step = 'type' | 'blank' | 'template';

/**
 * The web app's Create Project modal: pick Blank Project or Use Template,
 * then either name a fresh board or import a pre-made .obz/.obf template.
 * Dark-themed to match the web ModalShell (zinc-900 on zinc-800 cards).
 */
export function CreateProjectModal({
	visible,
	onClose,
	onCreated
}: {
	visible: boolean;
	onClose: () => void;
	onCreated: (projectId: string) => void;
}) {
	const [step, setStep] = useState<Step>('type');

	// Leaving the modal always lands back on the type chooser, like the web modal.
	const handleClose = () => {
		setStep('type');
		onClose();
	};
	const handleCreated = (projectId: string) => {
		setStep('type');
		onCreated(projectId);
	};

	return (
		<Modal visible={visible} animationType="slide" presentationStyle="formSheet" onRequestClose={handleClose}>
			<SafeAreaView style={styles.sheet} edges={['bottom']}>
				<View style={styles.header}>
					{step !== 'type' ? (
						<Pressable onPress={() => setStep('type')} hitSlop={8}>
							<Icon name="arrow-left" size={18} color="#e4e4e7" />
						</Pressable>
					) : null}
					<Text style={styles.headerTitle}>Create Project</Text>
					<Pressable onPress={handleClose} hitSlop={8}>
						<Icon name="x-lg" size={18} color="#e4e4e7" />
					</Pressable>
				</View>

				{step === 'type' ? <TypeStep onPick={setStep} /> : null}
				{step === 'blank' ? <BlankStep onCreated={handleCreated} /> : null}
				{step === 'template' ? <TemplateStep onCreated={handleCreated} /> : null}
			</SafeAreaView>
		</Modal>
	);
}

/** Web ProjectTypeButton: centered icon, title, and description on a zinc-800 card. */
function TypeStep({ onPick }: { onPick: (step: Step) => void }) {
	return (
		<View style={styles.typeGrid}>
			<TypeButton
				icon="plus-square-dotted"
				title="Blank Project"
				description="Start from scratch with an empty project"
				onPress={() => onPick('blank')}
			/>
			<TypeButton
				icon="file-earmark-code"
				title="Use Template"
				description="Choose from pre-made project templates"
				onPress={() => onPick('template')}
			/>
		</View>
	);
}

function TypeButton({
	icon,
	title,
	description,
	onPress
}: {
	icon: IconName;
	title: string;
	description: string;
	onPress: () => void;
}) {
	return (
		<Pressable
			onPress={onPress}
			style={({ pressed }) => [styles.typeButton, pressed && { opacity: 0.8 }]}
		>
			<Icon name={icon} size={48} color="#fafafa" />
			<Text style={styles.typeTitle}>{title}</Text>
			<Text style={styles.typeDescription}>{description}</Text>
		</Pressable>
	);
}

/** Web BlankProjectInner: name + advanced settings (dimensions) behind a toggle. */
function BlankStep({ onCreated }: { onCreated: (projectId: string) => void }) {
	const [name, setName] = useState('');
	const [columns, setColumns] = useState('6');
	const [rows, setRows] = useState('4');
	const [showingAdvanced, setShowingAdvanced] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	const handleCreate = async () => {
		if (loading) return;
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
			await api.project.updateThumbnail(projectId).catch(() => {});
			onCreated(projectId);
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Project creation failed.');
			setLoading(false);
		}
	};

	return (
		<ScrollView contentContainerStyle={styles.stepBody} keyboardShouldPersistTaps="handled">
			<Text style={styles.label}>Project name:</Text>
			<TextInput
				value={name}
				onChangeText={setName}
				style={styles.input}
				placeholder="My communication board"
				placeholderTextColor="#a1a1aa"
			/>

			{showingAdvanced ? (
				<>
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
				</>
			) : (
				<Pressable onPress={() => setShowingAdvanced(true)} style={styles.advancedToggle}>
					<Text style={styles.advancedToggleText}>Show advanced settings</Text>
				</Pressable>
			)}

			{error ? <Text style={styles.error}>{error}</Text> : null}

			<Pressable
				onPress={handleCreate}
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

/** Web TemplateProjectInner: scrollable list of template cards. */
function TemplateStep({ onCreated }: { onCreated: (projectId: string) => void }) {
	const [loadingFile, setLoadingFile] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);

	const handleUseTemplate = async (template: ProjectTemplate) => {
		if (loadingFile) return;
		setLoadingFile(template.file);
		setError(null);

		try {
			// Same pipeline as the web: download from R2, parse client-side, import.
			const boardFile = await fetchOpenBoardFile(MEDIA_URL + template.file);
			if (!boardFile) throw new Error('Template file could not be read.');

			const { projectId } =
				boardFile.type === 'obz'
					? await api.project.import.obz(boardFile.data)
					: await api.project.import.obf(boardFile.data);
			if (!projectId) throw new Error('Project creation failed.');

			await api.project.updateThumbnail(projectId).catch(() => {});
			onCreated(projectId);
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Project creation failed.');
		} finally {
			setLoadingFile(null);
		}
	};

	return (
		<FlatList
			data={PROJECT_TEMPLATES}
			keyExtractor={(template) => template.file}
			contentContainerStyle={styles.stepBody}
			ListHeaderComponent={error ? <Text style={styles.error}>{error}</Text> : null}
			renderItem={({ item: template }) => (
				<TemplateCard
					template={template}
					loading={loadingFile === template.file}
					onUse={() => handleUseTemplate(template)}
				/>
			)}
		/>
	);
}

/** Web TemplateProjectCard: thumbnail, title, creator, description, Use Template. */
function TemplateCard({
	template,
	loading,
	onUse
}: {
	template: ProjectTemplate;
	loading: boolean;
	onUse: () => void;
}) {
	return (
		<View style={styles.templateCard}>
			<View style={styles.templateThumb}>
				<Image source={{ uri: template.thumbnail }} style={{ flex: 1 }} contentFit="contain" />
			</View>
			<Text style={styles.templateTitle}>{template.title}</Text>
			<Text style={styles.templateCreator}>Created by {template.creatorName}</Text>
			<Text style={styles.templateDescription}>{template.description}</Text>
			<Pressable
				onPress={onUse}
				style={({ pressed }) => [styles.templateButton, (pressed || loading) && { opacity: 0.5 }]}
			>
				<Text style={styles.templateButtonText}>
					{loading ? 'Creating Project...' : 'Use Template'}
				</Text>
			</Pressable>
		</View>
	);
}

// Web ModalShell palette: zinc-900 sheet, zinc-200 text, zinc-800 cards.
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
	stepBody: { padding: 24, paddingTop: 16, gap: 16 },

	typeGrid: { padding: 24, paddingTop: 16, gap: 16 },
	typeButton: {
		alignItems: 'center',
		gap: 4,
		borderRadius: 8,
		backgroundColor: '#27272a',
		padding: 24
	},
	typeTitle: { marginTop: 12, fontSize: 20, fontWeight: '600', color: 'rgba(255,255,255,0.8)' },
	typeDescription: { fontSize: 14, color: 'rgba(255,255,255,0.6)', textAlign: 'center' },

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
	advancedToggle: { alignSelf: 'flex-start', paddingVertical: 8 },
	advancedToggleText: { color: '#e4e4e7', fontSize: 13 },
	submitButton: {
		alignItems: 'center',
		justifyContent: 'center',
		borderRadius: 6,
		borderWidth: 1,
		borderColor: '#3b82f6',
		backgroundColor: '#2563eb',
		padding: 12
	},
	submitButtonText: { color: '#eff6ff', fontSize: 16 },
	error: { color: '#ef4444', fontSize: 14 },

	templateCard: { borderRadius: 8, backgroundColor: '#27272a', padding: 16 },
	templateThumb: {
		height: 200,
		borderRadius: 6,
		backgroundColor: '#3f3f46',
		padding: 16,
		marginBottom: 16
	},
	templateTitle: { fontSize: 24, fontWeight: '600', color: '#fafafa' },
	templateCreator: { fontSize: 13, fontStyle: 'italic', color: 'rgba(255,255,255,0.8)' },
	templateDescription: { marginTop: 8, color: 'rgba(255,255,255,0.6)', fontSize: 14 },
	templateButton: {
		marginTop: 16,
		alignItems: 'center',
		borderRadius: 6,
		backgroundColor: '#3b82f6',
		paddingVertical: 10,
		paddingHorizontal: 16
	},
	templateButtonText: { color: '#ffffff', fontSize: 15, fontWeight: '600' }
});
