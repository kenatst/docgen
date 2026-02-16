import {
  DocumentFormValues,
  DocumentTemplate,
  FormField,
  ToneType,
} from "@/constants/types";

function getPoliteFormula(tone: ToneType): string {
  switch (tone) {
    case "tres_poli":
      return "Je vous prie d'agréer, Madame, Monsieur, l'expression de mes salutations les plus distinguées.";
    case "neutre":
      return "Veuillez agréer, Madame, Monsieur, l'expression de mes salutations distinguées.";
    case "ferme":
      return "Dans l'attente de votre retour rapide, veuillez agréer, Madame, Monsieur, mes salutations distinguées.";
    case "tres_ferme":
      return "Sans réponse sous huitaine, je me réserverai toute voie de droit. Veuillez agréer, Madame, Monsieur, mes salutations.";
  }
}

function getToneOpening(tone: ToneType): string {
  switch (tone) {
    case "tres_poli":
      return "j'ai l'honneur de";
    case "neutre":
      return "je me permets de";
    case "ferme":
      return "je vous informe par la présente que je";
    case "tres_ferme":
      return "je vous mets formellement en demeure de";
  }
}

function normalizedValue(values: DocumentFormValues, key: string): string {
  return (values[key] ?? "").trim();
}

function findFieldLabel(fields: FormField[], key: string): string {
  return fields.find((field) => field.id === key)?.label ?? key;
}

function interpolateText(
  text: string,
  values: DocumentFormValues,
  template: DocumentTemplate,
  tone: ToneType
): string {
  return text.replace(/{{\s*([a-z0-9_]+)\s*}}/gi, (_match, key: string) => {
    if (key === "tone_opening") {
      return getToneOpening(tone);
    }
    if (key === "polite_formula") {
      return getPoliteFormula(tone);
    }

    const value = normalizedValue(values, key);
    if (value) {
      return value;
    }

    const field = template.fields.find((item) => item.id === key);
    if (field?.required) {
      return `[${findFieldLabel(template.fields, key)}]`;
    }

    return "";
  });
}

function compactParagraph(text: string): string {
  return text
    .replace(/\n{3,}/g, "\n\n")
    .replace(/\s+\./g, ".")
    .replace(/\s+,/g, ",")
    .replace(/\s+;/g, ";")
    .trim();
}

function buildHeader(values: DocumentFormValues, mode: DocumentTemplate["headerMode"]): string {
  if (mode === "none") {
    return "";
  }

  const sender = [
    normalizedValue(values, "expediteur_nom"),
    normalizedValue(values, "expediteur_adresse"),
    normalizedValue(values, "expediteur_email"),
    normalizedValue(values, "expediteur_tel"),
  ].filter(Boolean);

  const location = normalizedValue(values, "lieu");
  const date = normalizedValue(values, "date");
  const locationLine = [location ? `A ${location}` : "", date ? `le ${date}` : ""]
    .filter(Boolean)
    .join(", ");

  if (mode === "simple") {
    return [sender.join("\n"), locationLine].filter(Boolean).join("\n\n");
  }

  const recipient = [
    normalizedValue(values, "destinataire_nom"),
    normalizedValue(values, "destinataire_adresse"),
  ].filter(Boolean);

  return [sender.join("\n"), recipient.join("\n"), locationLine]
    .filter((chunk) => chunk.trim().length > 0)
    .join("\n\n");
}

export function validateTemplateValues(
  template: DocumentTemplate,
  values: DocumentFormValues
): string[] {
  const errors: string[] = [];

  for (const field of template.fields) {
    const value = normalizedValue(values, field.id);
    if (field.required && !value) {
      errors.push(`Le champ \"${field.label}\" est requis.`);
      continue;
    }

    if (value && field.type === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        errors.push(`Le champ \"${field.label}\" doit contenir un email valide.`);
      }
    }
  }

  return errors;
}

export function generateDocument(
  template: DocumentTemplate,
  values: DocumentFormValues,
  tone: ToneType
): string {
  const lines: string[] = [];
  const header = buildHeader(values, template.headerMode ?? "letter");

  if (header) {
    lines.push(header);
  }

  if (template.subject) {
    lines.push(compactParagraph(`Objet : ${interpolateText(template.subject, values, template, tone)}`));
  }

  if (template.opening) {
    lines.push(compactParagraph(interpolateText(template.opening, values, template, tone)));
  }

  for (const paragraph of template.paragraphs) {
    if (paragraph.includeIf && !normalizedValue(values, paragraph.includeIf)) {
      continue;
    }

    const rendered = compactParagraph(interpolateText(paragraph.text, values, template, tone));
    if (rendered) {
      lines.push(rendered);
    }
  }

  for (const paragraph of template.closing ?? []) {
    const rendered = compactParagraph(interpolateText(paragraph, values, template, tone));
    if (rendered) {
      lines.push(rendered);
    }
  }

  const senderName =
    normalizedValue(values, "expediteur_nom") || normalizedValue(values, "nom") || "Signature";

  for (const line of template.footer ?? [senderName]) {
    const rendered = compactParagraph(interpolateText(line, values, template, tone));
    if (rendered) {
      lines.push(rendered);
    }
  }

  return lines.join("\n\n");
}
