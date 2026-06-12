import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/ui';
import api from '@/lib/api';
import { recoverFromMissingBoard } from '@/lib/board-recovery';
import { useSettings } from '@/lib/settings';
import { colors } from '@/lib/theme';

/** Resolves a project's home page and forwards to the board, like the web's /app/project/[projectId]. */
export default function ProjectIndexScreen() {
	const { projectId } = useLocalSearchParams<{ projectId: string }>();
	const { clearLastVisited } = useSettings();
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!projectId) return;
		let cancelled = false;

		(async () => {
			try {
				const { project } = await api.project.view(projectId);
				const pageId =
					project.homePageId ||
					project.connectedPages?.find((p) => p.tilePage?.name.toLowerCase().trim() === 'home')
						?.tilePageId ||
					project.connectedPages?.[0]?.tilePageId;

				if (!pageId) throw new Error('This project has no pages.');
				if (!cancelled) router.replace(`/project/${projectId}/${pageId}`);
			} catch (e) {
				if (cancelled) return;
				// Stale pointer (deleted project) — route somewhere that exists.
				if (await recoverFromMissingBoard({ projectId })) {
					clearLastVisited();
					return;
				}
				setError(e instanceof Error ? e.message : 'Failed to open project.');
			}
		})();

		return () => {
			cancelled = true;
		};
	}, [projectId, clearLastVisited]);

	return (
		<View style={styles.center}>
			{error ? (
				<>
					<Text style={styles.error}>{error}</Text>
					<Button title="Back to projects" variant="secondary" onPress={() => router.replace('/projects')} />
				</>
			) : (
				<ActivityIndicator size="large" color={colors.primary} />
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	center: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		gap: 16,
		padding: 24,
		backgroundColor: colors.background
	},
	error: { color: colors.danger, fontSize: 16, textAlign: 'center' }
});
