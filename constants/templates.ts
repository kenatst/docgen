import { DocumentCategory, FormField } from "./types";

const COMMON_FIELDS: FormField[] = [
  { id: "nom", label: "Prénom et Nom", placeholder: "Jean Dupont", required: true },
  { id: "adresse", label: "Votre adresse", placeholder: "12 rue de la Paix, 75001 Paris", required: false },
  { id: "email", label: "Votre email", placeholder: "jean.dupont@email.com", required: false, type: "email" },
  { id: "destinataire", label: "Destinataire", placeholder: "Nom de l'organisme ou de la personne", required: true },
  { id: "adresse_destinataire", label: "Adresse du destinataire", placeholder: "Adresse complète", required: false },
  { id: "date", label: "Date", placeholder: "7 février 2026", required: true, type: "date" },
  { id: "details", label: "Contexte / Détails", placeholder: "Précisez votre situation...", required: false, multiline: true },
];

export const CATEGORIES: DocumentCategory[] = [
  {
    id: "resiliation",
    title: "Résiliation",
    icon: "scissors",
    color: "#C0392B",
    description: "Mettez fin à vos contrats et abonnements",
    templates: [
      { id: "resil_sport", title: "Résiliation salle de sport", categoryId: "resiliation", fields: COMMON_FIELDS },
      { id: "resil_assurance", title: "Résiliation assurance", categoryId: "resiliation", fields: COMMON_FIELDS },
      { id: "resil_telecom", title: "Résiliation téléphone / internet", categoryId: "resiliation", fields: COMMON_FIELDS },
      { id: "resil_mutuelle", title: "Résiliation mutuelle", categoryId: "resiliation", fields: COMMON_FIELDS },
      { id: "resil_saas", title: "Résiliation service en ligne", categoryId: "resiliation", fields: COMMON_FIELDS },
      { id: "resil_bail", title: "Résiliation bail locatif", categoryId: "resiliation", fields: COMMON_FIELDS },
      { id: "resil_prestation", title: "Résiliation contrat de prestation", categoryId: "resiliation", fields: COMMON_FIELDS },
    ],
  },
  {
    id: "mise_en_demeure",
    title: "Mise en demeure",
    icon: "alert-triangle",
    color: "#D4850A",
    description: "Exigez le respect de vos droits",
    templates: [
      { id: "med_paiement", title: "Mise en demeure de paiement", categoryId: "mise_en_demeure", fields: COMMON_FIELDS },
      { id: "med_livraison", title: "Mise en demeure de livraison", categoryId: "mise_en_demeure", fields: COMMON_FIELDS },
      { id: "med_travaux", title: "Mise en demeure pour travaux", categoryId: "mise_en_demeure", fields: COMMON_FIELDS },
      { id: "med_judiciaire", title: "Mise en demeure pré-judiciaire", categoryId: "mise_en_demeure", fields: COMMON_FIELDS },
    ],
  },
  {
    id: "attestations",
    title: "Attestations",
    icon: "file-check",
    color: "#2E7D5B",
    description: "Attestations sur l'honneur et certificats",
    templates: [
      { id: "att_honneur", title: "Attestation sur l'honneur", categoryId: "attestations", fields: COMMON_FIELDS },
      { id: "att_hebergement", title: "Attestation d'hébergement", categoryId: "attestations", fields: COMMON_FIELDS },
      { id: "att_non_emploi", title: "Attestation de non-emploi", categoryId: "attestations", fields: COMMON_FIELDS },
      { id: "att_domicile", title: "Attestation de domicile", categoryId: "attestations", fields: COMMON_FIELDS },
      { id: "att_cessation", title: "Attestation de cessation d'activité", categoryId: "attestations", fields: COMMON_FIELDS },
    ],
  },
  {
    id: "rh_travail",
    title: "RH / Travail",
    icon: "briefcase",
    color: "#1B2A4A",
    description: "Démission, congés, télétravail...",
    templates: [
      { id: "rh_demission", title: "Lettre de démission", categoryId: "rh_travail", fields: COMMON_FIELDS },
      { id: "rh_periode_essai", title: "Rupture de période d'essai", categoryId: "rh_travail", fields: COMMON_FIELDS },
      { id: "rh_conges", title: "Demande de congés", categoryId: "rh_travail", fields: COMMON_FIELDS },
      { id: "rh_teletravail", title: "Demande de télétravail", categoryId: "rh_travail", fields: COMMON_FIELDS },
      { id: "rh_refus_offre", title: "Refus de proposition professionnelle", categoryId: "rh_travail", fields: COMMON_FIELDS },
      { id: "rh_rupture_conv", title: "Demande de rupture conventionnelle", categoryId: "rh_travail", fields: COMMON_FIELDS },
    ],
  },
  {
    id: "administratif",
    title: "Administratif",
    icon: "file-text",
    color: "#5B2C8A",
    description: "Réclamations, contestations, remboursements",
    templates: [
      { id: "adm_reclamation", title: "Réclamation administrative", categoryId: "administratif", fields: COMMON_FIELDS },
      { id: "adm_facture", title: "Contestation de facture", categoryId: "administratif", fields: COMMON_FIELDS },
      { id: "adm_amende", title: "Contestation d'amende", categoryId: "administratif", fields: COMMON_FIELDS },
      { id: "adm_remboursement", title: "Demande de remboursement", categoryId: "administratif", fields: COMMON_FIELDS },
      { id: "adm_delai", title: "Demande de délai de paiement", categoryId: "administratif", fields: COMMON_FIELDS },
    ],
  },
  {
    id: "divers",
    title: "Divers",
    icon: "layers",
    color: "#2980B9",
    description: "Loyer, syndic, geste commercial...",
    templates: [
      { id: "div_loyer", title: "Refus d'augmentation de loyer", categoryId: "divers", fields: COMMON_FIELDS },
      { id: "div_syndic", title: "Signalement au syndic", categoryId: "divers", fields: COMMON_FIELDS },
      { id: "div_collab", title: "Fin de collaboration", categoryId: "divers", fields: COMMON_FIELDS },
      { id: "div_geste", title: "Demande de geste commercial", categoryId: "divers", fields: COMMON_FIELDS },
      { id: "div_devis", title: "Refus de devis", categoryId: "divers", fields: COMMON_FIELDS },
    ],
  },
];

export function findTemplate(templateId: string) {
  for (const cat of CATEGORIES) {
    const tpl = cat.templates.find((t) => t.id === templateId);
    if (tpl) return { template: tpl, category: cat };
  }
  return null;
}
