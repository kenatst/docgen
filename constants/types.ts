export type ToneType = "tres_poli" | "neutre" | "ferme" | "tres_ferme";

export interface ToneOption {
  id: ToneType;
  label: string;
  description: string;
}

export interface DocumentCategory {
  id: string;
  title: string;
  icon: string;
  color: string;
  description: string;
  templates: DocumentTemplate[];
}

export interface DocumentTemplate {
  id: string;
  title: string;
  categoryId: string;
  fields: FormField[];
}

export interface FormField {
  id: string;
  label: string;
  placeholder: string;
  required: boolean;
  multiline?: boolean;
  type?: "text" | "date" | "email";
}

export interface DocumentFormData {
  nom: string;
  adresse: string;
  email: string;
  destinataire: string;
  adresse_destinataire: string;
  date: string;
  details: string;
  tone: ToneType;
}

export interface GeneratedDocument {
  id: string;
  templateId: string;
  templateTitle: string;
  categoryTitle: string;
  content: string;
  createdAt: string;
  formData: DocumentFormData;
}

export const TONE_OPTIONS: ToneOption[] = [
  { id: "tres_poli", label: "Très poli", description: "Ton courtois et déférent" },
  { id: "neutre", label: "Neutre", description: "Ton professionnel standard" },
  { id: "ferme", label: "Ferme", description: "Ton direct et assertif" },
  { id: "tres_ferme", label: "Très ferme", description: "Ton exigeant et insistant" },
];
