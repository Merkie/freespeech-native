// Note: api.freespeechaac.com returns Cloudflare 521 (dead origin) as of June 2026.
// The live API is the nginx vhost on archers-server proxying to the freespeech-api service.
export const API_URL = 'https://freespeech-api.archers.tools';
export const MEDIA_URL = 'https://media.freespeechaac.com';
/** The web app — Google OAuth round-trips through its /oauth/google callback. */
export const WEB_URL = 'https://www.freespeechaac.com';
/** Custom scheme the web callback redirects to with the token (state=app). */
export const OAUTH_CALLBACK = 'freespeechaac://auth';

/** Resolve a stored image reference (full URL or R2 key) to a displayable URL. */
export function mediaUrl(ref: string | null | undefined): string | null {
	if (!ref) return null;
	if (ref.startsWith('http')) return ref;
	return `${MEDIA_URL}${ref.startsWith('/') ? '' : '/'}${ref}`;
}
