# AdMob Setup Checklist

Use this when you are ready to monetize Jedum Format Forge.

## 1. Create AdMob assets

- Create an AdMob account.
- Register the Android and iOS apps.
- Create test ad units first.
- Keep the App IDs and ad unit IDs separate.

## 2. App changes still needed

- Keep the React Native mobile ads SDK up to date.
- Replace the current Google test App IDs in `AndroidManifest.xml` and `Info.plist` with your real AdMob App IDs before release.
- Keep banner/interstitial/rewarded placements careful so they do not interrupt conversion flows.
- Use the in-app AdMob preview only with test ads until the app is store-ready.

## 3. Privacy and consent

- Add a public privacy policy URL.
- Explain ad usage, analytics, and cloud conversion uploads.
- Request consent information on every app launch.
- Show Google’s consent form when required.
- Only request ads when consent allows it.
- Provide a visible privacy options / consent-revocation entry point when required.
- Make sure your Play Store and App Store data safety forms match the real app behavior.

## 4. app-ads.txt

- Buy or use a domain you control.
- Host `app-ads.txt` at the root of that domain.
- Link that domain in AdMob.

## 5. Release discipline

- Use test ads during development.
- Never click your own production ads.
- Enable ads only after the app is stable and your privacy disclosures are ready.
