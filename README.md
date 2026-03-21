# Jedum Format Forge

Jedum Format Forge is a React Native CLI mobile app for iOS and Android, built for Jedum Global Solutions. It now covers:

- Images: PNG, JPG, BMP, GIF, WebP, HEIC
- Documents: PDF, DOCX, TXT, HTML, Markdown
- Sheets: XLS, XLSX, CSV
- Slides: PPT, PPTX

The project is structured for native module integration and uses open-source libraries only.

## Highlights

- React Native CLI architecture
- Redux Toolkit state management
- Bottom-tab plus stack navigation
- Registry-driven batch conversion workflow
- Conversion history with persistence
- Light and dark themes
- Output folder control
- Native-friendly conversion service layer for future formats
- Offline and cloud-required conversion indicators

## Main folders

- `App.tsx`: app entry and providers
- `src/navigation`: stacks and tabs
- `src/screens`: Home, Convert, History, Settings, Result
- `src/store`: Redux store and slices
- `src/services`: file picking, permissions, storage, conversion adapters
- `src/converters`: converter registry and capability metadata
- `src/theme`: colors and theme provider
- `src/components`: reusable UI building blocks

## Required native setup

This workspace now contains the React Native application layer and project configuration, but it does **not** include generated `android/` and `ios/` folders from `react-native init`, because no React Native CLI runtime was available in this environment to generate and verify those native projects.

To run this as a full React Native CLI app:

1. Install dependencies from `package.json`.
2. Open the project root in Android Studio and use the included `android/` folder.
3. For iOS, run CocoaPods:
   - `cd ios && pod install`
4. Add the platform permissions and native package setup below.

## Android permissions

Add these to `android/app/src/main/AndroidManifest.xml` as needed:

- `READ_MEDIA_IMAGES`
- `READ_MEDIA_VIDEO` if you later support video
- `READ_EXTERNAL_STORAGE` for older Android versions
- `WRITE_EXTERNAL_STORAGE` only if your minSdk strategy requires it on old Android
- camera permission if you keep capture enabled

## iOS permissions

Add these keys to `ios/JedumFormatForge/Info.plist`:

- `NSPhotoLibraryUsageDescription`
- `NSPhotoLibraryAddUsageDescription`
- `NSCameraUsageDescription`
- `NSDocumentsFolderUsageDescription` if required by your native implementation strategy

## Native libraries to verify

The JS layer is prepared for these open-source modules, but you should confirm each native API shape during integration because some community packages differ slightly by version:

- `react-native-pdf-lib`
- `react-native-webp-converter`
- `react-native-pdf-to-image`
- `react-native-pdf-thumbnail`
- `react-native-document-picker`
- `react-native-image-picker`
- `react-native-html-to-pdf`
- `react-native-image-resizer`
- `react-native-heic-converter`
- `react-native-merge-pdf`
- `xlsx`
- `mammoth`
- `markdown-it`

## Notes

- Conversion cancellation is cooperative from the JS side. If a native library does not expose hard cancellation, the current stage may finish before the job stops.
- PDF to image conversion produces one image per page.
- PowerPoint PDF conversion is intentionally modeled as a server-backed workflow. The offline fallback is basic text extraction only.
- Spreadsheet conversion uses `xlsx` and HTML/PDF rendering workarounds instead of pretending there is true native Office fidelity.
- The conversion service is intentionally modular so future formats can be added with new adapters rather than rewriting screen logic.

## Android Studio

See [docs/ANDROID_STUDIO_SETUP.md](C:\Users\MUSA\Desktop\EXTRA\file editor app\docs\ANDROID_STUDIO_SETUP.md) for the current Android Studio-ready setup and the exact Gradle blocker found in this environment.

