import { Link, router } from 'expo-router';
import { useState } from 'react';
import {
	KeyboardAvoidingView,
	Platform,
	ScrollView,
	StyleSheet,
	Text,
	View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, ErrorText, Field } from '@/components/ui';
import api from '@/lib/api';
import { useSession } from '@/lib/session';
import { colors } from '@/lib/theme';

export default function RegisterScreen() {
	const { signIn } = useSession();
	const [name, setName] = useState('');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	const handleRegister = async () => {
		if (name.trim().length < 2) return setError('Please enter your name (2+ characters).');
		if (!email.trim()) return setError('Please enter your email.');
		if (password.length < 8) return setError('Password must be at least 8 characters.');

		setLoading(true);
		setError(null);
		try {
			const { token } = await api.auth.register(email.trim(), name.trim(), password);
			await signIn(token);
			router.replace('/projects');
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Registration failed.');
		} finally {
			setLoading(false);
		}
	};

	return (
		<SafeAreaView style={styles.safeArea}>
			<KeyboardAvoidingView
				style={{ flex: 1 }}
				behavior={Platform.OS === 'ios' ? 'padding' : undefined}
			>
				<ScrollView
					contentContainerStyle={styles.container}
					keyboardShouldPersistTaps="handled"
				>
					<View style={styles.card}>
						<Text style={styles.title}>Create account</Text>
						<Text style={styles.subtitle}>Join FreeSpeech AAC</Text>

						<Field label="Name" value={name} onChangeText={setName} placeholder="Your name" />
						<Field
							label="Email"
							value={email}
							onChangeText={setEmail}
							autoCapitalize="none"
							autoComplete="email"
							keyboardType="email-address"
							placeholder="you@example.com"
						/>
						<Field
							label="Password"
							value={password}
							onChangeText={setPassword}
							secureTextEntry
							placeholder="At least 8 characters"
							onSubmitEditing={handleRegister}
						/>

						<ErrorText>{error}</ErrorText>

						<Button title="Create account" onPress={handleRegister} loading={loading} />

						<Link href="/login" style={styles.link}>
							Already have an account? Sign in
						</Link>
					</View>
				</ScrollView>
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safeArea: { flex: 1, backgroundColor: colors.background },
	container: {
		flexGrow: 1,
		justifyContent: 'center',
		padding: 24
	},
	card: {
		width: '100%',
		maxWidth: 420,
		alignSelf: 'center',
		gap: 16
	},
	title: {
		fontSize: 30,
		fontWeight: '800',
		color: colors.text,
		textAlign: 'center'
	},
	subtitle: {
		fontSize: 16,
		color: colors.textMuted,
		textAlign: 'center',
		marginBottom: 8
	},
	link: {
		textAlign: 'center',
		color: colors.primaryDark,
		fontSize: 15,
		marginTop: 8
	}
});
