# Vybe

Vybe is a mobile app built with Expo and React Native. Its current implementation provides Firebase email/password account creation, sign-in, authentication-based routing, and sign-out. The signed-in Home tab is currently a welcome screen, with drawer and tab navigation.

## Stack

- Expo SDK 53, React Native 0.79.2, React 19, and TypeScript with strict mode.
- Expo Router 5 for file-based routes in `app/`, with React Navigation.
- React Native Firebase App and Authentication 22.
- ESLint 9 with Expo's flat configuration.

## Prerequisites and configuration

Use Node.js and npm, plus the native development toolchain for Android or iOS. The root package does not pin a Node.js or npm version.

Native Firebase configuration is required by `app.json`. Supply these files at the repository root for the platform you intend to run:

| Platform | Configuration file | Application identifier |
| --- | --- | --- |
| Android | `google-services.json` | `com.vybe.app` |
| iOS | `GoogleService-Info.plist` | `com.vybe.app` |

Both configuration files are ignored by Git and are not included. The Firebase project must support email/password authentication for the implemented login and registration flows.

No environment variable names are referenced in the application source or configuration. Firebase is configured through the native files above, not a documented `.env` setup.

## Local setup and commands

Install dependencies from the repository root:

```bash
npm install
```

The following commands are defined in `package.json`:

| Command | Action |
| --- | --- |
| `npm run android` | Build and run Android with `expo run:android`. |
| `npm run ios` | Build and run iOS with `expo run:ios`. |
| `npm start` | Start the Expo development server with `expo start`. |
| `npm run web` | Start the web development server with `expo start --web`. |
| `npm run lint` | Run ESLint through `expo lint`. |

After supplying Firebase configuration, use the Android or iOS command to build and run the native app. For subsequent development-server sessions, use `npm start` (equivalently, `npx expo start`).

Edit screens and layouts in `app/`. Authentication is implemented in `app/(auth)/Auth.tsx`; the Home screen is in `app/(home)/(homeTabs)/index.tsx`.

## Current limitations

- Web is configured for Metro with static output, but authentication imports native Firebase directly and has no web-specific implementation.
- No automated test files or test script are present.
- `npm run reset-project` references `scripts/reset-project.js`, which is absent. Do not use it for setup.
- No production build or deployment scripts are defined.
