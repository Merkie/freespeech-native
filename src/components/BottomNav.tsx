import { router, usePathname } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/icons/Icon';
import { useSettings } from '@/lib/settings';

/**
 * The persistent three-button bar from the web app (BottomNavigation.svelte):
 * house = current project's home page, pencil = edit mode, gear = dashboard.
 * Board screens pass `editing`/`onToggleEdit`/`onExitEdit`; dashboard screens
 * render it bare, which leaves the pencil disabled like the web app.
 */
export function BottomNav({
	editing = false,
	onToggleEdit,
	onExitEdit
}: {
	editing?: boolean;
	onToggleEdit?: () => void;
	onExitEdit?: () => void;
}) {
	const { settings } = useSettings();
	const pathname = usePathname();
	const insets = useSafeAreaInsets();

	const onDashboard = pathname.startsWith('/projects') || pathname.startsWith('/settings');
	const onBoard = !onDashboard;

	const goHome = () => {
		if (editing) onExitEdit?.();
		if (settings.lastVisitedProjectId) {
			// The project root resolves to its home page.
			router.replace(`/project/${settings.lastVisitedProjectId}`);
		}
	};

	return (
		<View style={[styles.bar, { paddingBottom: 8 + insets.bottom }]}>
			<NavButton
				icon="house-fill"
				active={onBoard && !editing}
				disabled={!settings.lastVisitedProjectId}
				onPress={goHome}
			/>
			<NavButton
				icon="pencil-fill"
				active={onBoard && editing}
				disabled={!onToggleEdit}
				onPress={() => onToggleEdit?.()}
			/>
			<NavButton
				icon="gear-fill"
				active={onDashboard}
				disabled={editing}
				onPress={() => router.replace('/projects')}
			/>
		</View>
	);
}

function NavButton({
	icon,
	active,
	disabled,
	onPress
}: {
	icon: 'house-fill' | 'pencil-fill' | 'gear-fill';
	active: boolean;
	disabled?: boolean;
	onPress: () => void;
}) {
	return (
		<Pressable
			onPress={onPress}
			disabled={disabled}
			style={[styles.button, active && styles.buttonActive, disabled && { opacity: 0.5 }]}
		>
			<Icon name={icon} size={22} color="#fafafa" />
		</Pressable>
	);
}

const styles = StyleSheet.create({
	bar: {
		flexDirection: 'row',
		gap: 8,
		padding: 8,
		backgroundColor: '#18181b',
		borderTopWidth: 1,
		borderTopColor: '#3f3f46'
	},
	button: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: 8,
		borderRadius: 6
	},
	buttonActive: { backgroundColor: '#27272a' }
});
