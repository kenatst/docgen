import { Platform } from "react-native";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { GeneratedDocument } from "@/constants/types";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function toParagraphHtml(content: string): string {
  const chunks = content
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean);

  return chunks
    .map((chunk, index) => {
      const safe = escapeHtml(chunk).replace(/\n/g, "<br />");
      const extraClass = index === 0 ? " paragraph-intro" : "";
      return `<p class=\"paragraph${extraClass}\">${safe}</p>`;
    })
    .join("\n");
}

function toPdfHtml(document: GeneratedDocument): string {
  const paragraphsHtml = toParagraphHtml(document.content);

  const signatureHtml = document.signatureDataUri
    ? `<div class=\"signature-wrap\"><div class=\"signature-title\">Signature</div><img src=\"${escapeHtml(
        document.signatureDataUri
      )}\" alt=\"Signature\" class=\"signature-image\" /></div>`
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
        margin: 22mm 18mm 24mm 18mm;
      }

      :root {
        --text: #1f2a3d;
        --subtle: #5a6781;
        --rule: #d5ddeb;
        --accent: #294a77;
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        font-family: "Times New Roman", "Georgia", serif;
        color: var(--text);
        font-size: 12pt;
        line-height: 1.5;
        background: #fff;
      }

      .sheet {
        width: 100%;
      }

      .brand {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 14mm;
        border-bottom: 1px solid var(--rule);
        padding-bottom: 6mm;
      }

      .brand-title {
        font-family: "Helvetica Neue", "Arial", sans-serif;
        font-size: 10pt;
        color: var(--subtle);
        letter-spacing: 0.05em;
        text-transform: uppercase;
      }

      .brand-document {
        font-family: "Helvetica Neue", "Arial", sans-serif;
        font-size: 9.5pt;
        color: var(--accent);
        font-weight: 600;
      }

      .paragraph {
        margin: 0 0 5.5mm 0;
        text-align: left;
      }

      .paragraph-intro {
        margin-top: 2mm;
      }

      .signature-wrap {
        margin-top: 12mm;
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        page-break-inside: avoid;
      }

      .signature-title {
        font-family: "Helvetica Neue", "Arial", sans-serif;
        color: var(--subtle);
        font-size: 9pt;
        margin-bottom: 2mm;
      }

      .signature-image {
        width: 56mm;
        max-height: 24mm;
        object-fit: contain;
      }

      .footer-rule {
        margin-top: 10mm;
        border-top: 1px solid var(--rule);
        height: 0;
      }
    </style>
  </head>
  <body>
    <main class="sheet">
      <header class="brand">
        <div class="brand-title">Document redige</div>
        <div class="brand-document">${escapeHtml(document.templateTitle)}</div>
      </header>

      ${paragraphsHtml}

      ${signatureHtml}

      <div class="footer-rule"></div>
    </main>
  </body>
</html>`;
}

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
