import { Redirect, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import { BottomNav } from '@/components/BottomNav';
import { BoardUiProvider } from '@/lib/board-ui';
import { useSession } from '@/lib/session';
import { colors } from '@/lib/theme';

export default function AppLayout() {
	const { token, loading } = useSession();

	if (loading) {
		return (
			<View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
				<ActivityIndicator size="large" color={colors.primary} />
			</View>
		);
	}

	if (!token) {
		return <Redirect href="/login" />;
	}

	// The nav bar lives outside the Stack so page transitions never move it,
	// and screens switch instantly like the web app.
	return (
		<BoardUiProvider>
			{/* Every app screen now has a dark zinc header at the top. */}
			<StatusBar style="light" />
			<View style={{ flex: 1 }}>
				<View style={{ flex: 1 }}>
					<Stack screenOptions={{ headerShown: false, animation: 'none' }} />
				</View>
				<BottomNav />
			</View>
		</BoardUiProvider>
	);
}
