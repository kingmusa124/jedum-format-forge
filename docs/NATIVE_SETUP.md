# Native Setup Notes

This project uses React Native CLI and community native modules. After creating the base React Native project, verify the following:

## Install packages

```bash
npm install
cd ios && pod install
```

## Android

Update `android/app/src/main/AndroidManifest.xml` with:

- `android.permission.READ_MEDIA_IMAGES`
- `android.permission.READ_EXTERNAL_STORAGE` for backward compatibility
- `android.permission.CAMERA` if camera capture stays enabled

If your chosen file-saving strategy writes outside the app sandbox on older Android versions, review scoped storage behavior carefully before adding write permissions.

## iOS

Add these usage descriptions in `Info.plist`:

- `NSPhotoLibraryUsageDescription`
- `NSPhotoLibraryAddUsageDescription`
- `NSCameraUsageDescription`

## App name and icon

- Internal React Native project name: `JedumFormatForge`
- User-facing display name: `Jedum Format Forge`
- Preferred app icon source: [jedum_format_forge_app_icon.svg](C:\Users\MUSA\Downloads\jedum_format_forge_brand_pack\jedum_format_forge_app_icon.svg)
- Preferred dark-mode icon source: [jedum_format_forge_app_icon_dark.svg](C:\Users\MUSA\Downloads\jedum_format_forge_brand_pack\jedum_format_forge_app_icon_dark.svg)

## Community packages to verify in native projects

- `react-native-document-picker`
- `react-native-image-picker`
- `react-native-pdf-lib`
- `react-native-webp-converter`
- `react-native-pdf-to-image`
- `react-native-pdf-thumbnail`
- `react-native-html-to-pdf`
- `react-native-image-resizer`
- `react-native-heic-converter`
- `react-native-merge-pdf`
- `react-native-vector-icons`
- `react-native-linear-gradient`
- `react-native-fast-image`
- `xlsx`
- `mammoth`
- `markdown-it`

## Notes on converter APIs

The JS conversion service is intentionally wrapped behind `src/services/conversionService.ts` and `src/services/nativeModules.ts`.

If any module exposes a slightly different native method name in your installed version, update those wrappers instead of rewriting screen code.

## Server-backed Office conversion

For PowerPoint to PDF and other future Office-heavy workflows, the app is designed to call a server endpoint. A typical self-hosted setup is:

- Node.js + Express
- `libreoffice-convert` or `unoconv`
- A `POST /convert` endpoint that accepts multipart upload and returns a download URL

The mobile app already exposes a `Server URL` field for converters that require cloud processing.

