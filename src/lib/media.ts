import api from './api';
import { MEDIA_URL } from './config';

/**
 * Mirror of the web app's image flow: proxy the remote image through the API,
 * upload it to R2 via a presigned URL, and return the permanent media URL.
 */
export async function uploadImageFromUrl(url: string): Promise<string> {
	const filename = url.split('/').pop()?.split('?')[0] || 'image';

	const response = await api.media.fetchFromUrl(url);
	const blob = await response.blob();

	const { presignedUrl, key } = await api.media.presignUpload(filename);

	const uploadResponse = await fetch(presignedUrl, {
		method: 'PUT',
		headers: blob.type ? { 'Content-Type': blob.type } : undefined,
		body: blob
	});

	if (!uploadResponse.ok) throw new Error('Image upload failed');

	return `${MEDIA_URL}/${key}`;
}
