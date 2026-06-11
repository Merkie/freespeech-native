import { Redirect, Stack } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
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

	return <Stack screenOptions={{ headerShown: false }} />;
}
