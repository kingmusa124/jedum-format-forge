# Android Release Signing

## 1. Create a release keystore

Run this in PowerShell:

```powershell
cd "C:\Users\MUSA\Desktop\EXTRA\file editor app\android\app"
keytool -genkeypair -v -storetype PKCS12 -keystore release-upload-key.keystore -alias upload -keyalg RSA -keysize 2048 -validity 10000
```

## 2. Add `key.properties`

Copy:

- `android/key.properties.example`

to:

- `android/key.properties`

Then fill in your real values.

## 3. Keep secrets out of Git

`android/key.properties` is ignored by `.gitignore`. Do not commit it.

## 4. Build a release APK or AAB

APK:

```powershell
cd "C:\Users\MUSA\Desktop\EXTRA\file editor app\android"
cmd /c gradlew.bat assembleRelease
```

AAB for Play Store:

```powershell
cd "C:\Users\MUSA\Desktop\EXTRA\file editor app\android"
cmd /c gradlew.bat bundleRelease
```

## 5. Play Store

Upload the generated `.aab` in Google Play Console and enable Play App Signing.
