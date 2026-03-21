# AdMob Setup Checklist

Use this when you are ready to monetize Jedum Format Forge.

## 1. Create AdMob assets

- Create an AdMob account.
- Register the Android and iOS apps.
- Create test ad units first.
- Keep the App IDs and ad unit IDs separate.

## 2. App changes still needed

- Install a React Native mobile ads SDK.
- Add the Android AdMob App ID to `AndroidManifest.xml`.
- Add the iOS AdMob App ID to `Info.plist`.
- Initialize the mobile ads SDK on app startup.
- Add banner/interstitial/rewarded placements carefully so they do not interrupt conversion flows.

## 3. Privacy and consent

- Add a public privacy policy URL.
- Explain ad usage, analytics, and cloud conversion uploads.
- Add consent handling for GDPR/EEA and other required regions.
- Make sure your Play Store and App Store data safety forms match the real app behavior.

## 4. app-ads.txt

- Buy or use a domain you control.
- Host `app-ads.txt` at the root of that domain.
- Link that domain in AdMob.

## 5. Release discipline

- Use test ads during development.
- Never click your own production ads.
- Enable ads only after the app is stable and your privacy disclosures are ready.
