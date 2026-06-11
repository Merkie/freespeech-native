import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import * as Crypto from 'expo-crypto';
import { Directory, File, Paths } from 'expo-file-system';
import * as Speech from 'expo-speech';
import api from './api';
import type { Settings } from './settings';

let audioConfigured = false;
let currentPlayer: AudioPlayer | null = null;

async function configureAudio() {
	if (audioConfigured) return;
	// AAC must speak even when the iOS mute switch is on.
	await setAudioModeAsync({ playsInSilentMode: true });
	audioConfigured = true;
}

/**
 * Matches the web client: single-character words are joined together
 * ("a b c" -> "abc") so TTS doesn't read them as separate letters.
 */
export function joinWordsInSentence(sentence: string) {
	const words = sentence.split(' ');
	const result: string[] = [];
	let i = 0;

	while (i < words.length) {
		if (words[i].length === 1) {
			let joinedWord = words[i];
			while (i + 1 < words.length && words[i + 1].length === 1) {
				joinedWord += words[++i];
			}
			result.push(joinedWord);
		} else {
			result.push(words[i]);
		}
		i++;
	}

	return result.join(' ');
}

const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function base64ToUint8Array(base64: string): Uint8Array {
	const clean = base64.replace(/[^A-Za-z0-9+/]/g, '');
	const byteLength = Math.floor((clean.length * 3) / 4);
	const bytes = new Uint8Array(byteLength);

	let byteIndex = 0;
	for (let i = 0; i < clean.length; i += 4) {
		const c0 = BASE64_CHARS.indexOf(clean[i]);
		const c1 = BASE64_CHARS.indexOf(clean[i + 1]);
		const c2 = clean[i + 2] !== undefined ? BASE64_CHARS.indexOf(clean[i + 2]) : -1;
		const c3 = clean[i + 3] !== undefined ? BASE64_CHARS.indexOf(clean[i + 3]) : -1;

		bytes[byteIndex++] = (c0 << 2) | (c1 >> 4);
		if (c2 >= 0) bytes[byteIndex++] = ((c1 & 15) << 4) | (c2 >> 2);
		if (c3 >= 0) bytes[byteIndex++] = ((c2 & 3) << 6) | c3;
	}

	return bytes;
}

async function blobToUint8Array(blob: Blob): Promise<Uint8Array> {
	const dataUrl = await new Promise<string>((resolve, reject) => {
		const reader = new FileReader();
		reader.onloadend = () => resolve(reader.result as string);
		reader.onerror = () => reject(reader.error);
		reader.readAsDataURL(blob);
	});
	return base64ToUint8Array(dataUrl.slice(dataUrl.indexOf(',') + 1));
}

/**
 * Synthesize via the FreeSpeech API (ElevenLabs) and cache the MP3 on disk.
 * Repeated phrases — the common case in AAC — play instantly from cache.
 */
async function getElevenLabsAudioFile(text: string, voiceId: string): Promise<File> {
	const hash = await Crypto.digestStringAsync(
		Crypto.CryptoDigestAlgorithm.SHA256,
		`${voiceId}:${text}`
	);

	const dir = new Directory(Paths.cache, 'tts');
	const file = new File(dir, `${hash}.mp3`);
	if (file.exists) return file;

	const response = await api.tts.speakElevenLabs(text, voiceId);
	const bytes = await blobToUint8Array(await response.blob());

	dir.create({ intermediates: true, idempotent: true });
	file.create({ overwrite: true });
	file.write(bytes);

	return file;
}

function stopCurrent() {
	Speech.stop();
	if (currentPlayer) {
		try {
			currentPlayer.remove();
		} catch {
			// Player already released.
		}
		currentPlayer = null;
	}
}

function speakOffline(text: string, settings: Settings): Promise<void> {
	return new Promise((resolve) => {
		Speech.speak(text, {
			voice: settings.offlineVoiceId ?? undefined,
			onDone: () => resolve(),
			onStopped: () => resolve(),
			onError: () => resolve()
		});
	});
}

/**
 * Speak text using the configured voice engine.
 * Resolves once playback has started (or finished, for offline speech).
 */
export async function speakText(rawText: string, settings: Settings): Promise<void> {
	const text = joinWordsInSentence(rawText.trim());
	if (!text) return;

	stopCurrent();

	if (settings.voiceGenerator !== 'elevenlabs' || !settings.elevenLabsVoiceId) {
		await speakOffline(text, settings);
		return;
	}

	try {
		await configureAudio();
		const file = await getElevenLabsAudioFile(text, settings.elevenLabsVoiceId);

		const player = createAudioPlayer({ uri: file.uri });
		currentPlayer = player;

		player.addListener('playbackStatusUpdate', (status) => {
			if (status.didJustFinish && currentPlayer === player) {
				stopCurrent();
			}
		});

		player.play();
	} catch {
		// Network/synthesis failure — fall back to on-device speech like the web app.
		await speakOffline(text, settings);
	}
}
