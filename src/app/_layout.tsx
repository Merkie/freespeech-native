import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SessionProvider } from '@/lib/session';
import { SettingsProvider } from '@/lib/settings';
import { pruneTtsCache } from '@/lib/speak';

export default function RootLayout() {
	useEffect(() => {
		pruneTtsCache();
	}, []);

	return (
		<SessionProvider>
			<SettingsProvider>
				<StatusBar style="dark" />
				<Stack screenOptions={{ headerShown: false }} />
			</SettingsProvider>
		</SessionProvider>
	);
}
