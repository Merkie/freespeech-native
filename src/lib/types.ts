export type User = {
	id: string;
	email: string;
	name: string;
	profileImgUrl: string | null;
	elevenLabsApiKey: string | null;
	usePersonalElevenLabsKey: boolean;
	createdAt: string;
	updatedAt: string;
};

export type Project = {
	id: string;
	userId: string;
	connectedPages?: TilePageInProject[];
	name: string;
	description: string | null;
	imageUrl: string | null;
	columns: number;
	rows: number;
	isPublic: boolean;
	homePageId: string | null;
	createdAt: string;
	updatedAt: string;
};

export type TilePage = {
	id: string;
	tiles?: Tile[];
	userId: string;
	name: string;
	isPublic: boolean;
	createdAt: string;
	updatedAt: string;
};

export type TilePageInProject = {
	id: string;
	tilePage: TilePage;
	tilePageId: string;
	project?: Project;
	projectId: string;
};

export type Tile = {
	id: string;
	tilePageId: string;
	x: number;
	y: number;
	page: number;
	text: string;
	backgroundColor: string;
	borderColor: string;
	image: string;
	navigation: string;
	displayText: string;
	createdAt?: string;
	updatedAt?: string;
};

export type ElevenLabsVoice = {
	id: string;
	name: string;
	category?: string;
	labels?: Record<string, string>;
};

export type ImageSearchResult = {
	alt: string;
	image_url: string;
	thumbnail_url: string;
};

export type SkinTone = 'dark' | 'medium-dark' | 'medium' | 'medium-light' | 'light';

export const SKIN_TONES: Record<SkinTone, string> = {
	dark: '#774837',
	'medium-dark': '#af7450',
	medium: '#d7a481',
	'medium-light': '#f6cc9d',
	light: '#fadbca'
};
