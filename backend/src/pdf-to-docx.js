const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const {Document, HeadingLevel, Packer, Paragraph, TextRun, AlignmentType, PageBreak} = require('docx');

async function convertPdfToDocx(inputPath, originalName, outputPath) {
  const buffer = fs.readFileSync(inputPath);
  const parsed = await pdfParse(buffer);
  const blocks = normalizeTextBlocks(parsed.text || '', parsed.numpages || 1);
  const sections = buildDocumentSections(blocks, originalName);

  const doc = new Document({
    sections,
  });

  const docxBuffer = await Packer.toBuffer(doc);
  fs.writeFileSync(outputPath, docxBuffer);
  return outputPath;
}

function normalizeTextBlocks(text, pageCount) {
  const pages = text
    .replace(/\r/g, '')
    .split(/\f+/)
    .map(page => page.trim())
    .filter(Boolean);

  if (!pages.length) {
    const fallbackBlocks = text
      .replace(/\r/g, '')
      .split(/\n{2,}/)
      .map(block => block.trim())
      .filter(Boolean);

    return [{pageNumber: 1, blocks: fallbackBlocks}];
  }

  return pages.map((page, index) => ({
    pageNumber: index + 1,
    blocks: page
      .split(/\n{2,}/)
      .map(block => block.trim())
      .filter(Boolean),
    totalPages: pageCount,
  }));
}

function buildDocumentSections(pages, originalName) {
  const readableName = decodeFileName(path.basename(originalName, path.extname(originalName)));
  const hasExtractedText = pages.some(page => page.blocks.length > 0);
  const children = [
    new Paragraph({
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: {after: 240},
      children: [new TextRun({text: readableName, bold: true, size: 34})],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: {after: 320},
      children: [
        new TextRun({
          text: 'Converted from PDF by Jedum Format Forge',
          italics: true,
          color: '5A6B86',
          size: 20,
        }),
      ],
    }),
  ];

  if (!hasExtractedText) {
    children.push(
      new Paragraph({
        spacing: {after: 260},
        children: [
          new TextRun({
            text: 'This PDF appears to be image-based or scanned. OCR is needed to recover editable text.',
            italics: true,
            color: '7D8CA5',
          }),
        ],
      }),
    );
  }

  pages.forEach((page, pageIndex) => {
    if (pageIndex > 0) {
      children.push(
        new Paragraph({
          children: [new PageBreak()],
        }),
      );
    }

    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: {after: 180},
        children: [new TextRun({text: `Page ${page.pageNumber}`, bold: true, size: 24, color: '355CFF'})],
      }),
    );

    if (!page.blocks.length) {
      children.push(
        new Paragraph({
          spacing: {after: 180},
          children: [
            new TextRun({
              text: 'No extractable text was found on this page. If this page is a scan, OCR is required.',
              italics: true,
            }),
          ],
        }),
      );
      return;
    }

    page.blocks.forEach((block, blockIndex) => {
      children.push(createParagraph(block, pageIndex === 0 && blockIndex === 0));
    });
  });

  if (children.length === 2) {
    children.push(new Paragraph('No extractable text was found in this PDF.'));
  }

  return [{properties: {}, children}];
}

function createParagraph(block, isLeadBlock) {
  const normalized = block.replace(/\n+/g, ' ').trim();

  if (looksLikeHeading(normalized) || isLeadBlock) {
    return new Paragraph({
      heading: isLeadBlock ? HeadingLevel.HEADING_1 : HeadingLevel.HEADING_2,
      spacing: {before: 120, after: 140},
      children: [new TextRun({text: normalized, bold: true})],
    });
  }

  if (looksLikeBullet(normalized)) {
    return new Paragraph({
      bullet: {level: 0},
      spacing: {after: 110},
      children: [new TextRun({text: normalized.replace(/^[-*]\s+/, '')})],
    });
  }

  return new Paragraph({
    spacing: {after: 140},
    children: [new TextRun({text: normalized})],
  });
}

function looksLikeHeading(value) {
  if (value.length > 90) {
    return false;
  }

  const titleLike = /^[A-Z0-9][A-Za-z0-9\s,:()/-]{3,}$/.test(value);
  const mostlyUppercase = value === value.toUpperCase() && /[A-Z]/.test(value);
  return titleLike && (mostlyUppercase || value.split(' ').length <= 8);
}

function looksLikeBullet(value) {
  return /^[-*]\s+/.test(value);
}

function decodeFileName(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

module.exports = {
  convertPdfToDocx,
};
