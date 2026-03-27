require('dotenv').config();

const cors = require('cors');
const express = require('express');
const fs = require('fs');
const helmet = require('helmet');
const multer = require('multer');
const path = require('path');
const rateLimit = require('express-rate-limit');
const {canConvertWithLibreOffice, convertOfficeDocument} = require('./libreoffice');
const {convertPdfToDocx} = require('./pdf-to-docx');

const app = express();
const port = Number(process.env.PORT || 4000);
const apiKey = process.env.API_KEY || '';
const maxUploadMb = Number(process.env.MAX_UPLOAD_MB || 25);
const publicBaseUrl = process.env.PUBLIC_BASE_URL || '';
const uploadDir = path.join(__dirname, '..', 'storage', 'uploads');
const outputDir = path.join(__dirname, '..', 'storage', 'outputs');

fs.mkdirSync(uploadDir, {recursive: true});
fs.mkdirSync(outputDir, {recursive: true});

app.set('trust proxy', 1);

const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(value => value.trim())
  .filter(Boolean);

app.disable('x-powered-by');
app.use(
  helmet({
    crossOriginResourcePolicy: {policy: 'cross-origin'},
  }),
);
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error('Origin not allowed by server policy.'));
    },
  }),
);
app.use(express.json({limit: '1mb'}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

const upload = multer({
  dest: uploadDir,
  limits: {
    fileSize: maxUploadMb * 1024 * 1024,
  },
  fileFilter(req, file, callback) {
    const allowedMimeTypes = new Set([
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    ]);
    const allowedExtensions = new Set(['.pdf', '.docx', '.xls', '.xlsx', '.ppt', '.pptx']);
    const extension = path.extname(file.originalname || '').toLowerCase();

    if (allowedMimeTypes.has(file.mimetype) || allowedExtensions.has(extension)) {
      callback(null, true);
      return;
    }

    callback(new Error(`Unsupported upload type: ${file.mimetype}`));
  },
});

app.get('/health', requireApiKey, (_req, res) => {
  res.json({
    ok: true,
    service: 'jedum-format-forge-backend',
    timestamp: new Date().toISOString(),
  });
});

app.post('/api/convert', requireApiKey, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({error: 'No file uploaded.'});
      return;
    }

    const targetFormat = String(req.body.format || '').toLowerCase();
    if (!targetFormat) {
      res.status(400).json({error: 'Missing target format.'});
      return;
    }

    const outputFileName = buildOutputName(req.file.originalname, targetFormat);
    const outputPath = path.join(outputDir, outputFileName);
    const fileExtension = path.extname(req.file.originalname || '').toLowerCase();
    let convertedPath = null;

    if (targetFormat === 'docx' && fileExtension === '.pdf') {
      convertedPath = await convertPdfToDocx(req.file.path, req.file.originalname, outputPath);
    } else if (canConvertWithLibreOffice(req.file.mimetype, targetFormat, req.file.originalname)) {
      convertedPath = await convertOfficeDocument(req.file.path, req.file.originalname, targetFormat, outputPath);
    }

    if (!convertedPath) {
      res.status(400).json({
        error:
          'This backend route currently supports Office to PDF and PDF to Word conversions.',
      });
      return;
    }

    res.json({
      ok: true,
      targetFormat,
      originalName: req.file.originalname,
      downloadUrl: `${getBaseUrl(req)}/downloads/${encodeURIComponent(outputFileName)}`,
      note:
        targetFormat === 'docx'
          ? 'Converted to a richer Word document with page sections and heading detection.'
          : 'Converted with LibreOffice.',
    });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unexpected server error.',
    });
  } finally {
    cleanupTempUpload(req.file);
  }
});

app.get('/downloads/:fileName', requireApiKey, (req, res) => {
  const requested = path.basename(req.params.fileName);
  const fullPath = path.join(outputDir, requested);

  if (!fs.existsSync(fullPath)) {
    res.status(404).json({error: 'File not found.'});
    return;
  }

  res.download(fullPath);
});

app.use((error, _req, res, _next) => {
  res.status(400).json({
    error: error instanceof Error ? error.message : 'Request failed.',
  });
});

app.listen(port, () => {
  console.log(`Jedum Format Forge backend listening on http://localhost:${port}`);
});

function requireApiKey(req, res, next) {
  if (!apiKey) {
    res.status(500).json({error: 'Server API key is not configured.'});
    return;
  }

  if (req.header('x-api-key') !== apiKey) {
    res.status(401).json({error: 'Unauthorized request.'});
    return;
  }

  next();
}

function buildOutputName(originalName, targetFormat) {
  const baseName = path.basename(originalName, path.extname(originalName));
  const safeBaseName = baseName.replace(/[^a-zA-Z0-9-_]+/g, '-').replace(/-+/g, '-');
  return `${safeBaseName || 'converted'}-${Date.now()}.${targetFormat}`;
}

function cleanupTempUpload(file) {
  if (!file || !file.path) {
    return;
  }

  try {
    fs.unlinkSync(file.path);
  } catch {
    // Ignore cleanup failures for now.
  }
}

function getBaseUrl(req) {
  if (publicBaseUrl) {
    return publicBaseUrl.replace(/\/$/, '');
  }

  return `${req.protocol}://${req.get('host')}`;
}
