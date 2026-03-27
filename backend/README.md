# Jedum Format Forge Backend

This is a starter backend for the app's cloud conversion flows.

## What it does

- accepts authenticated uploads
- enforces upload limits
- validates file types
- applies basic HTTP security headers
- rate-limits requests
- exposes a health check
- converts Office files to PDF with LibreOffice when installed
- converts PDF files to text-first DOCX output

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
- converts `DOCX/XLSX/PPT/PPTX -> PDF` using LibreOffice
- converts `PDF -> DOCX` as a text-first Word export
- returns a download URL for the converted file

Next production steps:

1. Improve `PDF -> DOCX` beyond text-first output.
2. Add malware scanning and MIME/content sniffing.
3. Store outputs in object storage with signed download URLs.
4. Add auth/session management if users will have accounts.
5. Add deletion jobs for temp uploads and outputs.
6. Add privacy policy + retention policy for store submission.

## LibreOffice requirement

Set `LIBREOFFICE_PATH` in `.env` if LibreOffice is not on the default Windows path.

Example:

```env
LIBREOFFICE_PATH=C:\Program Files\LibreOffice\program\soffice.com
```
