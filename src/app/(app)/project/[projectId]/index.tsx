import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/ui';
import api from '@/lib/api';
import { ApiError } from '@/lib/api/client';
import { recoverFromMissingBoard } from '@/lib/board-recovery';
import { cacheDeleteProject, cacheGet, cacheKeys, cacheSet } from '@/lib/cache';
import { useSettings } from '@/lib/settings';
import { colors } from '@/lib/theme';
import type { Project } from '@/lib/types';

/** The web app's home-page resolution: explicit home page, a page named "home", or the first page. */
function resolveHomePageId(project: Project): string | undefined {
	return (
		project.homePageId ||
		project.connectedPages?.find((p) => p.tilePage?.name.toLowerCase().trim() === 'home')
			?.tilePageId ||
		project.connectedPages?.[0]?.tilePageId ||
		undefined
	);
}

/** Resolves a project's home page and forwards to the board, like the web's /app/project/[projectId]. */
export default function ProjectIndexScreen() {
	const { projectId } = useLocalSearchParams<{ projectId: string }>();
	const { clearLastVisited } = useSettings();
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!projectId) return;
		let cancelled = false;

		(async () => {
			// Cached copy — forward immediately (works offline) and revalidate behind it.
			const cached = await cacheGet<Project>(cacheKeys.project(projectId));
			const cachedPageId = cached ? resolveHomePageId(cached) : undefined;
			if (cachedPageId && !cancelled) {
				router.replace(`/project/${projectId}/${cachedPageId}`);
				api.project
					.view(projectId)
					.then(({ project }) => cacheSet(cacheKeys.project(projectId), project))
					.catch(() => {});
				return;
			}

			try {
				const { project } = await api.project.view(projectId);
				cacheSet(cacheKeys.project(projectId), project);
				const pageId = resolveHomePageId(project);

				if (!pageId) throw new Error('This project has no pages.');
				if (!cancelled) router.replace(`/project/${projectId}/${pageId}`);
			} catch (e) {
				if (cancelled) return;
				// The server said the project is gone — drop its cached data.
				if (e instanceof ApiError) cacheDeleteProject(projectId);
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
