# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Configure Firebase (optional but recommended)

This project includes lightweight helpers for connecting to a Firebase project. To enable them:

1. Install the Firebase JavaScript SDK in your local environment:

   ```bash
   npm install firebase
   ```

2. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com/) and add a **Web** app.
3. Copy the configuration snippet that Firebase generates (the object with keys such as `apiKey`, `projectId`, and `appId`).
4. Duplicate `.env.example` as `.env` and paste the values into the corresponding `EXPO_PUBLIC_FIREBASE_*` entries.
5. Restart your Expo development server so the new environment variables are picked up.

Once configured, the helper in `lib/firebase.ts` will initialize Firebase automatically and the logout flow will also sign the user out of Firebase Auth when available.

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
