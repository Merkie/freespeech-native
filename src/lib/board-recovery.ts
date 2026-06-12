import { router } from 'expo-router';
import api from './api';

/**
 * A board failed to load — usually a stale pointer to a deleted project or
 * page. Route to the best surviving destination: the same project's current
 * home page (when just the page is gone), another project, or the project
 * list. Returns false when recovery isn't possible (e.g. offline) so the
 * caller can show its error state instead.
 */
export async function recoverFromMissingBoard(opts: {
	projectId?: string;
	pageId?: string;
}): Promise<boolean> {
	try {
		const { projects } = await api.project.list();

		// The project still exists — a page was deleted out from under us.
		const current = projects.find((p) => p.id === opts.projectId);
		if (current?.homePageId && opts.pageId && current.homePageId !== opts.pageId) {
			router.replace(`/project/${current.id}/${current.homePageId}`);
			return true;
		}

		// Otherwise open the first project that isn't the one that just failed.
		const other = projects.find((p) => p.id !== opts.projectId);
		if (other) {
			router.replace(`/project/${other.id}`);
			return true;
		}

		router.replace('/projects');
		return true;
	} catch {
		return false;
	}
}
