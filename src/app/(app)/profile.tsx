import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import {
	ActivityIndicator,
	Alert,
	Modal,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	useWindowDimensions,
	View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DashboardHeader } from '@/components/DashboardHeader';
import { Icon } from '@/components/icons/Icon';
import api from '@/lib/api';
import { mediaUrl } from '@/lib/config';
import { uploadImageFromDevice } from '@/lib/media';
import { useSession } from '@/lib/session';
import { colors } from '@/lib/theme';

/** The web app's profile page (dashboard/profile/+page.svelte). */
export default function ProfileScreen() {
	const { user, signOut, refreshUser } = useSession();
	const { width } = useWindowDimensions();
	const isWide = width >= 640;

	const [name, setName] = useState(user?.name ?? '');
	const [savingName, setSavingName] = useState(false);
	const [uploadOpen, setUploadOpen] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const initials = (() => {
		const fullName = user?.name;
		if (!fullName) return '';
		const names = fullName.split(' ');
		if (names.length === 1) return names[0].charAt(0);
		return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
	})();

	const profileUrl = mediaUrl(user?.profileImgUrl);
	const nameChanged = !!name.trim() && name.trim() !== user?.name;

	const handleSubmitName = async () => {
		setSavingName(true);
		setError(null);
		try {
			await api.user.update({ name: name.trim() });
			await refreshUser();
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Failed to update your name.');
		} finally {
			setSavingName(false);
		}
	};

	const handleLogout = () => {
		Alert.alert('Logout', 'Are you sure you want to log out?', [
			{ text: 'Cancel', style: 'cancel' },
			{
				text: 'Logout',
				style: 'destructive',
				onPress: async () => {
					await signOut();
					router.replace('/login');
				}
			}
		]);
	};

	return (
		<SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
			<DashboardHeader />

			<ScrollView style={styles.body} contentContainerStyle={styles.content}>
				<View style={[styles.columns, !isWide && { flexDirection: 'column' }]}>
					<View style={[styles.identity, !isWide && { alignSelf: 'center', alignItems: 'center' }]}>
						{profileUrl ? (
							<Image source={{ uri: profileUrl }} style={styles.avatar} contentFit="cover" />
						) : (
							<View style={[styles.avatar, styles.avatarFallback]}>
								<Text style={styles.avatarInitials}>{initials}</Text>
							</View>
						)}
						<Text style={styles.identityName}>{user?.name}</Text>
						<Text style={styles.identityEmail}>{user?.email}</Text>
						<Pressable onPress={handleLogout} style={styles.logoutButton}>
							<Text style={styles.logoutButtonText}>Logout</Text>
						</Pressable>
					</View>

					<View style={styles.form}>
						<Text style={styles.label}>Email</Text>
						<TextInput
							value={user?.email ?? ''}
							editable={false}
							style={[styles.input, { opacity: 0.75 }]}
						/>

						<Text style={styles.label}>Name</Text>
						<TextInput value={name} onChangeText={setName} style={styles.input} />

						{nameChanged ? (
							<Pressable
								onPress={handleSubmitName}
								disabled={savingName}
								style={[styles.submitButton, savingName && { opacity: 0.5 }]}
							>
								{savingName ? (
									<ActivityIndicator size={16} color="#eff6ff" />
								) : (
									<Text style={styles.submitButtonText}>Submit Changes</Text>
								)}
							</Pressable>
						) : null}

						<Text style={styles.label}>Profile Picture</Text>
						<Pressable onPress={() => setUploadOpen(true)} style={styles.uploadButton}>
							<Icon name="image" size={16} color={colors.textMuted} />
							<Text style={styles.uploadButtonText}>Upload Profile Picture</Text>
						</Pressable>

						{error ? <Text style={styles.error}>{error}</Text> : null}
					</View>
				</View>
			</ScrollView>

			{uploadOpen ? (
				<UploadProfilePictureModal
					onClose={() => setUploadOpen(false)}
					onUploaded={async (url) => {
						await api.user.update({ profileImgUrl: url });
						await refreshUser();
						setUploadOpen(false);
					}}
				/>
			) : null}
		</SafeAreaView>
	);
}

/** The web's ModalUploadProfilePicture: pick, preview in a circle, submit. */
function UploadProfilePictureModal({
	onClose,
	onUploaded
}: {
	onClose: () => void;
	onUploaded: (url: string) => Promise<void>;
}) {
	const [preview, setPreview] = useState<ImagePicker.ImagePickerAsset | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const pickImage = async () => {
		const picked = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ['images'],
			allowsEditing: true,
			aspect: [1, 1],
			quality: 0.8
		});
		const asset = picked.assets?.[0];
		if (asset) setPreview(asset);
	};

	const handleUpload = async () => {
		if (!preview || loading) return;
		setLoading(true);
		setError(null);
		try {
			const url = await uploadImageFromDevice(
				preview.uri,
				preview.fileName ?? 'profile.png',
				preview.mimeType
			);
			await onUploaded(url);
		} catch {
			setError('Upload failed — try again.');
			setLoading(false);
		}
	};

	return (
		<Modal visible transparent animationType="fade" onRequestClose={onClose}>
			<Pressable style={modalStyles.backdrop} onPress={onClose}>
				<Pressable style={modalStyles.card} onPress={() => {}}>
					<View style={modalStyles.header}>
						<Text style={modalStyles.title}>Upload Profile Picture</Text>
						<Pressable onPress={onClose} hitSlop={8}>
							<Icon name="x-lg" size={16} color="#e4e4e7" />
						</Pressable>
					</View>

					{preview ? (
						<>
							<View style={{ alignItems: 'center' }}>
								<Image
									source={{ uri: preview.uri }}
									style={modalStyles.preview}
									contentFit="cover"
								/>
								<Pressable
									onPress={() => setPreview(null)}
									disabled={loading}
									style={modalStyles.trashButton}
								>
									<Icon name="trash" size={14} color="#fff" />
									<Text style={modalStyles.trashButtonText}>Trash</Text>
								</Pressable>
							</View>
							<Pressable
								onPress={handleUpload}
								disabled={loading}
								style={[modalStyles.submitButton, loading && { opacity: 0.5 }]}
							>
								{loading ? (
									<ActivityIndicator size={16} color="#eff6ff" />
								) : (
									<Text style={modalStyles.submitButtonText}>Submit</Text>
								)}
							</Pressable>
						</>
					) : (
						<Pressable onPress={pickImage} style={modalStyles.dropzone}>
							<Icon name="download" size={48} color="#ffffff" />
							<Text style={modalStyles.dropzoneTitle}>Tap to choose a photo</Text>
							<Text style={modalStyles.dropzoneHint}>(image files only)</Text>
						</Pressable>
					)}

					{error ? <Text style={modalStyles.error}>{error}</Text> : null}
				</Pressable>
			</Pressable>
		</Modal>
	);
}

