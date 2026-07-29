# Fomo Emo

Fomo Emo is an iOS-first accessibility app prototype that helps autistic people
reflect on possible emotions conveyed by speech tone.

The app records a short voice sample on-device and presents a calm, plain-language
emotion card. The current inference service is a clearly labelled demo adapter:
it proves the recording and UI workflow without pretending that an unvalidated
model can reliably identify another person's feelings.

> Speech tone is ambiguous and varies across people, cultures, languages, and
> situations. Fomo Emo offers a possible interpretation, never a diagnosis or
> statement of fact.

## Stack

- Expo SDK 57, React Native, Expo Router, and strict TypeScript
- `expo-audio` for microphone permission and recording
- Jest for unit tests
- ESLint, TypeScript, and Prettier for code quality
- GitHub Actions for pull request checks
- EAS Build for opt-in iOS simulator, preview, and production builds
- `just` as an optional command runner

Node dependencies are isolated per-project in `node_modules`; a Python virtual
environment is neither required nor used. `.nvmrc` pins the Node major version,
while `package-lock.json` makes npm installs reproducible.

## Requirements

- Node.js 24 (`nvm use`)
- npm 11+
- Xcode and iOS Simulator for local iOS development, or an iPhone with Expo Go
- Optional: [`just`](https://github.com/casey/just)
- Optional for cloud builds: an Expo account and EAS CLI

## Setup

```sh
nvm use
npm ci
npm run ios
```

Without `just`, every recipe maps to an npm command. With it:

```sh
just setup
just ios
just check
```

Copy `.env.example` to `.env.local` only when connecting a real inference API.
Never put model credentials or private audio in an `EXPO_PUBLIC_*` variable;
public variables are embedded in the app bundle. A production inference API
should issue short-lived client credentials and delete audio according to an
explicit retention policy.

## Commands

| Command                | Purpose                                      |
| ---------------------- | -------------------------------------------- |
| `npm start`            | Start the Expo development server            |
| `npm run ios`          | Open the app in iOS Simulator                |
| `npm run lint`         | Run ESLint                                   |
| `npm run typecheck`    | Check strict TypeScript                      |
| `npm test`             | Run unit tests once                          |
| `npm run format:check` | Verify formatting                            |
| `npm run check`        | Run the complete local CI suite              |
| `npm run expo:doctor`  | Validate Expo dependencies and configuration |

## Architecture

`src/features/emotion-check` owns the recording experience. It depends on the
`EmotionAnalyzer` interface in `src/services/emotion-analysis`, so a future
on-device Core ML adapter or privacy-reviewed API adapter can replace the demo
without rewriting the UI.

Before real-world release:

1. Co-design the wording and interaction with autistic users.
2. Validate the model across accents, languages, ages, speech differences, and
   recording environments.
3. Show uncertainty and alternatives; provide an easy "none of these" path.
4. Complete privacy, consent, data-retention, accessibility, and threat reviews.
5. Keep the product out of emergency, diagnostic, employment, education, and
   other high-stakes decision paths.

## CI/CD

`.github/workflows/ci.yml` runs the full quality suite on pull requests and
pushes to `main`. Dependabot opens monthly npm and GitHub Actions updates.

EAS profiles live in `eas.json`. Cloud builds are deliberately manual until an
Expo project, Apple bundle ID, signing credentials, and App Store Connect access
are configured:

```sh
npx eas-cli login
npx eas-cli init
npx eas-cli build --platform ios --profile development-simulator
npx eas-cli build --platform ios --profile preview
npx eas-cli build --platform ios --profile production
```

Replace the placeholder bundle identifier in `app.json`; `eas init` will add the
Expo project owner and project ID before the first shared build.
