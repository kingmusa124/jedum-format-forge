# Android Studio Setup

This workspace is now a real React Native CLI project at the root level.

## What is already done

- `android/` and `ios/` folders are present
- `npm install` has been run in the root project
- `android/local.properties` points to:
  - `C:\\Users\\MUSA\\AppData\\Local\\Android\\Sdk`
- `npm run typecheck` passes

## Open in Android Studio

1. Open Android Studio.
2. Choose `Open`.
3. Select:
   - `C:\Users\MUSA\Desktop\EXTRA\file editor app\android`
4. Let Gradle sync finish.

## If Gradle sync fails

The most likely remaining issue is internet access for Maven/Google downloads on first sync.

Android Studio and Gradle need access to:

- `https://dl.google.com`
- `https://repo.maven.apache.org`

If sync fails:

1. Check that your internet connection is working.
2. Check Android Studio proxy settings:
   - `File > Settings > Appearance & Behavior > System Settings > HTTP Proxy`
3. Check Windows firewall or antivirus rules.
4. Retry Gradle sync.

## Run the app

From the project root:

```powershell
npm start
```

In a second terminal:

```powershell
npm run android
```

Or use Android Studio's Run button after Gradle sync succeeds.

## Notes

- User-facing app name: `Jedum Format Forge`
- Internal React Native component/native project id: `JedumFormatForge`
- If you want, that internal native project id can be renamed later, but it is not required to run the app.

