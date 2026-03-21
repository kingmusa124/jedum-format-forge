const { useEffect, useMemo, useRef, useState } = React;

const INPUT_TYPES = ["pdf", "docx", "xlsx", "xls", "txt", "md", "csv", "json", "html", "htm"];
const OUTPUT_TYPES = ["docx", "pdf", "xlsx", "txt", "html", "csv", "json"];

function App() {
  const [queue, setQueue] = useState([]);
  const [results, setResults] = useState([]);
  const [targetFormat, setTargetFormat] = useState("docx");
  const [zipOutputs, setZipOutputs] = useState(true);
  const [urlInput, setUrlInput] = useState("");
  const [message, setMessage] = useState(null);
  const [isConverting, setIsConverting] = useState(false);
  const [isFetchingUrl, setIsFetchingUrl] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const [offlineState, setOfflineState] = useState(getOfflineState());
  const fileInputRef = useRef(null);

  useEffect(() => {
    registerServiceWorker();
    const handleStatus = () => setOfflineState(getOfflineState());
    window.addEventListener("online", handleStatus);
    window.addEventListener("offline", handleStatus);
    return () => {
      window.removeEventListener("online", handleStatus);
      window.removeEventListener("offline", handleStatus);
      results.forEach((result) => {
        if (result.url) {
          URL.revokeObjectURL(result.url);
        }
      });
    };
  }, []);

  const queueSummary = useMemo(() => {
    if (!queue.length) {
      return "No files added yet.";
    }
    return `${queue.length} file${queue.length === 1 ? "" : "s"} ready for conversion.`;
  }, [queue]);

  const resultSummary = useMemo(() => {
    if (!results.length) {
      return "Converted files will appear here.";
    }
    return `${results.length} output item${results.length === 1 ? "" : "s"} ready to download.`;
  }, [results]);

  const addFiles = (files, source) => {
    const accepted = files
      .filter((file) => INPUT_TYPES.includes(getExtension(file.name)))
      .map((file) => ({
        id: crypto.randomUUID(),
        file,
        source,
        extension: getExtension(file.name),
        size: file.size,
      }));

    if (!accepted.length && files.length) {
      setMessage({ tone: "warning", text: "Those files are not in the supported input list yet." });
      return;
    }

    setQueue((current) => [...current, ...accepted]);
    setMessage({
      tone: "success",
      text: `${accepted.length} file${accepted.length === 1 ? "" : "s"} added to the queue.`,
    });
  };

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files || []);
    addFiles(files, "device");
    event.target.value = "";
  };

  const handleUrlImport = async () => {
    const url = urlInput.trim();
    if (!url) {
      setMessage({ tone: "warning", text: "Enter a direct file URL first." });
      return;
    }

    setIsFetchingUrl(true);
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Request failed with ${response.status}`);
      }

      const blob = await response.blob();
      const fileName = decodeURIComponent(url.split("/").pop()?.split("?")[0] || "remote-file");
      const extension = getExtension(fileName);

      if (!INPUT_TYPES.includes(extension)) {
        throw new Error(`Unsupported file type: .${extension || "unknown"}`);
      }

      const file = new File([blob], fileName, { type: blob.type || guessMimeType(extension) });
      addFiles([file], "url");
      setUrlInput("");
    } catch (error) {
      setMessage({ tone: "warning", text: `Could not import URL: ${error.message}` });
    } finally {
      setIsFetchingUrl(false);
    }
  };

  const handleClear = () => {
    results.forEach((result) => {
      if (result.url) {
        URL.revokeObjectURL(result.url);
      }
    });
    setQueue([]);
    setResults([]);
    setMessage({ tone: "success", text: "Queue and results cleared." });
  };

  const handleConvert = async () => {
    if (!queue.length) {
      setMessage({ tone: "warning", text: "Add one or more files before converting." });
      return;
    }

    results.forEach((result) => {
      if (result.url) {
        URL.revokeObjectURL(result.url);
      }
    });

    setIsConverting(true);
    setResults([]);
    setMessage({ tone: "success", text: "Converting your batch..." });

    try {
      const outputs = [];
      for (const item of queue) {
        const sourceDoc = await parseFile(item.file);
        const output = await exportDocument(sourceDoc, targetFormat, stripExtension(item.file.name));
        outputs.push(output);
      }

      if (zipOutputs && outputs.length > 1) {
        const zipBlob = await buildZip(outputs);
        setResults([
          makeDownloadResult(
            `converted-batch-${Date.now()}.zip`,
            zipBlob,
            "zip",
            `ZIP bundle with ${outputs.length} converted files.`
          ),
        ]);
      } else {
        setResults(outputs.map((output) => makeDownloadResult(output.name, output.blob, targetFormat, output.note)));
      }

      setMessage({
        tone: "success",
        text: `Finished converting ${queue.length} file${queue.length === 1 ? "" : "s"}.`,
      });
    } catch (error) {
      setMessage({ tone: "warning", text: `Conversion failed: ${error.message}` });
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <div className="app-shell">
      <header className="hero">
        <section className="hero-copy glass">
          <p className="eyebrow">React-based offline document studio</p>
          <h1 className="hero-title">Convert whole batches on phone, tablet, or laptop.</h1>
          <p className="hero-text">
            PaperPort Studio lets you import documents from your device or a direct online file link, pick the output
            format you want, and convert the whole queue in one polished workspace that adapts across screen sizes.
          </p>
          <div className="hero-actions">
            <button className="button" type="button" onClick={() => fileInputRef.current?.click()}>
              Add files
            </button>
            <button className="button-secondary" type="button" onClick={handleConvert} disabled={isConverting}>
              {isConverting ? "Converting..." : "Convert batch"}
            </button>
          </div>
        </section>

        <aside className="hero-aside glass">
          <div className={`status-pill ${offlineState.tone}`}>{offlineState.text}</div>
          <div className="aside-grid">
            <div className="stat-card">
              <p className="stat-label">Queue</p>
              <p className="stat-value">{queue.length || "0"} files</p>
            </div>
            <div className="stat-card">
              <p className="stat-label">Import options</p>
              <p className="stat-value">Device and URL</p>
            </div>
            <div className="stat-card">
              <p className="stat-label">Output options</p>
              <p className="stat-value">{OUTPUT_TYPES.length} formats</p>
            </div>
          </div>
        </aside>
      </header>

      <main className="workspace">
        <section className="panel span-7 glass">
          <div className="panel-header">
            <h2>Add documents</h2>
            <p>Select files locally or import from a direct file URL.</p>
          </div>

          <label
            className={`dropzone ${isDragActive ? "dragover" : ""}`}
            onDragEnter={(event) => {
              event.preventDefault();
              setIsDragActive(true);
            }}
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragActive(true);
            }}
            onDragLeave={(event) => {
              event.preventDefault();
              setIsDragActive(false);
            }}
            onDrop={(event) => {
              event.preventDefault();
              setIsDragActive(false);
              addFiles(Array.from(event.dataTransfer?.files || []), "device");
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.docx,.xlsx,.xls,.txt,.md,.csv,.json,.html,.htm"
              onChange={handleFileChange}
            />
            <strong>Drop files here or tap to browse your device</strong>
            <span>PDF, DOCX, XLSX, CSV, TXT, HTML, JSON and more</span>
          </label>

          <div className="stack" style={{ marginTop: "20px" }}>
            <label>
              <span className="field-label">Import from online link</span>
              <div className="row">
                <input
                  className="field-input"
                  type="url"
                  value={urlInput}
                  onChange={(event) => setUrlInput(event.target.value)}
                  placeholder="https://example.com/file.docx"
                />
                <button className="button-secondary" type="button" onClick={handleUrlImport} disabled={isFetchingUrl}>
                  {isFetchingUrl ? "Fetching..." : "Fetch file"}
                </button>
              </div>
            </label>
          </div>

          {message ? <div className={`message ${message.tone}`}>{message.text}</div> : null}
        </section>

        <section className="panel span-5 glass">
          <div className="panel-header">
            <h2>Conversion setup</h2>
            <p>Choose one target format for the current batch and optionally bundle everything into one ZIP.</p>
          </div>

          <div className="stack" style={{ marginTop: "18px" }}>
            <label>
              <span className="field-label">Convert selected files to</span>
              <select
                className="field-select"
                value={targetFormat}
                onChange={(event) => setTargetFormat(event.target.value)}
              >
                {OUTPUT_TYPES.map((format) => (
                  <option key={format} value={format}>
                    {format.toUpperCase()}
                  </option>
                ))}
              </select>
            </label>

            <label className="toggle-row">
              <input type="checkbox" checked={zipOutputs} onChange={(event) => setZipOutputs(event.target.checked)} />
              <span>Bundle converted files into a ZIP when there is more than one result</span>
            </label>

            <div className="row">
              <button className="button" type="button" onClick={handleConvert} disabled={isConverting}>
                {isConverting ? "Converting..." : "Convert batch"}
              </button>
              <button className="button-secondary" type="button" onClick={handleClear}>
                Clear queue
              </button>
            </div>
          </div>

          <div className="format-grid">
            {OUTPUT_TYPES.map((format) => (
              <div className="format-chip" key={format}>
                {format.toUpperCase()}
              </div>
            ))}
          </div>
        </section>

        <section className="panel span-6 glass">
          <div className="panel-header">
            <h2>Queue</h2>
            <p>{queueSummary}</p>
          </div>

          <div className="queue-list" style={{ marginTop: "16px" }}>
            {!queue.length ? (
              <div className="empty">Your conversion queue is empty.</div>
            ) : (
              queue.map((item) => (
                <article className="card" key={item.id}>
                  <div className="card-head">
                    <div>
                      <h3 className="card-title">{item.file.name}</h3>
                      <p className="card-meta">
                        {formatSize(item.size)} • {item.source === "url" ? "Imported from URL" : "Added from device"}
                      </p>
                    </div>
                    <span className="pill">.{item.extension}</span>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>

        <section className="panel span-6 glass">
          <div className="panel-header">
            <h2>Results</h2>
            <p>{resultSummary}</p>
          </div>

          <div className="results-list" style={{ marginTop: "16px" }}>
            {!results.length ? (
              <div className="empty">Run a batch conversion to generate downloads.</div>
            ) : (
              results.map((result) => (
                <article className="card" key={`${result.name}-${result.extension}`}>
                  <div className="card-head">
                    <div>
                      <h3 className="card-title">{result.name}</h3>
                      <p className="card-meta">{result.note}</p>
                    </div>
                    <span className="pill">.{result.extension}</span>
                  </div>
                  {result.url ? (
                    <div className="download-row">
                      <a className="download-link" download={result.name} href={result.url}>
                        Download
                      </a>
                    </div>
                  ) : null}
                </article>
              ))
            )}
          </div>
        </section>

        <section className="panel span-12 glass">
          <div className="panel-header">
            <h2>How this works</h2>
            <p>The interface is responsive, but the conversion engine is still honest about what browser-only conversion does best.</p>
          </div>
          <ul className="notes">
            <li>This React app runs in the browser and processes files locally after the required libraries finish loading.</li>
            <li>Offline reuse works after the first successful online load when opened through localhost or HTTPS.</li>
            <li>Text, headings, and basic tables are preserved better than advanced formatting, comments, or complex page layouts.</li>
          </ul>
        </section>
      </main>
    </div>
  );
}

function getOfflineState() {
  const hasSW = "serviceWorker" in navigator;
  const canRegisterSW = location.protocol === "http:" || location.protocol === "https:";
  if (!hasSW) {
    return { tone: "warning", text: "Offline caching is not supported in this browser." };
  }
  if (!canRegisterSW) {
    return { tone: "warning", text: "Open through localhost or HTTPS to enable offline caching." };
  }
  if (navigator.onLine) {
    return { tone: "success", text: "Ready for first load and offline caching." };
  }
  return { tone: "warning", text: "Offline mode active. Cached tools only." };
}

async function registerServiceWorker() {
  const canRegisterSW = location.protocol === "http:" || location.protocol === "https:";
  if (!("serviceWorker" in navigator) || !canRegisterSW) {
    return;
  }

  try {
    await navigator.serviceWorker.register("./sw.js");
  } catch (error) {
    console.warn("Service worker registration failed:", error);
  }
}

function makeDownloadResult(name, blob, extension, note) {
  return { name, extension, note, url: URL.createObjectURL(blob) };
}

function getExtension(fileName) {
  return (fileName.split(".").pop() || "").toLowerCase();
}

function stripExtension(fileName) {
  return fileName.replace(/\.[^.]+$/, "");
}

function formatSize(size) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

async function parseFile(file) {
  const extension = getExtension(file.name);

  if (extension === "pdf") return parsePdf(file);
  if (extension === "docx") return parseDocx(file);
  if (extension === "xlsx" || extension === "xls") return parseWorkbook(file);

  if (extension === "csv") {
    const text = await file.text();
    return {
      sourceType: extension,
      text,
      html: text.split(/\r?\n/).map((line) => `<p>${escapeHtml(line)}</p>`).join(""),
      tables: [text.split(/\r?\n/).map((line) => line.split(","))],
      metadata: { fileName: file.name },
    };
  }

  if (extension === "json") {
    const text = await file.text();
    const parsed = JSON.parse(text);
    return {
      sourceType: "json",
      text: JSON.stringify(parsed, null, 2),
      html: `<pre>${escapeHtml(JSON.stringify(parsed, null, 2))}</pre>`,
      tables: Array.isArray(parsed) ? [jsonArrayToRows(parsed)] : [],
      metadata: { fileName: file.name },
    };
  }

  const text = await file.text();
  return {
    sourceType: extension,
    text,
    html: extension === "html" || extension === "htm" ? text : linesToHtml(text),
    tables: [],
    metadata: { fileName: file.name },
  };
}

async function parsePdf(file) {
  const pdfjs = await ensurePdfJs();
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
  const pages = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    pages.push(content.items.map((item) => item.str).join(" ").trim());
  }

  const text = pages.join("\n\n");
  return {
    sourceType: "pdf",
    text,
    html: linesToHtml(text),
    tables: [],
    metadata: { fileName: file.name, pages: pdf.numPages },
  };
}

async function parseDocx(file) {
  if (!window.mammoth) {
    throw new Error("DOCX support is still loading. Refresh once online if needed.");
  }
  const arrayBuffer = await file.arrayBuffer();
  const result = await window.mammoth.convertToHtml({ arrayBuffer });
  const rawText = await window.mammoth.extractRawText({ arrayBuffer });
  return {
    sourceType: "docx",
    text: rawText.value.trim(),
    html: result.value,
    tables: [],
    metadata: { fileName: file.name },
  };
}

async function parseWorkbook(file) {
  if (!window.XLSX) {
    throw new Error("Spreadsheet support is still loading. Refresh once online if needed.");
  }
  const arrayBuffer = await file.arrayBuffer();
  const workbook = window.XLSX.read(arrayBuffer, { type: "array" });
  const tables = [];
  const textSections = [];
  let html = "";

  workbook.SheetNames.forEach((sheetName) => {
    const sheet = workbook.Sheets[sheetName];
    const rows = window.XLSX.utils.sheet_to_json(sheet, { header: 1, blankrows: false });
    tables.push(rows);
    textSections.push([sheetName, ...rows.map((row) => row.map((value) => String(value ?? "")).join("\t"))].join("\n"));
    html += `<section><h2>${escapeHtml(sheetName)}</h2>${window.XLSX.utils.sheet_to_html(sheet)}</section>`;
  });

  return {
    sourceType: "xlsx",
    text: textSections.join("\n\n"),
    html,
    tables,
    metadata: { fileName: file.name, sheets: workbook.SheetNames.length },
  };
}

async function exportDocument(doc, target, baseName) {
  if (target === "docx") return exportDocx(doc, baseName);
  if (target === "pdf") return exportPdf(doc, baseName);
  if (target === "xlsx") return exportXlsx(doc, baseName);

  if (target === "txt") {
    return {
      name: `${baseName}.txt`,
      blob: new Blob([doc.text || ""], { type: "text/plain;charset=utf-8" }),
      note: "Plain-text export.",
    };
  }

  if (target === "html") {
    return {
      name: `${baseName}.html`,
      blob: new Blob([wrapHtmlDocument(doc.html || linesToHtml(doc.text || ""))], { type: "text/html;charset=utf-8" }),
      note: "HTML export.",
    };
  }

  if (target === "csv") {
    const rows = doc.tables[0]?.length ? doc.tables[0] : textToSingleColumnRows(doc.text || "");
    const csv = rows.map((row) => row.map(csvEscape).join(",")).join("\n");
    return {
      name: `${baseName}.csv`,
      blob: new Blob([csv], { type: "text/csv;charset=utf-8" }),
      note: "CSV export.",
    };
  }

  if (target === "json") {
    const payload = {
      sourceType: doc.sourceType,
      text: doc.text || "",
      tables: doc.tables || [],
      metadata: doc.metadata || {},
    };
    return {
      name: `${baseName}.json`,
      blob: new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" }),
      note: "Structured JSON export.",
    };
  }

  throw new Error(`Unsupported target format: ${target}`);
}

async function exportDocx(doc, baseName) {
  if (!window.docx) {
    throw new Error("DOCX export is still loading. Refresh once online if needed.");
  }

  const children = [];
  const paragraphs = (doc.text || "").split(/\n+/).filter(Boolean);

  if (!paragraphs.length) {
    children.push(new window.docx.Paragraph("Converted document"));
  } else {
    paragraphs.forEach((paragraph) => {
      children.push(new window.docx.Paragraph({ text: paragraph }));
    });
  }

  (doc.tables || []).slice(0, 2).forEach((rows) => {
    if (!rows.length) return;
    const tableRows = rows.map((row) =>
      new window.docx.TableRow({
        children: row.map((cell) =>
          new window.docx.TableCell({
            children: [new window.docx.Paragraph(String(cell ?? ""))],
          })
        ),
      })
    );
    children.push(
      new window.docx.Table({
        rows: tableRows,
        width: { size: 100, type: window.docx.WidthType.PERCENTAGE },
      })
    );
  });

  const document = new window.docx.Document({ sections: [{ children }] });
  return {
    name: `${baseName}.docx`,
    blob: await window.docx.Packer.toBlob(document),
    note: "DOCX export with text and basic tables.",
  };
}

async function exportPdf(doc, baseName) {
  if (!window.jspdf?.jsPDF) {
    throw new Error("PDF export is still loading. Refresh once online if needed.");
  }

  const pdf = new window.jspdf.jsPDF({ unit: "pt", format: "a4" });
  const margin = 40;
  const width = pdf.internal.pageSize.getWidth() - margin * 2;
  const text = doc.text || "Converted document";
  const lines = pdf.splitTextToSize(text, width);

  let cursorY = margin;
  lines.forEach((line) => {
    if (cursorY > pdf.internal.pageSize.getHeight() - margin) {
      pdf.addPage();
      cursorY = margin;
    }
    pdf.text(line, margin, cursorY);
    cursorY += 16;
  });

  return {
    name: `${baseName}.pdf`,
    blob: pdf.output("blob"),
    note: "PDF export with flattened text layout.",
  };
}

async function exportXlsx(doc, baseName) {
  if (!window.XLSX) {
    throw new Error("Spreadsheet export is still loading. Refresh once online if needed.");
  }

  const workbook = window.XLSX.utils.book_new();
  if (doc.tables?.length) {
    doc.tables.forEach((rows, index) => {
      const sheet = window.XLSX.utils.aoa_to_sheet(rows);
      window.XLSX.utils.book_append_sheet(workbook, sheet, `Sheet${index + 1}`);
    });
  } else {
    const rows = textToSingleColumnRows(doc.text || "");
    const sheet = window.XLSX.utils.aoa_to_sheet(rows);
    window.XLSX.utils.book_append_sheet(workbook, sheet, "Sheet1");
  }

  const array = window.XLSX.write(workbook, { type: "array", bookType: "xlsx" });
  return {
    name: `${baseName}.xlsx`,
    blob: new Blob([array], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
    note: "Spreadsheet export with sheets or single-column text rows.",
  };
}

async function buildZip(outputs) {
  if (!window.JSZip) {
    throw new Error("ZIP support is still loading. Refresh once online if needed.");
  }
  const zip = new window.JSZip();
  outputs.forEach((output) => zip.file(output.name, output.blob));
  return zip.generateAsync({ type: "blob" });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function linesToHtml(text) {
  return (text || "").split(/\r?\n/).map((line) => `<p>${escapeHtml(line)}</p>`).join("");
}

function wrapHtmlDocument(content) {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Converted document</title></head><body>${content}</body></html>`;
}

function textToSingleColumnRows(text) {
  return (text || "").split(/\r?\n/).filter((line) => line.length > 0).map((line) => [line]);
}

function jsonArrayToRows(array) {
  if (!array.length || typeof array[0] !== "object" || Array.isArray(array[0])) {
    return array.map((value) => [JSON.stringify(value)]);
  }
  const columns = [...new Set(array.flatMap((item) => Object.keys(item)))];
  return [columns, ...array.map((item) => columns.map((column) => item[column] ?? ""))];
}

function csvEscape(value) {
  const text = String(value ?? "");
  if (/[",\n]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`;
  }
  return text;
}

function guessMimeType(extension) {
  return {
    pdf: "application/pdf",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    xls: "application/vnd.ms-excel",
    csv: "text/csv",
    txt: "text/plain",
    html: "text/html",
    htm: "text/html",
    json: "application/json",
    md: "text/markdown",
  }[extension] || "application/octet-stream";
}

async function ensurePdfJs() {
  const module = await import("https://cdn.jsdelivr.net/npm/pdfjs-dist@4.4.168/build/pdf.min.mjs");
  module.GlobalWorkerOptions.workerSrc = "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.4.168/build/pdf.worker.min.mjs";
  return module;
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
