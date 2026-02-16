export type ToneType = "tres_poli" | "neutre" | "ferme" | "tres_ferme";

export type FieldType = "text" | "email" | "date" | "phone" | "number" | "textarea";

export type FieldSection = "expediteur" | "destinataire" | "demande" | "pieces";

export interface ToneOption {
  id: ToneType;
  label: string;
  description: string;
}

export interface FormField {
  id: string;
  label: string;
  placeholder: string;
  required: boolean;
  type?: FieldType;
  multiline?: boolean;
  section?: FieldSection;
  helperText?: string;
}

export interface TemplateReference {
  title: string;
  url: string;
  verifiedAt: string;
}

export interface TemplateParagraph {
  text: string;
  includeIf?: string;
}

export type HeaderMode = "letter" | "simple" | "none";

export interface DocumentCategory {
  id: string;
  title: string;
  icon: string;
  color: string;
  description: string;
}

export interface DocumentTemplate {
  id: string;
  version: "v1";
  title: string;
  categoryId: string;
  description: string;
  fields: FormField[];
  subject?: string;
  opening?: string;
  paragraphs: TemplateParagraph[];
  closing?: string[];
  footer?: string[];
  toneEnabled?: boolean;
  headerMode?: HeaderMode;
  references?: TemplateReference[];
}

export type DocumentFormValues = Record<string, string>;

export interface GeneratedDocument {
  id: string;
  templateId: string;
  templateVersion: string;
  templateTitle: string;
  categoryTitle: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  values: DocumentFormValues;
  tone: ToneType;
  signatureDataUri?: string;
}

export interface UserProfile {
  expediteur_nom: string;
  expediteur_adresse: string;
  expediteur_email: string;
  expediteur_tel: string;
  lieu: string;
  signatureDataUri?: string;
}

export const TONE_OPTIONS: ToneOption[] = [
  { id: "tres_poli", label: "Très poli", description: "Courtois et diplomate" },
  { id: "neutre", label: "Neutre", description: "Professionnel standard" },
  { id: "ferme", label: "Ferme", description: "Direct et affirmé" },
  { id: "tres_ferme", label: "Très ferme", description: "Injonctif et pressant" },
];

export const FIELD_SECTION_LABELS: Record<FieldSection, string> = {
  expediteur: "Vos informations",
  destinataire: "Destinataire",
  demande: "Demande",
  pieces: "Références / Pièces",
};
