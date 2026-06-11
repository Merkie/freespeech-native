import { router } from 'expo-router';
import * as Speech from 'expo-speech';
import { useEffect, useState } from 'react';
import {
	ActivityIndicator,
	Alert,
	Pressable,
	ScrollView,
	StyleSheet,
	Switch,
	Text,
	View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '@/lib/api';
import { useSession } from '@/lib/session';
import { useSettings } from '@/lib/settings';
import { speakText } from '@/lib/speak';
import { colors } from '@/lib/theme';
import { SKIN_TONES, type SkinTone } from '@/lib/types';

type VoiceOption = { id: string; name: string };

export default function SettingsScreen() {
	const { user, signOut } = useSession();
	const { settings, updateSettings } = useSettings();

	const [elevenLabsVoices, setElevenLabsVoices] = useState<VoiceOption[] | null>(null);
	const [deviceVoices, setDeviceVoices] = useState<VoiceOption[]>([]);
	const [testing, setTesting] = useState(false);

	useEffect(() => {
		api.tts
			.listVoices()
			.then(({ voices }) =>
				setElevenLabsVoices(
					(voices as any[]).map((voice) => ({
						id: voice.id ?? voice.voice_id,
						name: voice.name
					}))
				)
			)
			.catch(() => setElevenLabsVoices([]));

		Speech.getAvailableVoicesAsync()
			.then((voices) =>
				setDeviceVoices(
					voices
						.filter((voice) => voice.language.toLowerCase().startsWith('en'))
						.map((voice) => ({ id: voice.identifier, name: voice.name }))
				)
			)
			.catch(() => {});
	}, []);

	const testVoice = async () => {
		setTesting(true);
		try {
			await speakText('Hello! This is my voice.', settings);
		} finally {
			setTesting(false);
		}
	};

	const handleSignOut = () => {
		Alert.alert('Sign out', 'Are you sure you want to sign out?', [
			{ text: 'Cancel', style: 'cancel' },
			{
				text: 'Sign out',
				style: 'destructive',
				onPress: async () => {
					await signOut();
					router.replace('/login');
				}
			}
		]);
	};

	const usingElevenLabs = settings.voiceGenerator === 'elevenlabs';

	return (
		<SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
			<View style={styles.header}>
				<Pressable onPress={() => router.back()} style={styles.headerButton}>
					<Text style={styles.headerButtonText}>‹</Text>
				</Pressable>
				<Text style={styles.title}>Settings</Text>
				<View style={{ width: 40 }} />
			</View>

			<ScrollView contentContainerStyle={styles.content}>
				<Text style={styles.sectionTitle}>Voice</Text>
				<View style={styles.card}>
					<View style={styles.segmented}>
						<Pressable
							onPress={() => updateSettings({ voiceGenerator: 'elevenlabs' })}
							style={[styles.segment, usingElevenLabs && styles.segmentActive]}
						>
							<Text style={[styles.segmentText, usingElevenLabs && { color: '#fff' }]}>
								AI voices
							</Text>
						</Pressable>
						<Pressable
							onPress={() => updateSettings({ voiceGenerator: 'offline' })}
							style={[styles.segment, !usingElevenLabs && styles.segmentActive]}
						>
							<Text style={[styles.segmentText, !usingElevenLabs && { color: '#fff' }]}>
								Device voice
							</Text>
						</Pressable>
					</View>

					{usingElevenLabs ? (
						elevenLabsVoices === null ? (
							<ActivityIndicator color={colors.primary} style={{ marginVertical: 16 }} />
						) : elevenLabsVoices.length === 0 ? (
							<Text style={styles.muted}>{"Couldn't load AI voices right now."}</Text>
						) : (
							<View style={styles.voiceList}>
								{elevenLabsVoices.map((voice) => (
									<VoiceRow
										key={voice.id}
										name={voice.name}
										selected={settings.elevenLabsVoiceId === voice.id}
										onPress={() =>
											updateSettings({ elevenLabsVoiceId: voice.id, elevenLabsVoiceName: voice.name })
										}
									/>
								))}
							</View>
						)
					) : (
						<View style={styles.voiceList}>
							<VoiceRow
								name="System default"
								selected={!settings.offlineVoiceId}
								onPress={() => updateSettings({ offlineVoiceId: null })}
							/>
							{deviceVoices.map((voice) => (
								<VoiceRow
									key={voice.id}
									name={voice.name}
									selected={settings.offlineVoiceId === voice.id}
									onPress={() => updateSettings({ offlineVoiceId: voice.id })}
								/>
							))}
						</View>
					)}

					<Pressable onPress={testVoice} disabled={testing} style={styles.testButton}>
						{testing ? (
							<ActivityIndicator color="#fff" />
						) : (
							<Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>🔊 Test voice</Text>
						)}
					</Pressable>
				</View>

				<Text style={styles.sectionTitle}>Behavior</Text>
				<View style={styles.card}>
					<ToggleRow
						label="Speak tiles when tapped"
						value={settings.speakOnTap}
						onChange={(speakOnTap) => updateSettings({ speakOnTap })}
					/>
					<ToggleRow
						label="Sentence builder"
						value={settings.sentenceBuilder}
						onChange={(sentenceBuilder) => updateSettings({ sentenceBuilder })}
					/>
					<ToggleRow
						label="Copy sentence button"
						value={settings.sentenceCopyButton}
						onChange={(sentenceCopyButton) => updateSettings({ sentenceCopyButton })}
					/>
				</View>

				<Text style={styles.sectionTitle}>Symbol skin tone</Text>
				<View style={[styles.card, { flexDirection: 'row', gap: 10, flexWrap: 'wrap' }]}>
					{(Object.keys(SKIN_TONES) as SkinTone[]).map((tone) => (
						<Pressable
							key={tone}
							onPress={() => updateSettings({ skinTone: tone })}
							style={[
								styles.skinSwatch,
								{ backgroundColor: SKIN_TONES[tone] },
								settings.skinTone === tone && styles.skinSwatchActive
							]}
						/>
					))}
				</View>

				<Text style={styles.sectionTitle}>Account</Text>
				<View style={styles.card}>
					{user ? (
						<>
							<Text style={styles.accountName}>{user.name}</Text>
							<Text style={styles.muted}>{user.email}</Text>
						</>
					) : null}
					<Pressable onPress={handleSignOut} style={styles.signOutButton}>
						<Text style={{ color: colors.danger, fontWeight: '700', fontSize: 15 }}>Sign out</Text>
					</Pressable>
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}

function VoiceRow({ name, selected, onPress }: { name: string; selected: boolean; onPress: () => void }) {
	return (
		<Pressable onPress={onPress} style={[styles.voiceRow, selected && { borderColor: colors.primary }]}>
			<Text style={[styles.voiceName, selected && { color: colors.primaryDark }]} numberOfLines={1}>
				{name}
			</Text>
			{selected ? <Text style={{ color: colors.primaryDark, fontSize: 16 }}>✓</Text> : null}
		</Pressable>
	);
}

function ToggleRow({
	label,
	value,
	onChange
}: {
	label: string;
	value: boolean;
	onChange: (value: boolean) => void;
}) {
	return (
		<View style={styles.toggleRow}>
			<Text style={styles.toggleLabel}>{label}</Text>
			<Switch value={value} onValueChange={onChange} trackColor={{ true: colors.primary }} />
		</View>
	);
}

const styles = StyleSheet.create({
	safeArea: { flex: 1, backgroundColor: colors.background },
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: 12,
		paddingVertical: 8
	},
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
	headerButtonText: { fontSize: 22, color: colors.text },
	title: { fontSize: 20, fontWeight: '800', color: colors.text },
	content: { padding: 20, paddingTop: 8, gap: 8, paddingBottom: 48 },
	sectionTitle: {
		fontSize: 14,
		fontWeight: '700',
		color: colors.textMuted,
		textTransform: 'uppercase',
		marginTop: 16
	},
	card: {
		backgroundColor: colors.surface,
		borderRadius: 12,
		borderWidth: 1,
		borderColor: colors.border,
		padding: 14,
		gap: 10
	},
	segmented: {
		flexDirection: 'row',
		backgroundColor: colors.background,
		borderRadius: 10,
		padding: 4,
		gap: 4
	},
	segment: {
		flex: 1,
		paddingVertical: 10,
		borderRadius: 8,
		alignItems: 'center'
	},
	segmentActive: { backgroundColor: colors.primary },
	segmentText: { fontSize: 15, fontWeight: '600', color: colors.text },
	voiceList: { gap: 8, maxHeight: 320 },
	voiceRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		borderWidth: 1,
		borderColor: colors.border,
		borderRadius: 10,
		paddingVertical: 10,
		paddingHorizontal: 14
	},
	voiceName: { fontSize: 15, fontWeight: '500', color: colors.text, flex: 1 },
	testButton: {
		backgroundColor: colors.primary,
		borderRadius: 10,
		paddingVertical: 12,
		alignItems: 'center',
		marginTop: 4
	},
	toggleRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingVertical: 4
	},
	toggleLabel: { fontSize: 15, color: colors.text, flex: 1, paddingRight: 12 },
	skinSwatch: {
		width: 44,
		height: 44,
		borderRadius: 22,
		borderWidth: 2,
		borderColor: 'transparent'
	},
	skinSwatchActive: { borderColor: colors.primaryDark },
	muted: { color: colors.textMuted, fontSize: 14 },
	accountName: { fontSize: 17, fontWeight: '700', color: colors.text },
	signOutButton: { paddingVertical: 10, alignItems: 'center', marginTop: 4 }
});
