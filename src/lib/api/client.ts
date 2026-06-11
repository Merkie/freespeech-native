import { API_URL } from '../config';

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
	authToken = token;
}

export function getAuthToken() {
	return authToken;
}

export class ApiError extends Error {
	status: number;

	constructor(message: string, status: number) {
		super(message);
		this.status = status;
	}
}

type FetchOptions = {
	method?: 'GET' | 'POST' | 'DELETE';
	body?: unknown;
	/** Return the raw Response instead of parsing JSON (for audio/image bytes). */
	raw?: boolean;
};

export async function fetchFromAPI<T = any>(path: string, options: FetchOptions = {}): Promise<T> {
	const { method = 'GET', body, raw = false } = options;

	const response = await fetch(`${API_URL}${path}`, {
		method,
		headers: {
			...(body ? { 'Content-Type': 'application/json' } : {}),
			...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
		},
		body: body ? JSON.stringify(body) : undefined
	});

	if (raw) {
		if (!response.ok) throw new ApiError(`Request failed (${response.status})`, response.status);
		return response as unknown as T;
	}

	let data: any;
	try {
		data = await response.json();
	} catch {
		throw new ApiError(`Request failed (${response.status})`, response.status);
	}

	if (!response.ok) {
		throw new ApiError(data?.error || `Request failed (${response.status})`, response.status);
	}

	return data as T;
}
