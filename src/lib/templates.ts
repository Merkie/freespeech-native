/**
 * Project templates, mirroring the web app's TemplateProjectInner.svelte.
 * The .obz/.obf files live in R2 under /template-projects/ (MEDIA_URL).
 */
export type ProjectTemplate = {
	thumbnail: string;
	title: string;
	description: string;
	creatorName: string;
	/** R2 path of the .obz/.obf file, relative to MEDIA_URL. */
	file: string;
};

export const PROJECT_TEMPLATES: ProjectTemplate[] = [
	{
		thumbnail: 'https://www.openboardformat.org/previews/communikate-20.png',
		title: 'CommuniKate 20',
		description:
			'CommuniKate 20 is a functional communication board with 20 buttons per board created by Kate McCallum for the adult population of communicators that she serves.',
		creatorName: 'Kate McCallum',
		file: '/template-projects/communikate-20.obz'
	},
	{
		thumbnail: 'https://www.openboardformat.org/previews/communikate-12.png',
		title: 'CommuniKate 12',
		description:
			'CommuniKate 12 is a smaller version of CommuniKate 20, it has only 12 buttons per board but offers the same style of layout and functional style of communication.',
		creatorName: 'Kate McCallum',
		file: '/template-projects/ck12.obz'
	},
	{
		thumbnail: 'https://www.openboardformat.org/previews/project-core.png',
		title: 'Project Core',
		description:
			'Project core is a research-based initiative to ensure all communicators have at least one option for beginning core-base communication.',
		creatorName: 'UNC Chapel Hill',
		file: '/template-projects/project-core.obf'
	},
	{
		thumbnail: 'https://www.openboardformat.org/previews/quick-core-24.png',
		title: 'Quick Core 24',
		description:
			'Quick Core 24 is a core, motor-planning based vocabulary set with up to 24 buttons per board. It has built-in progression to gradually expand the vocabulary over time.',
		creatorName: 'OpenAAC',
		file: '/template-projects/quick-core-24.obz'
	},
	{
		thumbnail: 'https://s3.amazonaws.com/opensymbols/libraries/extras/quick-core-40.svg',
		title: 'Quick Core 40',
		description:
			'Quick Core 40 is a core, motor-planning based vocabulary set with up to 40 buttons per board. It has built-in progression to gradually expand the vocabulary over time.',
		creatorName: 'OpenAAC',
		file: '/template-projects/quick-core-40.obz'
	},
	{
		thumbnail: 'https://www.openboardformat.org/previews/quick-core-60.png',
		title: 'Quick Core 60',
		description:
			'Quick Core 60 is a core, motor-planning based vocabulary set with up to 60 buttons per board. It has built-in progression to gradually expand the vocabulary over time.',
		creatorName: 'OpenAAC',
		file: '/template-projects/quick-core-60.obz'
	},
	{
		thumbnail: 'https://s3.amazonaws.com/opensymbols/libraries/extras/quick-core-84.svg',
		title: 'Quick Core 84',
		description:
			'Quick Core 84 is a core, motor-planning based vocabulary set with up to 84 buttons per board. It has built-in progression to gradually expand the vocabulary over time.',
		creatorName: 'OpenAAC',
		file: '/template-projects/quick-core-84.obz'
	},
	{
		thumbnail: 'https://www.openboardformat.org/previews/quick-core-112.png',
		title: 'Quick Core 112',
		description:
			'Quick Core 112 is a core, motor-planning based vocabulary set with up to 112 buttons per board. It has built-in progression to gradually expand the vocabulary over time.',
		creatorName: 'OpenAAC',
		file: '/template-projects/quick-core-112.obz'
	},
	{
		thumbnail: 'https://opensymbols.s3.amazonaws.com/libraries/extras/vocal-flair-24.svg',
		title: 'Vocal Flair 24',
		description:
			'Vocal Flair 24 is a core, flat-but-dynamic-styled vocabulary set with up to 24 buttons per board. It has built-in progression to gradually expand the vocabulary over time.',
		creatorName: 'OpenAAC',
		file: '/template-projects/vocal-flair-24.obz'
	},
	{
		thumbnail: 'https://opensymbols.s3.amazonaws.com/libraries/extras/vocal-flair-40.svg',
		title: 'Vocal Flair 40',
		description:
			'Vocal Flair 40 is a core, flat-but-dynamic-styled vocabulary set with up to 40 buttons per board. It has built-in progression to gradually expand the vocabulary over time.',
		creatorName: 'OpenAAC',
		file: '/template-projects/vocal-flair-40.obz'
	},
	{
		thumbnail: 'https://opensymbols.s3.amazonaws.com/libraries/extras/vocal-flair-60.svg',
		title: 'Vocal Flair 60',
		description:
			'Vocal Flair 60 is a core, flat-but-dynamic-styled vocabulary set with up to 60 buttons per board. It has built-in progression to gradually expand the vocabulary over time.',
		creatorName: 'OpenAAC',
		file: '/template-projects/vocal-flair-60.obz'
	},
	{
		thumbnail: 'https://opensymbols.s3.amazonaws.com/libraries/extras/vocal-flair-84.svg',
		title: 'Vocal Flair 84',
		description:
			'Vocal Flair 84 is a core, flat-but-dynamic-styled vocabulary set with up to 84 buttons per board. It has built-in progression to gradually expand the vocabulary over time.',
		creatorName: 'OpenAAC',
		file: '/template-projects/vocal-flair-84.obz'
	},
	{
		thumbnail: 'https://opensymbols.s3.amazonaws.com/libraries/extras/vocal-flair-84.svg',
		title: 'Vocal Flair 84 - With Keyboard',
		description:
			'Vocal Flair 84 is a core, flat-but-dynamic-styled vocabulary set with up to 84 buttons per board, including a keyboard on the main board. It has built-in progression to gradually expand the vocabulary over time.',
		creatorName: 'OpenAAC',
		file: '/template-projects/vocal-flair-84-with-keyboard.obz'
	},
	{
		thumbnail: 'https://opensymbols.s3.amazonaws.com/libraries/extras/vocal-flair-112.svg',
		title: 'Vocal Flair 112',
		description:
			'Vocal Flair 112 is a core, flat-but-dynamic-styled vocabulary set with up to 112 buttons per board, including a keyboard on the main board. It has built-in progression to gradually expand the vocabulary over time.',
		creatorName: 'OpenAAC',
		file: '/template-projects/vocal-flair-112.obz'
	},
	{
		thumbnail: 'https://opensymbols.s3.amazonaws.com/libraries/extras/sequoia-15.svg',
		title: 'Sequoia 15',
		description:
			'Sequoia-15 is a branching vocabulary set, built in an effort to support communication organized by pragmatic function but with the goal of encouraging expansion into generalized and core-oriented vocabulary.',
		creatorName: 'OpenAAC',
		file: '/template-projects/sequoia-15.obz'
	}
];
