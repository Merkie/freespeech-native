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
import { GoogleAuthButton } from '@/components/GoogleAuthButton';
import { Button, ErrorText, Field } from '@/components/ui';
import api from '@/lib/api';
import { useSession } from '@/lib/session';
import { useSettings } from '@/lib/settings';
import { colors } from '@/lib/theme';

export default function LoginScreen() {
	const { signIn } = useSession();
	const { clearLastVisited } = useSettings();
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	const handleLogin = async () => {
		if (!email.trim() || !password) {
			setError('Please enter your email and password.');
			return;
		}
		setLoading(true);
		setError(null);
		try {
			const { token } = await api.auth.login(email.trim(), password);
			await signIn(token);
			// A different account may sign in — don't inherit the old one's last board.
			clearLastVisited();
			router.replace('/projects');
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Login failed.');
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
						<Text style={styles.title}>FreeSpeech</Text>
						<Text style={styles.subtitle}>Sign in to your account</Text>

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
							placeholder="••••••••"
							onSubmitEditing={handleLogin}
						/>

						<ErrorText>{error}</ErrorText>

						<Button title="Sign in" onPress={handleLogin} loading={loading} />

						<View style={styles.dividerRow}>
							<View style={styles.dividerLine} />
							<Text style={styles.dividerText}>or</Text>
							<View style={styles.dividerLine} />
						</View>

						<GoogleAuthButton onError={setError} />

						<Link href="/register" style={styles.link}>
							New to FreeSpeech? Create an account
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
		fontSize: 34,
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
	},
	dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
	dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
	dividerText: { color: colors.textFaint, fontSize: 13 }
});