const styles = StyleSheet.create({
	safeArea: { flex: 1, backgroundColor: '#18181b' },
	body: { flex: 1, backgroundColor: colors.background },
	content: { padding: 16, alignItems: 'center' },
	columns: { flexDirection: 'row', gap: 16, width: '100%', maxWidth: 1000 },
	identity: { alignItems: 'flex-start', padding: 8 },
	avatar: { width: 150, height: 150, borderRadius: 75, backgroundColor: '#ffffff' },
	avatarFallback: { backgroundColor: '#3b82f6', alignItems: 'center', justifyContent: 'center' },
	avatarInitials: { color: '#eff6ff', fontSize: 30, fontWeight: '700' },
	identityName: { marginTop: 8, fontSize: 18, fontWeight: '500', color: colors.text },
	identityEmail: { fontSize: 14, color: colors.text },
	logoutButton: {
		marginTop: 8,
		width: 200,
		backgroundColor: '#dc2626',
		borderWidth: 1,
		borderColor: '#ef4444',
		borderRadius: 6,
		paddingVertical: 6,
		alignItems: 'center'
	},
	logoutButtonText: { color: '#fef2f2', fontSize: 14 },
	form: { flex: 1, paddingHorizontal: 8, gap: 8 },
	label: { fontSize: 18, color: colors.text, marginTop: 8 },
	input: {
		backgroundColor: '#ffffff',
		borderWidth: 1,
		borderColor: colors.border,
		borderRadius: 6,
		paddingVertical: 8,
		paddingHorizontal: 16,
		fontSize: 16,
		color: '#27272a'
	},
	submitButton: {
		marginTop: 8,
		backgroundColor: '#3b82f6',
		borderWidth: 1,
		borderColor: '#60a5fa',
		borderRadius: 6,
		paddingVertical: 8,
		paddingHorizontal: 16,
		alignItems: 'center'
	},
	submitButtonText: { color: '#eff6ff', fontSize: 15 },
	uploadButton: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 8,
		backgroundColor: colors.backgroundAlt,
		borderWidth: 1,
		borderColor: colors.border,
		borderRadius: 6,
		paddingVertical: 8,
		paddingHorizontal: 16
	},
	uploadButtonText: { color: colors.textMuted, fontSize: 15 },
	error: { color: colors.danger, fontSize: 14, marginTop: 8 }
});

const modalStyles = StyleSheet.create({
	backdrop: {
		flex: 1,
		backgroundColor: 'rgba(0,0,0,0.75)',
		alignItems: 'center',
		justifyContent: 'center',
		padding: 24
	},
	card: {
		width: '100%',
		maxWidth: 500,
		backgroundColor: '#18181b',
		borderWidth: 1,
		borderColor: '#27272a',
		borderRadius: 12,
		padding: 24
	},
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginBottom: 8
	},
	title: { fontSize: 18, fontWeight: '700', color: '#e4e4e7' },
	dropzone: {
		alignItems: 'center',
		padding: 50,
		borderWidth: 2,
		borderStyle: 'dashed',
		borderColor: '#3f3f46',
		backgroundColor: 'rgba(39,39,42,0.5)',
		borderRadius: 12
	},
	dropzoneTitle: { marginTop: 16, fontSize: 20, fontWeight: '600', color: '#ffffff' },
	dropzoneHint: { marginTop: 8, fontSize: 13, color: 'rgba(255,255,255,0.6)' },
	preview: { width: 200, height: 200, borderRadius: 100, backgroundColor: '#ffffff' },
	trashButton: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 6,
		marginVertical: 8,
		backgroundColor: '#ef4444',
		borderRadius: 6,
		paddingVertical: 8,
		paddingHorizontal: 16
	},
	trashButtonText: { color: '#ffffff', fontSize: 14, fontWeight: '600' },
	submitButton: {
		marginTop: 16,
		backgroundColor: '#2563eb',
		borderWidth: 1,
		borderColor: '#3b82f6',
		borderRadius: 6,
		paddingVertical: 8,
		alignItems: 'center'
	},
	submitButtonText: { color: '#eff6ff', fontSize: 15 },
	error: { color: '#f87171', fontSize: 14, marginTop: 12, textAlign: 'center' }
});
