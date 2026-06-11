import React, { createContext, useContext, useState } from 'react';

/**
 * Edit-mode state and handlers the active board screen registers so the
 * layout-level BottomNav (which lives outside the navigation stack) can
 * drive editing. Null whenever no board screen is mounted.
 */
export type BoardUi = {
	projectId: string;
	homePageId: string | null;
	editing: boolean;
	toggleEditing: () => void;
	exitEditing: () => void;
};

type BoardUiContextValue = {
	boardUi: BoardUi | null;
	setBoardUi: (boardUi: BoardUi | null) => void;
};

const BoardUiContext = createContext<BoardUiContextValue | null>(null);

export function useBoardUi() {
	const ctx = useContext(BoardUiContext);
	if (!ctx) throw new Error('useBoardUi must be used within BoardUiProvider');
	return ctx;
}

export function BoardUiProvider({ children }: { children: React.ReactNode }) {
	const [boardUi, setBoardUi] = useState<BoardUi | null>(null);
	return <BoardUiContext.Provider value={{ boardUi, setBoardUi }}>{children}</BoardUiContext.Provider>;
}
