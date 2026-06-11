# freespeech-native

Native (iOS/Android) port of FreeSpeech AAC — the SvelteKit web app at `~/Code/freespeech` ([github.com/merkie/freespeech](https://github.com/merkie/freespeech)). When in doubt about behavior, UI, or icon choices, check the web app and match it.

## Stack

- Expo SDK 56 + expo-router (file-based routes in `src/app/`), TypeScript, React 19
- No backend of its own — talks to the existing FreeSpeech API at `https://freespeech-api.archers.tools` (config in `src/lib/config.ts`). Do not point it at `api.freespeechaac.com`; that domain is a dead Cloudflare origin.
- Media (tile images, thumbnails) served from Cloudflare R2 at `https://media.freespeechaac.com`

## Layout

- `src/app/` — routes: `login`/`register`, `(app)/projects`, `(app)/settings`, `(app)/project/[projectId]/[pageId]` (the AAC board)
- `src/lib/` — API client (`api/`), session (SecureStore token), settings (AsyncStorage), TTS (`speak.ts`), board-ui context
- `src/components/` — board components, `BottomNav`, `icons/`

## Conventions

- Icons are Bootstrap Icons (same set the web app loads from CDN), inlined as SVG paths. Never use emoji for UI glyphs. To add an icon: add its name to `scripts/generate-icons.cjs`, run `node scripts/generate-icons.cjs`, render with `<Icon name="..." />`.
- The bottom nav (house/pencil/gear) lives in `(app)/_layout.tsx`, outside the Stack — keep it there so it doesn't animate with page transitions. Stack transitions are intentionally `animation: 'none'` to match the web app.
- Verify with `npx tsc --noEmit` and `npm run lint`.

## Running

```bash
npm install
npx expo start
```
