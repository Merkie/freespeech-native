import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SessionProvider } from '@/lib/session';
import { SettingsProvider } from '@/lib/settings';

export default function RootLayout() {
	return (
		<SessionProvider>
			<SettingsProvider>
				<StatusBar style="dark" />
				<Stack screenOptions={{ headerShown: false }} />
			</SettingsProvider>
		</SessionProvider>
	);
}
