# Jedum Format Forge Backend

This is a starter backend for the app's cloud conversion flows.

## What it does

- accepts authenticated uploads
- enforces upload limits
- validates file types
- applies basic HTTP security headers
- rate-limits requests
- exposes a health check
- includes placeholder conversion routes so the mobile app has a stable API target

## Why you need it

The mobile app can do many conversions offline, but formats like `PDF -> DOCX` and `PPT/PPTX -> PDF` need a server if you want reliable production behavior across Android and iOS.

## Run locally

1. Install dependencies:

```bash
cd backend
npm install
```

2. Copy env values:

```bash
cp .env.example .env
```

3. Start the backend:

```bash
npm run dev
```

The health endpoint will be available at `http://localhost:4000/health`.

## API contract

`POST /api/convert`

Multipart form fields:

- `file`: uploaded file
- `format`: target output format such as `pdf` or `docx`

Headers:

- `x-api-key`: your backend API key

Current behavior:

- validates and stores the upload
- returns a placeholder JSON payload

Next production steps:

1. Plug in LibreOffice or another document conversion engine.
2. Add malware scanning and MIME/content sniffing.
3. Store outputs in object storage with signed download URLs.
4. Add auth/session management if users will have accounts.
5. Add deletion jobs for temp uploads and outputs.
6. Add privacy policy + retention policy for store submission.
