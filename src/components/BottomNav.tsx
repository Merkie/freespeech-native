import { router, usePathname } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/icons/Icon';
import { useBoardUi } from '@/lib/board-ui';
import { useSettings } from '@/lib/settings';

/**
 * The persistent three-button bar from the web app (BottomNavigation.svelte):
 * house = current project's home page, pencil = edit mode, gear = dashboard.
 * Rendered once in the (app) layout, outside the navigation stack, so it
 * never animates with page transitions. Board screens register their edit
 * state via BoardUiContext; with no board mounted the pencil is disabled,
 * like the web app on dashboard routes.
 */
export function BottomNav() {
	const { settings } = useSettings();
	const { boardUi } = useBoardUi();
	const pathname = usePathname();
	const insets = useSafeAreaInsets();

	const onBoard = boardUi !== null;
	const editing = boardUi?.editing ?? false;

	const goHome = () => {
		if (boardUi) {
			if (boardUi.editing) boardUi.exitEditing();
			if (!boardUi.homePageId) return;
			const target = `/project/${boardUi.projectId}/${boardUi.homePageId}` as const;
			if (pathname !== target) router.replace(target);
			return;
		}
		if (!settings.lastVisitedProjectId) return;
		if (settings.lastVisitedHomePageId) {
			router.replace(`/project/${settings.lastVisitedProjectId}/${settings.lastVisitedHomePageId}`);
		} else {
			// No cached home page — go through the project resolver.
			router.replace(`/project/${settings.lastVisitedProjectId}`);
		}
	};

	const goDashboard = () => {
		if (pathname !== '/projects') router.replace('/projects');
	};

	return (
		<View style={[styles.bar, { paddingBottom: 8 + insets.bottom }]}>
			<NavButton
				icon="house-fill"
				active={onBoard && !editing}
				disabled={!onBoard && !settings.lastVisitedProjectId}
				onPress={goHome}
			/>
			<NavButton
				icon="pencil-fill"
				active={onBoard && editing}
				disabled={!boardUi}
				onPress={() => boardUi?.toggleEditing()}
			/>
			<NavButton icon="gear-fill" active={!onBoard} disabled={editing} onPress={goDashboard} />
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
