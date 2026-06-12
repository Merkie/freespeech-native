import JSZip from 'jszip';

/**
 * Open Board Format file handling, ported from the web app's
 * handle-open-board-files.ts. An .obz is a zip of .obf JSON boards plus a
 * manifest; an .obf is a single JSON board. Files are parsed client-side and
 * the JSON is posted to the API's /project/import/{obz,obf} endpoints.
 */

export type OBZData = {
	manifest: { root: string };
	obfFiles: { fileName: string; data: unknown }[];
};

export type OpenBoardFile = { type: 'obz'; data: OBZData } | { type: 'obf'; data: unknown };

export async function fetchOpenBoardFile(url: string): Promise<OpenBoardFile | undefined> {
	const response = await fetch(url);
	if (!response.ok) throw new Error(`Template download failed (${response.status}).`);

	if (url.endsWith('.obz')) {
		const zip = await new JSZip().loadAsync(await response.arrayBuffer());

		const manifestFile = await zip.file('manifest.json')?.async('string');
		if (!manifestFile) return undefined;
		const manifest = JSON.parse(manifestFile) as { root?: string };
		if (!manifest?.root) return undefined;

		const obfNames = Object.keys(zip.files).filter((name) => name.endsWith('.obf'));
		const obfFiles = await Promise.all(
			obfNames.map(async (fileName) => ({
				fileName,
				data: JSON.parse(await zip.file(fileName)!.async('string')) as unknown
			}))
		);

		return { type: 'obz', data: { manifest: manifest as { root: string }, obfFiles } };
	}

	if (url.endsWith('.obf')) {
		return { type: 'obf', data: (await response.json()) as unknown };
	}

	return undefined;
}
