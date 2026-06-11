import * as SecureStore from 'expo-secure-store';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import api from './api';
import { setAuthToken } from './api/client';
import type { User } from './types';

const TOKEN_KEY = 'freespeech_token';

type Session = {
	token: string | null;
	user: User | null;
	/** True while the persisted token is being restored on launch. */
	loading: boolean;
	signIn: (token: string) => Promise<void>;
	signOut: () => Promise<void>;
	refreshUser: () => Promise<void>;
};

const SessionContext = createContext<Session | null>(null);

export function useSession() {
	const session = useContext(SessionContext);
	if (!session) throw new Error('useSession must be used within SessionProvider');
	return session;
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
	const [token, setToken] = useState<string | null>(null);
	const [user, setUser] = useState<User | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		(async () => {
			try {
				const stored = await SecureStore.getItemAsync(TOKEN_KEY);
				if (stored) {
					setAuthToken(stored);
					const { user: me } = await api.auth.me();
					setToken(stored);
					setUser(me);
				}
			} catch {
				// Token invalid or network down at launch — stay signed out.
				setAuthToken(null);
				await SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => {});
			} finally {
				setLoading(false);
			}
		})();
	}, []);

	const signIn = useCallback(async (newToken: string) => {
		setAuthToken(newToken);
		await SecureStore.setItemAsync(TOKEN_KEY, newToken);
		const { user: me } = await api.auth.me();
		setToken(newToken);
		setUser(me);
	}, []);

	const signOut = useCallback(async () => {
		setAuthToken(null);
		await SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => {});
		setToken(null);
		setUser(null);
	}, []);

	const refreshUser = useCallback(async () => {
		const { user: me } = await api.auth.me();
		setUser(me);
	}, []);

	return (
		<SessionContext.Provider value={{ token, user, loading, signIn, signOut, refreshUser }}>
			{children}
		</SessionContext.Provider>
	);
}
