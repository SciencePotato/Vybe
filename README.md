# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Configure native Firebase

   This app imports `@react-native-firebase/app` and `@react-native-firebase/auth`.
   **It cannot run in Expo Go**: those native modules are not included in Expo Go.
   Use Firebase configuration for your own project and the bundle/package ID
   `com.vybe.app`. The paths configured in `app.json` are `GoogleService-Info.plist`
   for iOS and `google-services.json` for Android. Do not commit private credentials.

3. Build and run the native app

   With Xcode installed on macOS for iOS, or Android Studio and an Android SDK for Android:

   ```bash
   npm run ios
   # or
   npm run android
   ```

   These scripts run `expo run:ios` / `expo run:android`, compiling the native
   Firebase modules. Rebuild after changing native dependencies or Firebase config.

For subsequent JavaScript changes, `npm start` starts Metro for the installed
native app. See [React Native Firebase's Expo setup](https://rnfirebase.io/#expo)
and the [Expo native build guide](https://docs.expo.dev/workflow/run-on-device/).

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
