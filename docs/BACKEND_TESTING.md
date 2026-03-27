# Backend Testing

## Local environment

1. Copy `backend/.env.example` to `backend/.env`
2. Set:

```env
PORT=4000
API_KEY=your-local-api-key
LIBREOFFICE_PATH=C:\Program Files\LibreOffice\program\soffice.com
MAX_UPLOAD_MB=25
ALLOWED_ORIGINS=http://localhost:8081,http://127.0.0.1:8081
PUBLIC_BASE_URL=
```

3. Start the backend:

```powershell
cd "C:\Users\MUSA\Desktop\EXTRA\file editor app\backend"
cmd /c npm run dev
```

If port `4000` is already in use, that usually means the backend is already running.

## Health check

```powershell
$headers = @{ "x-api-key" = "your-local-api-key" }
Invoke-RestMethod -Uri "http://localhost:4000/health" -Headers $headers -Method Get
```

## Office-to-PDF test

```powershell
curl.exe -X POST "http://localhost:4000/api/convert" `
  -H "x-api-key: your-local-api-key" `
  -F "file=@C:\Users\MUSA\Desktop\sample.docx" `
  -F "format=pdf"
```

## PDF-to-Word test

```powershell
curl.exe -X POST "http://localhost:4000/api/convert" `
  -H "x-api-key: your-local-api-key" `
  -F "file=@C:\Users\MUSA\Desktop\sample.pdf" `
  -F "format=docx"
```

This endpoint now creates a richer DOCX with page sections, title treatment, and basic heading detection.

## Phone testing over USB

Reverse the backend port for your connected phone:

```powershell
& "C:\Users\MUSA\AppData\Local\Android\Sdk\platform-tools\adb.exe" reverse tcp:4000 tcp:4000
```

Then in the app Settings use:

- Backend URL: `http://127.0.0.1:4000/api/convert`
- Backend API key: the same `API_KEY` from `.env`

## Production note

When you deploy the backend for release:

- set `PUBLIC_BASE_URL=https://your-domain.example.com`
- keep `API_KEY` out of Git
- point the app's backend URL at your real HTTPS `/api/convert` endpoint
