import { File } from 'expo-file-system';
import api from './api';
import { MEDIA_URL } from './config';

/**
 * Mirror of the web app's image flow: proxy the remote image through the API,
 * upload it to R2 via a presigned URL, and return the permanent media URL.
 */
export async function uploadImageFromUrl(url: string): Promise<string> {
	const filename = url.split('/').pop()?.split('?')[0] || 'image';

	const response = await api.media.fetchFromUrl(url);
	// Not response.blob() — RN stores the body as an ArrayBuffer and can't build a Blob from it.
	const body = await response.arrayBuffer();
	const contentType = response.headers.get('content-type');

	const { presignedUrl, key } = await api.media.presignUpload(filename);

	const uploadResponse = await fetch(presignedUrl, {
		method: 'PUT',
		headers: contentType ? { 'Content-Type': contentType } : undefined,
		body
	});

	if (!uploadResponse.ok) throw new Error('Image upload failed');

	return `${MEDIA_URL}/${key}`;
}

/**
 * Upload an image picked from the device (a local file:// URI) to R2 via a
 * presigned URL — the native equivalent of the web app's file-input upload.
 */
export async function uploadImageFromDevice(
	uri: string,
	filename: string,
	mimeType?: string
): Promise<string> {
	const bytes = await new File(uri).bytes();

	const { presignedUrl, key } = await api.media.presignUpload(filename);

	const uploadResponse = await fetch(presignedUrl, {
		method: 'PUT',
		headers: mimeType ? { 'Content-Type': mimeType } : undefined,
		body: bytes
	});

	if (!uploadResponse.ok) throw new Error('Image upload failed');

	return `${MEDIA_URL}/${key}`;
}
