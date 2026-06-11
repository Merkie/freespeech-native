# FreeSpeech AAC — React Native

Native iOS/Android version of [FreeSpeech AAC](https://github.com/merkie/freespeech), built with Expo. It talks to the same FreeSpeech API as the web app — same accounts, same projects, same data.

## Stack

- **Expo SDK 56** (React Native 0.85, TypeScript, expo-router)
- **API**: existing FreeSpeech API (`https://freespeech-api.archers.tools`), JWT Bearer auth — see `src/lib/config.ts`
- **TTS**: ElevenLabs MP3 via the API played with `expo-audio` (cached on disk per phrase+voice), with `expo-speech` device-voice fallback
- **Storage**: `expo-secure-store` for the auth token, AsyncStorage for local settings

## Running

```sh
npm install
npm run ios      # or: npm run android / npm start
```

## Features

- Email/password login and registration (same accounts as the web app)
- Projects dashboard with search, thumbnails, and project creation
- AAC board: tile grid (project columns×rows), vertical subpage paging, navigation tiles, tap-to-speak
- Sentence builder bar with speak / copy / clear
- Edit mode: add tiles, edit text/display text/colors/page links, image search (OpenSymbols + Brave) with upload to FreeSpeech media storage, delete tiles
- Page management: create, delete, jump between pages
- Settings: ElevenLabs voice picker, device voice picker, test voice, speak-on-tap, sentence builder toggles, symbol skin tone
- Speaks through the iOS mute switch (audio session configured for playback)

## Not ported (yet)

- Google OAuth sign-in (needs native client IDs in the Google console; email/password works)
- OpenBoard `.obf`/`.obz` import (use the web app)
- Background removal for images, personal ElevenLabs API keys, profile picture upload

## Layout

```
src/
├── app/                      # expo-router screens
│   ├── login.tsx, register.tsx
│   └── (app)/                # auth-guarded
│       ├── projects.tsx      # dashboard
│       ├── settings.tsx
│       └── project/[projectId]/[pageId].tsx   # the AAC board
├── components/
│   ├── board/                # Tile, TileGridPage, SentenceBar, EditTileSheet, PagesSheet
│   └── ui.tsx
└── lib/
    ├── api/                  # typed client for every endpoint the web app uses
    ├── session.tsx           # token + user context
    ├── settings.tsx          # persisted local settings
    ├── speak.ts              # TTS engine (ElevenLabs + device fallback)
    └── media.ts              # image search result → R2 upload flow
```
