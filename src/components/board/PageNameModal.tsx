import { useState } from 'react';
import {
	KeyboardAvoidingView,
	Modal,
	Platform,
	Pressable,
	StyleSheet,
	View
} from 'react-native';
import { Button, ErrorText, Field, SheetHeader } from '@/components/ui';
import { colors } from '@/lib/theme';

/** Centered name prompt, mirroring the web's Create Page / Edit Page modals. */
export function PageNameModal({
	title,
	initialName = '',
	submitLabel,
	onSubmit,
	onClose
}: {
	title: string;
	initialName?: string;
	submitLabel: string;
	onSubmit: (name: string) => Promise<void>;
	onClose: () => void;
}) {
	const [name, setName] = useState(initialName);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const submit = async () => {
		const trimmed = name.trim();
		if (!trimmed) return;
		setSaving(true);
		setError(null);
		try {
			await onSubmit(trimmed);
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Failed to save page.');
			setSaving(false);
		}
	};

	return (
		<Modal visible transparent animationType="fade" onRequestClose={onClose}>
			<KeyboardAvoidingView
				style={styles.backdropWrap}
				behavior={Platform.OS === 'ios' ? 'padding' : undefined}
			>
				<Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
				<View style={styles.card}>
					<SheetHeader title={title} onClose={onClose} />
					<Field
						label="Page name"
						value={name}
						onChangeText={setName}
						placeholder="My new page"
						autoFocus
						maxLength={50}
						onSubmitEditing={submit}
					/>
					<ErrorText>{error}</ErrorText>
					<Button title={submitLabel} onPress={submit} loading={saving} disabled={!name.trim()} />
				</View>
			</KeyboardAvoidingView>
		</Modal>
	);
}

const styles = StyleSheet.create({
	backdropWrap: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		padding: 24,
		backgroundColor: 'rgba(0,0,0,0.5)'
	},
	card: {
		width: '100%',
		maxWidth: 420,
		backgroundColor: colors.background,
		borderRadius: 14,
		padding: 20,
		gap: 12
	}
});
