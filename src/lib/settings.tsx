import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { SkinTone } from './types';

const SETTINGS_KEY = 'freespeech_settings';

export type Settings = {
	voiceGenerator: 'elevenlabs' | 'offline';
	elevenLabsVoiceId: string | null;
	elevenLabsVoiceName: string | null;
	offlineVoiceId: string | null;
	speakOnTap: boolean;
	sentenceBuilder: boolean;
	sentenceCopyButton: boolean;
	skinTone: SkinTone;
	lastVisitedProjectId: string | null;
	lastVisitedPageId: string | null;
	/** Home page of the last visited project, so the nav's house button can jump straight to it. */
	lastVisitedHomePageId: string | null;
};

const DEFAULT_SETTINGS: Settings = {
	voiceGenerator: 'elevenlabs',
	elevenLabsVoiceId: null,
	elevenLabsVoiceName: null,
	offlineVoiceId: null,
	speakOnTap: true,
	sentenceBuilder: true,
	sentenceCopyButton: false,
	skinTone: 'medium',
	lastVisitedProjectId: null,
	lastVisitedPageId: null,
	lastVisitedHomePageId: null
};

type SettingsContextValue = {
	settings: Settings;
	updateSettings: (patch: Partial<Settings>) => void;
	/** Forget the last-visited project/page — run on sign-in so a fresh account never inherits another account's board. */
	clearLastVisited: () => void;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function useSettings() {
	const ctx = useContext(SettingsContext);
	if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
	return ctx;
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
	const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

	useEffect(() => {
		AsyncStorage.getItem(SETTINGS_KEY).then((raw) => {
			if (!raw) return;
			try {
				setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(raw) });
			} catch {
				// Corrupt settings — fall back to defaults.
			}
		});
	}, []);

	const updateSettings = useCallback((patch: Partial<Settings>) => {
		setSettings((prev) => {
			const next = { ...prev, ...patch };
			AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(next)).catch(() => {});
			return next;
		});
	}, []);

	const clearLastVisited = useCallback(() => {
		updateSettings({
			lastVisitedProjectId: null,
			lastVisitedPageId: null,
			lastVisitedHomePageId: null
		});
	}, [updateSettings]);

	return (
		<SettingsContext.Provider value={{ settings, updateSettings, clearLastVisited }}>
			{children}
		</SettingsContext.Provider>
	);
}
