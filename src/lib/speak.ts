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

const TTS_CACHE_LIMIT_BYTES = 50 * 1024 * 1024;

/**
 * Best-effort trim of the on-disk TTS cache back to its size cap, oldest
 * clips first. Run once at app launch.
 */
export function pruneTtsCache() {
	try {
		const dir = new Directory(Paths.cache, 'tts');
		if (!dir.exists) return;

		const files = dir.list().filter((entry): entry is File => entry instanceof File);
		let total = files.reduce((sum, file) => sum + file.size, 0);
		if (total <= TTS_CACHE_LIMIT_BYTES) return;

		const oldestFirst = [...files].sort((a, b) => (a.lastModified ?? 0) - (b.lastModified ?? 0));
		for (const file of oldestFirst) {
			if (total <= TTS_CACHE_LIMIT_BYTES) break;
			total -= file.size;
			file.delete();
		}
	} catch (e) {
		// Pruning must never block the app; evicted-anyway is the OS's fallback.
		console.warn('[speak] Failed to prune TTS cache:', e);
	}
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
	// Not response.blob() — RN stores the body as an ArrayBuffer and can't build a Blob from it.
	const bytes = new Uint8Array(await response.arrayBuffer());

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
	} catch (e) {
		// Network/synthesis failure — fall back to on-device speech like the web app.
		console.warn('[speak] ElevenLabs synthesis failed, using device voice:', e);
		await speakOffline(text, settings);
	}
}
