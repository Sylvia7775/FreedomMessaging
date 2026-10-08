# Freedom Messaging Mobile (Android Build)

This directory is set up for building the Android mobile companion app using Expo Application Services (EAS).

## Prerequisites

1. Install EAS CLI globally (or use `npx eas-cli` / `npx eas`):
   ```bash
   npm install -g eas-cli
   ```
2. Log into your Expo account:
   ```bash
   npx eas login
   ```

## Running the Build

From the root of the repository, execute:
```bash
bash scripts/build-mobile.sh
```

Or run the commands directly:
```bash
cd apps/mobile
npm install
npx eas build --platform android
```

### Build Profiles (defined in `eas.json`):
- **Preview (standalone APK for testing)**:
  ```bash
  npx eas build --platform android --profile preview
  ```
- **Production (AAB for Google Play Store)**:
  ```bash
  npx eas build --platform android --profile production
  ```
