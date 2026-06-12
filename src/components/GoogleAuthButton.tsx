import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { Icon } from '@/components/icons/Icon';
import api from '@/lib/api';
import { OAUTH_CALLBACK, WEB_URL } from '@/lib/config';
import { useSession } from '@/lib/session';
import { useSettings } from '@/lib/settings';
import { colors } from '@/lib/theme';

/**
 * "Continue with Google" via the web app's existing OAuth flow: Google's
 * callback lands on freespeechaac.com/oauth/google, which sees state=app and
 * hands the token back through the freespeechaac:// scheme.
 */
export function GoogleAuthButton({ onError }: { onError: (message: string) => void }) {
	const { signIn } = useSession();
	const { clearLastVisited } = useSettings();
	const [loading, setLoading] = useState(false);

	const handlePress = async () => {
		setLoading(true);
		try {
			const { google } = await api.auth.oauthUrls(WEB_URL, 'app');
			const result = await WebBrowser.openAuthSessionAsync(google, OAUTH_CALLBACK);
			if (result.type !== 'success') return; // User closed the sheet.

			const { queryParams } = Linking.parse(result.url);
			const token = typeof queryParams?.token === 'string' ? queryParams.token : null;
			if (!token) throw new Error('Google sign-in failed.');

			await signIn(token);
			// A different account may sign in — don't inherit the old one's last board.
			clearLastVisited();
			router.replace('/projects');
		} catch (e) {
			onError(e instanceof Error ? e.message : 'Google sign-in failed.');
		} finally {
			setLoading(false);
		}
	};

	return (
		<Pressable
			onPress={handlePress}
			disabled={loading}
			style={({ pressed }) => [styles.button, (pressed || loading) && { opacity: 0.7 }]}
		>
			{loading ? (
				<ActivityIndicator size={18} color={colors.text} />
			) : (
				<Icon name="google" size={18} color={colors.text} />
			)}
			<Text style={styles.label}>Continue with Google</Text>
		</Pressable>
	);
}

const styles = StyleSheet.create({
	button: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 10,
		backgroundColor: colors.surface,
		borderWidth: 1,
		borderColor: colors.border,
		borderRadius: 10,
		paddingVertical: 14,
		paddingHorizontal: 18
	},
	label: { color: colors.text, fontSize: 16, fontWeight: '600' }
});
