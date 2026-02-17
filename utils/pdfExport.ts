import { Platform } from "react-native";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { GeneratedDocument } from "@/constants/types";

/* ── Helpers ──────────────────────────────────────────────── */

function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Convert the plain-text body into structured HTML.
 * The generated document content already contains the full letter
 * (header, subject, paragraphs, closing, name). We split it into
 * sections to apply the formal layout.
 */
function parseContent(content: string): {
  senderLines: string[];
  recipientLines: string[];
  dateLine: string;
  subjectLine: string;
  bodyParagraphs: string[];
  closingName: string;
} {
  const blocks = content.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);

  const senderLines: string[] = [];
  const recipientLines: string[] = [];
  let dateLine = "";
  let subjectLine = "";
  const bodyParagraphs: string[] = [];
  let closingName = "";

  let phase: "sender" | "recipient" | "body" = "sender";

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];

    // Detect "A [lieu], le [date]" line
    if (/^[AÀ]\s+.+,\s*(le\s+)?/i.test(block) && !dateLine) {
      dateLine = block;
      phase = "body";
      continue;
    }

    // Detect "Objet :" line
    if (/^Objet\s*:/i.test(block)) {
      subjectLine = block;
      phase = "body";
      continue;
    }

    // In sender phase — first block(s) are sender info
    if (phase === "sender") {
      // If it looks like a person/company block (no "Madame" etc.), it's sender or recipient
      const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);

      // Heuristic: if we already have sender lines and this block doesn't start
      // with a greeting like "Madame", treat it as recipient
      if (senderLines.length > 0 && !block.match(/^(Madame|Monsieur|Cher|Chère)/i)) {
        recipientLines.push(...lines);
        phase = "body";
        continue;
      }

      senderLines.push(...lines);
      continue;
    }

    // Body paragraphs
    bodyParagraphs.push(block);
  }

  // Last body paragraph could be the sender name (short, no period)
  if (bodyParagraphs.length > 1) {
    const last = bodyParagraphs[bodyParagraphs.length - 1];
    if (last.length < 80 && !last.endsWith(".") && !last.endsWith(",")) {
      closingName = bodyParagraphs.pop()!;
    }
  }

  return { senderLines, recipientLines, dateLine, subjectLine, bodyParagraphs, closingName };
}

/* ── HTML generation ──────────────────────────────────────── */

function toPdfHtml(document: GeneratedDocument): string {
  const parsed = parseContent(document.content);

  const senderHtml = parsed.senderLines.length > 0
    ? `<div class="sender">${parsed.senderLines.map((l) => `<div>${esc(l)}</div>`).join("")}</div>`
    : "";

  const recipientHtml = parsed.recipientLines.length > 0
    ? `<div class="recipient">${parsed.recipientLines.map((l) => `<div>${esc(l)}</div>`).join("")}</div>`
    : "";

  const dateHtml = parsed.dateLine
    ? `<div class="date-line">${esc(parsed.dateLine)}</div>`
    : "";

  const subjectHtml = parsed.subjectLine
    ? `<div class="subject">${esc(parsed.subjectLine)}</div>`
    : "";

  const bodyHtml = parsed.bodyParagraphs
    .map((p) => {
      const safe = esc(p).replace(/\n/g, "<br />");
      return `<p class="body-paragraph">${safe}</p>`;
    })
    .join("\n");

  const signatureHtml = document.signatureDataUri
    ? `<div class="signature-block">
        <img src="${esc(document.signatureDataUri)}" alt="Signature" class="signature-image" />
      </div>`
    : "";

  const closingNameHtml = parsed.closingName
    ? `<div class="closing-name">${esc(parsed.closingName)}</div>`
    : "";

  return `
<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      @page {
        size: A4;
        margin: 25mm 25mm 25mm 25mm;
      }

      :root {
        --text: #1a1a1a;
        --muted: #555;
        --rule: #ccc;
      }

      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }

      body {
        font-family: "Times New Roman", "Georgia", serif;
        color: var(--text);
        font-size: 12pt;
        line-height: 1.6;
        background: #fff;
      }

      .page {
        width: 100%;
        position: relative;
      }

      /* ── Sender (top-left, italic, bold) ── */
      .sender {
        font-style: italic;
        font-weight: bold;
        font-size: 12pt;
        line-height: 1.5;
        margin-bottom: 10mm;
      }

      /* ── Recipient (right-aligned) ── */
      .recipient {
        text-align: right;
        font-weight: bold;
        font-size: 12pt;
        line-height: 1.5;
        margin-bottom: 10mm;
      }

      /* ── Date line ── */
      .date-line {
        font-style: italic;
        margin-bottom: 10mm;
      }

      /* ── Subject (bold, with underline) ── */
      .subject {
        font-weight: bold;
        margin-bottom: 10mm;
        padding-bottom: 2mm;
      }

      /* ── Body ── */
      .body-paragraph {
        margin-bottom: 6mm;
        text-align: justify;
        text-indent: 0;
      }

      .body-paragraph:first-of-type {
        margin-top: 2mm;
      }

      /* ── Closing name ── */
      .closing-name {
        margin-top: 10mm;
        font-weight: bold;
        font-style: italic;
      }

      /* ── Signature ── */
      .signature-block {
        margin-top: 8mm;
        page-break-inside: avoid;
      }

      .signature-image {
        width: 50mm;
        max-height: 22mm;
        object-fit: contain;
      }
    </style>
  </head>
  <body>
    <main class="page">
      ${senderHtml}
      ${recipientHtml}
      ${dateHtml}
      ${subjectHtml}

      ${bodyHtml}

      ${closingNameHtml}
      ${signatureHtml}
    </main>
  </body>
</html>`;
}

/* ── Export function ───────────────────────────────────────── */

export async function exportDocumentPdf(document: GeneratedDocument): Promise<{ uri?: string }> {
  const html = toPdfHtml(document);

  if (Platform.OS === "web") {
    await Print.printAsync({ html });
    return {};
  }

  const file = await Print.printToFileAsync({ html });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, {
      mimeType: "application/pdf",
      dialogTitle: `Exporter ${document.templateTitle}`,
    });
  }

  return { uri: file.uri };
}
