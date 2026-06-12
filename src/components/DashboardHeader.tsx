import { Image } from 'expo-image';
import { router, usePathname } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon, type IconName } from '@/components/icons/Icon';
import { mediaUrl } from '@/lib/config';
import { useSession } from '@/lib/session';

const TABS: { name: string; icon: IconName; path: '/projects' | '/settings' }[] = [
	{ name: 'Your Projects', icon: 'grid', path: '/projects' },
	{ name: 'Application Settings', icon: 'sliders', path: '/settings' }
];

/**
 * The web app's dashboard header (dashboard/+layout.svelte): a dark zinc bar
 * with underlined tab links and the user's avatar on the right.
 */
export function DashboardHeader() {
	const { user } = useSession();
	const pathname = usePathname();

	const initials = (() => {
		const name = user?.name;
		if (!name) return '';
		const names = name.split(' ');
		if (names.length === 1) return names[0].charAt(0);
		return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
	})();

	const profileUrl = mediaUrl(user?.profileImgUrl);

	return (
		<View style={styles.bar}>
			{TABS.map((tab) => {
				const active = pathname.startsWith(tab.path);
				return (
					<Pressable
						key={tab.path}
						onPress={() => {
							if (!active) router.replace(tab.path);
						}}
						style={[styles.tab, active && styles.tabActive]}
					>
						<Icon name={tab.icon} size={20} color={active ? '#f4f4f5' : '#71717a'} />
						<Text style={[styles.tabText, active && styles.tabTextActive]} numberOfLines={1}>
							{tab.name}
						</Text>
					</Pressable>
				);
			})}
			<View style={{ flex: 1 }} />
			<View style={styles.avatarWrap}>
				{profileUrl ? (
					<Image source={{ uri: profileUrl }} style={styles.avatar} contentFit="cover" />
				) : (
					<View style={[styles.avatar, styles.avatarFallback]}>
						<Text style={styles.avatarInitials}>{initials}</Text>
					</View>
				)}
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	// Web: flex items-center gap-2 bg-zinc-900 font-light text-zinc-100
	bar: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
		backgroundColor: '#18181b'
	},
	// Web: flex items-center gap-4 border-b-4 p-3 px-4 — padding and type bumped
	// up a bit for touch targets and readability.
	tab: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
		paddingVertical: 16,
		paddingHorizontal: 20,
		borderBottomWidth: 4,
		borderBottomColor: 'transparent'
	},
	tabActive: { borderBottomColor: '#52525b' },
	tabText: { fontSize: 17, fontWeight: '400', color: '#71717a' },
	tabTextActive: { color: '#f4f4f5' },
	avatarWrap: { paddingHorizontal: 16 },
	avatar: {
		width: 40,
		height: 40,
		borderRadius: 20,
		backgroundColor: '#ffffff'
	},
	avatarFallback: {
		backgroundColor: '#3b82f6',
		alignItems: 'center',
		justifyContent: 'center'
	},
	avatarInitials: { color: '#eff6ff', fontSize: 12, fontWeight: '700' }
});
