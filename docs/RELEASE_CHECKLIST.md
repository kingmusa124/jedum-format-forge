# Release Checklist

Use this checklist before shipping Jedum Format Forge to Google Play or the App Store.

## Build and signing

- Create a real Android release keystore.
- Copy `android/key.properties.example` to `android/key.properties`.
- Fill in your real keystore path, passwords, and alias.
- Confirm Android release builds are signed with the release keystore, not the debug key.
- Create an iOS archive in Xcode using your real Apple signing team and provisioning profile.

## App quality

- Test on at least one Android phone and one Android tablet.
- Test on at least one iPhone and one iPad before App Store submission.
- Verify offline converters still work with no network connection.
- Verify cloud converters fail gracefully when the backend is unavailable.
- Check save, share, preview, and open flows for PDF, image, and DOCX outputs.

## Backend

- Run the backend over HTTPS on a domain you control.
- Set a strong `API_KEY` and keep it out of Git.
- Add logging, file cleanup, and rate limiting in production.
- Confirm LibreOffice is installed on the production host if you use Office-to-PDF conversion there.

## Privacy and consent

- Publish a privacy policy.
- Document how local and cloud conversions differ.
- Explain how uploaded files are handled, stored, and deleted.
- Add an ads/consent flow before switching AdMob from test IDs to production IDs.

## Store assets

- Final app icon
- Screenshots for phone and tablet
- App description and short description
- Privacy policy URL
- Support email
- Feature graphic for Google Play

## Final smoke test

- Install a release build
- Launch app cold
- Convert one file locally
- Convert one file with the cloud backend
- Save to device
- Share result
- Reopen a result from History
