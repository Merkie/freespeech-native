import { fetchFromAPI } from './client';
import type {
	ElevenLabsVoice,
	ImageSearchResult,
	Project,
	Tile,
	TilePage,
	TilePageInProject,
	User
} from '../types';

const auth = {
	login: (email: string, password: string) =>
		fetchFromAPI<{ token: string }>('/auth/login', { method: 'POST', body: { email, password } }),

	register: (email: string, name: string, password: string) =>
		fetchFromAPI<{ token: string }>('/auth/register', {
			method: 'POST',
			body: { email, name, password }
		}),

	me: () => fetchFromAPI<{ user: User }>('/auth/me')
};

const user = {
	update: (body: {
		name?: string;
		profileImgUrl?: string;
		elevenLabsApiKey?: string;
		usePersonalElevenLabsKey?: boolean;
	}) => fetchFromAPI<{ success: boolean }>('/user/update', { method: 'POST', body })
};

const project = {
	list: () => fetchFromAPI<{ projects: Project[] }>('/project/list'),

	create: (body: { name: string; columns: number; rows: number }) =>
		fetchFromAPI<{ success: boolean; projectId?: string }>('/project/create', {
			method: 'POST',
			body
		}),

	view: (projectId: string) => fetchFromAPI<{ project: Project }>(`/project/${projectId}/view`),

	listPages: (projectId: string) =>
		fetchFromAPI<{ pages: TilePage[] }>(`/project/${projectId}/pages`),

	viewPage: (projectId: string, pageId: string) =>
		fetchFromAPI<{ page: TilePageInProject; isHomePage: boolean }>(
			`/project/${projectId}/view-page-in-project`,
			{ method: 'POST', body: { pageId } }
		),

	update: (
		projectId: string,
		body: { name?: string; columns?: number; rows?: number; imageUrl?: string }
	) => fetchFromAPI<{ success: boolean }>(`/project/${projectId}/update`, { method: 'POST', body }),

	delete: (projectId: string) =>
		fetchFromAPI<{ success: boolean }>(`/project/${projectId}/delete`, { method: 'DELETE' }),

	updateThumbnail: (projectId: string) =>
		fetchFromAPI<{ success: boolean }>(`/project/${projectId}/update-thumbnail`, {
			method: 'POST'
		})
};

const page = {
	create: (body: { name: string; projectId: string }) =>
		fetchFromAPI<{ page?: TilePage; success?: boolean; error?: string }>('/page/create', {
			method: 'POST',
			body
		}),

	update: (pageId: string, body: { name: string }) =>
		fetchFromAPI<{ success: boolean }>(`/page/${pageId}/update`, { method: 'POST', body }),

	delete: (pageId: string) =>
		fetchFromAPI<{ message?: string }>(`/page/${pageId}/delete`, { method: 'DELETE' })
};

const tile = {
	create: (body: { x: number; y: number; page: number; pageId: string }) =>
		fetchFromAPI<{ tile?: Tile }>('/tile/create', { method: 'POST', body }),

	edit: (tileId: string, body: Partial<Tile>) =>
		fetchFromAPI<{ success: boolean }>(`/tile/${tileId}/edit`, { method: 'POST', body }),

	delete: (tileId: string) =>
		fetchFromAPI<{ success: boolean }>(`/tile/${tileId}/delete`, { method: 'DELETE' })
};

const tts = {
	listVoices: () =>
		fetchFromAPI<{ voices: ElevenLabsVoice[] }>('/text-to-speech/elevenlabs/list-voices'),

	/** Returns the raw Response whose body is MP3 audio. */
	speakElevenLabs: (text: string, voiceId: string) =>
		fetchFromAPI<Response>('/text-to-speech/elevenlabs/speak', {
			method: 'POST',
			body: { text, voiceId },
			raw: true
		})
};

const media = {
	searchImages: (strategy: 'brave' | 'open-symbols', query: string, skinColor: string) =>
		fetchFromAPI<{ results: ImageSearchResult[] }>(
			`/media/search/${strategy}?q=${encodeURIComponent(query)}&skin=${encodeURIComponent(skinColor)}`
		),

	/** Returns the raw Response whose body is the fetched image. */
	fetchFromUrl: (url: string) =>
		fetchFromAPI<Response>('/media/fetch-from-url', { method: 'POST', body: { url }, raw: true }),

	presignUpload: (filename: string) =>
		fetchFromAPI<{ presignedUrl: string; key: string }>('/media/upload/presign', {
			method: 'POST',
			body: { filename }
		}),

	removeBackground: (imageUrl: string) =>
		fetchFromAPI<{ image_url: string }>('/media/remove-background', {
			method: 'POST',
			body: { image_url: imageUrl }
		})
};

const api = { auth, user, project, page, tile, tts, media };

export default api;
