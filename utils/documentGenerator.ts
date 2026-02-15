import { DocumentFormData, ToneType } from "@/constants/types";

function getPoliteFormula(tone: ToneType): string {
  switch (tone) {
    case "tres_poli":
      return "Je vous prie d'agréer, Madame, Monsieur, l'expression de mes salutations les plus distinguées.";
    case "neutre":
      return "Veuillez agréer, Madame, Monsieur, l'expression de mes salutations distinguées.";
    case "ferme":
      return "Dans l'attente de votre réponse rapide, veuillez agréer, Madame, Monsieur, mes salutations distinguées.";
    case "tres_ferme":
      return "Dans l'attente d'une réponse sous huitaine, je vous prie d'agréer, Madame, Monsieur, mes salutations.";
  }
}

function getToneIntro(tone: ToneType): { opening: string; style: string } {
  switch (tone) {
    case "tres_poli":
      return { opening: "J'ai l'honneur de", style: "courtois" };
    case "neutre":
      return { opening: "Je me permets de", style: "professionnel" };
    case "ferme":
      return { opening: "Je vous informe par la présente que je", style: "direct" };
    case "tres_ferme":
      return { opening: "Je vous mets en demeure de", style: "exigeant" };
  }
}

function buildHeader(data: DocumentFormData): string {
  let header = "";
  if (data.nom) {
    header += data.nom + "\n";
  }
  if (data.adresse) {
    header += data.adresse + "\n";
  }
  if (data.email) {
    header += data.email + "\n";
  }
  header += "\n";
  if (data.destinataire) {
    header += data.destinataire + "\n";
  }
  if (data.adresse_destinataire) {
    header += data.adresse_destinataire + "\n";
  }
  header += "\n";
  if (data.date) {
    header += "Le " + data.date + "\n";
  }
  return header;
}

export function generateDocument(templateId: string, data: DocumentFormData): string {
  const header = buildHeader(data);
  const formula = getPoliteFormula(data.tone);
  const { opening } = getToneIntro(data.tone);
  const details = data.details ? `\n${data.details}\n` : "";

  const generators: Record<string, () => string> = {
    resil_sport: () => {
      return `${header}\nObjet : Résiliation de mon abonnement en salle de sport\n\nMadame, Monsieur,\n\n${opening} vous informer de ma décision de résilier mon abonnement à votre salle de sport, et ce à compter de la réception de la présente.\n\nJe vous demande de bien vouloir prendre acte de cette résiliation et de procéder à la clôture de mon compte dans les meilleurs délais.${details}\n\nJe vous remercie de me confirmer la bonne prise en compte de cette demande par retour de courrier ou par email.\n\n${formula}\n\n${data.nom}`;
    },
    resil_assurance: () => {
      return `${header}\nObjet : Résiliation de mon contrat d'assurance\n\nMadame, Monsieur,\n\n${opening} vous notifier ma volonté de résilier mon contrat d'assurance souscrit auprès de vos services.\n\nConformément aux dispositions légales en vigueur, je vous prie de bien vouloir procéder à la résiliation effective de ce contrat et de me confirmer la date de fin de couverture.${details}\n\nJe vous saurais gré de me faire parvenir un accusé de réception de la présente ainsi que tout document attestant de la résiliation.\n\n${formula}\n\n${data.nom}`;
    },
    resil_telecom: () => {
      return `${header}\nObjet : Résiliation de mon abonnement téléphonique / internet\n\nMadame, Monsieur,\n\n${opening} vous informer de ma décision de résilier mon abonnement téléphonique et/ou internet souscrit auprès de vos services.\n\nJe vous demande de procéder à la résiliation dans les délais prévus par les conditions générales de vente et de me communiquer les éventuelles modalités de restitution du matériel.${details}\n\nJe vous remercie de bien vouloir m'adresser une confirmation écrite de cette résiliation.\n\n${formula}\n\n${data.nom}`;
    },
    resil_mutuelle: () => {
      return `${header}\nObjet : Résiliation de ma mutuelle santé\n\nMadame, Monsieur,\n\n${opening} vous faire part de ma volonté de résilier mon contrat de mutuelle santé.\n\nJe vous prie de bien vouloir enregistrer cette résiliation et de m'indiquer la date effective de fin de couverture ainsi que les éventuelles démarches restant à accomplir de ma part.${details}\n\n${formula}\n\n${data.nom}`;
    },
    resil_saas: () => {
      return `${header}\nObjet : Résiliation de mon abonnement à votre service en ligne\n\nMadame, Monsieur,\n\n${opening} vous informer que je souhaite mettre fin à mon abonnement à votre service en ligne.\n\nJe vous demande de bien vouloir procéder à la résiliation de mon compte et de cesser tout prélèvement à compter de cette date.${details}\n\nJe vous remercie de me confirmer cette résiliation par écrit.\n\n${formula}\n\n${data.nom}`;
    },
    resil_bail: () => {
      return `${header}\nObjet : Résiliation de bail locatif — Congé du locataire\n\nMadame, Monsieur,\n\n${opening} vous notifier par la présente mon intention de quitter le logement situé à l'adresse mentionnée ci-dessus.\n\nConformément aux dispositions de la loi du 6 juillet 1989, je vous informe que le préavis courra à compter de la réception de cette lettre.${details}\n\nJe reste à votre disposition pour convenir d'une date d'état des lieux de sortie.\n\n${formula}\n\n${data.nom}`;
    },
    resil_prestation: () => {
      return `${header}\nObjet : Résiliation de contrat de prestation de services\n\nMadame, Monsieur,\n\n${opening} vous informer de ma décision de mettre fin au contrat de prestation de services qui nous lie.\n\nJe vous prie de bien vouloir prendre les dispositions nécessaires pour clôturer ce contrat dans les conditions prévues.${details}\n\n${formula}\n\n${data.nom}`;
    },
    med_paiement: () => {
      return `${header}\nObjet : Mise en demeure de paiement\n\nMadame, Monsieur,\n\nMalgré mes précédentes relances, je constate que la somme qui m'est due reste impayée à ce jour.\n\nPar la présente, ${opening} procéder au règlement intégral de cette somme dans un délai de huit (8) jours à compter de la réception de ce courrier.${details}\n\nÀ défaut de paiement dans le délai imparti, je me réserve le droit d'engager toutes les poursuites judiciaires nécessaires au recouvrement de ma créance, sans autre mise en garde.\n\n${formula}\n\n${data.nom}`;
    },
    med_livraison: () => {
      return `${header}\nObjet : Mise en demeure de livraison\n\nMadame, Monsieur,\n\nJe constate que la livraison prévue n'a toujours pas été effectuée malgré le dépassement du délai convenu.\n\nPar la présente, ${opening} procéder à la livraison des biens ou services commandés dans un délai de huit (8) jours.${details}\n\nÀ défaut, je me réserve le droit de demander le remboursement intégral des sommes versées et d'engager toute action appropriée.\n\n${formula}\n\n${data.nom}`;
    },
    med_travaux: () => {
      return `${header}\nObjet : Mise en demeure pour travaux non effectués\n\nMadame, Monsieur,\n\nJe vous ai confié la réalisation de travaux qui, à ce jour, n'ont pas été exécutés conformément à nos engagements.\n\nPar la présente, ${opening} achever les travaux convenus dans un délai de quinze (15) jours à compter de la réception de ce courrier.${details}\n\nPassé ce délai, je me réserve le droit de faire appel à un autre prestataire aux frais avancés et d'engager toute procédure utile.\n\n${formula}\n\n${data.nom}`;
    },
    med_judiciaire: () => {
      return `${header}\nObjet : Mise en demeure avant action judiciaire\n\nMadame, Monsieur,\n\nLe présent courrier constitue une mise en demeure formelle.\n\nMalgré mes précédentes démarches restées sans effet, je vous demande de régulariser la situation décrite ci-après dans un délai de huit (8) jours.${details}\n\nÀ défaut de réponse satisfaisante dans le délai imparti, je n'aurai d'autre choix que de saisir la juridiction compétente afin de faire valoir mes droits. Les frais de procédure seront alors à votre charge.\n\n${formula}\n\n${data.nom}`;
    },
    att_honneur: () => {
      return `${header}\nObjet : Attestation sur l'honneur\n\nJe soussigné(e), ${data.nom}${data.adresse ? ", demeurant au " + data.adresse : ""}, atteste sur l'honneur que les informations suivantes sont exactes :\n${details || "\n[Précisez l'objet de votre attestation]\n"}\n\nFait pour servir et valoir ce que de droit.\n\nFait le ${data.date || "[date]"}.\n\n${data.nom}\nSignature`;
    },
    att_hebergement: () => {
      return `${header}\nObjet : Attestation d'hébergement\n\nJe soussigné(e), ${data.nom}${data.adresse ? ", demeurant au " + data.adresse : ""}, certifie sur l'honneur héberger à mon domicile :\n\n${data.destinataire || "[Nom de la personne hébergée]"}\n${details ? "\n" + details : ""}\n\nCette attestation est établie pour servir et valoir ce que de droit.\n\nFait le ${data.date || "[date]"}.\n\n${data.nom}\nSignature`;
    },
    att_non_emploi: () => {
      return `${header}\nObjet : Attestation de non-emploi\n\nJe soussigné(e), ${data.nom}, atteste sur l'honneur ne pas exercer d'activité professionnelle salariée ou non salariée à la date du ${data.date || "[date]"}.${details}\n\nFait pour servir et valoir ce que de droit.\n\nFait le ${data.date || "[date]"}.\n\n${data.nom}\nSignature`;
    },
    att_domicile: () => {
      return `${header}\nObjet : Attestation de domicile\n\nJe soussigné(e), ${data.nom}, certifie sur l'honneur que mon domicile actuel se situe au :\n\n${data.adresse || "[Votre adresse complète]"}\n${details ? "\n" + details : ""}\n\nFait pour servir et valoir ce que de droit.\n\nFait le ${data.date || "[date]"}.\n\n${data.nom}\nSignature`;
    },
    att_cessation: () => {
      return `${header}\nObjet : Attestation de cessation d'activité\n\nJe soussigné(e), ${data.nom}, atteste sur l'honneur avoir cessé toute activité professionnelle.${details}\n\nFait pour servir et valoir ce que de droit.\n\nFait le ${data.date || "[date]"}.\n\n${data.nom}\nSignature`;
    },
    rh_demission: () => {
      return `${header}\nObjet : Lettre de démission\n\nMadame, Monsieur,\n\n${opening} vous informer de ma décision de démissionner de mon poste au sein de votre entreprise.\n\nConformément aux dispositions de mon contrat de travail et de la convention collective applicable, mon préavis débutera à compter de la réception de la présente.${details}\n\nJe vous remercie pour les opportunités qui m'ont été offertes durant cette période et reste à votre disposition pour assurer une transition dans les meilleures conditions.\n\n${formula}\n\n${data.nom}`;
    },
    rh_periode_essai: () => {
      return `${header}\nObjet : Rupture de la période d'essai\n\nMadame, Monsieur,\n\n${opening} vous informer de ma décision de mettre fin à la période d'essai de mon contrat de travail.\n\nCette rupture prendra effet dans le respect du délai de prévenance prévu par la loi.${details}\n\n${formula}\n\n${data.nom}`;
    },
    rh_conges: () => {
      return `${header}\nObjet : Demande de congés\n\nMadame, Monsieur,\n\n${opening} vous soumettre une demande de congés.${details ? "\n" + details : ""}\n\nJe me suis assuré(e) que mon absence ne perturbera pas le bon fonctionnement du service et j'ai pris les dispositions nécessaires pour assurer la continuité de mes missions.\n\nJe vous remercie de bien vouloir me confirmer votre accord.\n\n${formula}\n\n${data.nom}`;
    },
    rh_teletravail: () => {
      return `${header}\nObjet : Demande de télétravail\n\nMadame, Monsieur,\n\n${opening} vous adresser une demande de mise en place du télétravail dans le cadre de mes fonctions.\n\nJe suis convaincu(e) que cette organisation me permettrait de maintenir, voire d'améliorer, ma productivité tout en conciliant au mieux mes obligations professionnelles et personnelles.${details}\n\nJe reste bien entendu disponible pour en discuter avec vous à votre convenance.\n\n${formula}\n\n${data.nom}`;
    },
    rh_refus_offre: () => {
      return `${header}\nObjet : Refus de proposition professionnelle\n\nMadame, Monsieur,\n\nJe vous remercie sincèrement pour la proposition que vous m'avez adressée.\n\nAprès mûre réflexion, ${opening} vous informer que je ne suis pas en mesure de donner suite à cette offre.${details}\n\nJe vous souhaite le meilleur dans vos recherches et reste ouvert(e) à d'éventuelles collaborations futures.\n\n${formula}\n\n${data.nom}`;
    },
    rh_rupture_conv: () => {
      return `${header}\nObjet : Demande de rupture conventionnelle\n\nMadame, Monsieur,\n\n${opening} vous proposer une rupture conventionnelle de mon contrat de travail.\n\nCette demande est motivée par des raisons personnelles et professionnelles que je souhaiterais évoquer avec vous lors d'un entretien.${details}\n\nJe me tiens à votre disposition pour fixer une date d'entretien à votre convenance.\n\n${formula}\n\n${data.nom}`;
    },
    adm_reclamation: () => {
      return `${header}\nObjet : Réclamation\n\nMadame, Monsieur,\n\n${opening} porter à votre attention la situation suivante, qui nécessite votre intervention.${details ? "\n" + details : ""}\n\nJe vous demande de bien vouloir examiner cette réclamation et d'y apporter une réponse dans les meilleurs délais.\n\n${formula}\n\n${data.nom}`;
    },
    adm_facture: () => {
      return `${header}\nObjet : Contestation de facture\n\nMadame, Monsieur,\n\n${opening} contester la facture qui m'a été adressée, que j'estime non conforme.${details ? "\n" + details : ""}\n\nJe vous demande de bien vouloir procéder à la vérification de cette facture et de me transmettre un correctif le cas échéant.\n\nDans l'attente de votre réponse, je suspends le paiement de la somme contestée.\n\n${formula}\n\n${data.nom}`;
    },
    adm_amende: () => {
      return `${header}\nObjet : Contestation d'amende\n\nMadame, Monsieur,\n\n${opening} contester l'amende qui m'a été notifiée, que je considère injustifiée pour les raisons suivantes.${details ? "\n" + details : ""}\n\nJe vous prie de bien vouloir réexaminer ce dossier et de procéder à l'annulation de cette contravention.\n\n${formula}\n\n${data.nom}`;
    },
    adm_remboursement: () => {
      return `${header}\nObjet : Demande de remboursement\n\nMadame, Monsieur,\n\n${opening} vous demander le remboursement d'une somme que j'estime m'être due.${details ? "\n" + details : ""}\n\nJe vous remercie de bien vouloir procéder à ce remboursement dans les meilleurs délais et de me confirmer la bonne réception de cette demande.\n\n${formula}\n\n${data.nom}`;
    },
    adm_delai: () => {
      return `${header}\nObjet : Demande de délai de paiement\n\nMadame, Monsieur,\n\n${opening} solliciter un délai de paiement pour la somme qui m'est réclamée.\n\nDes difficultés temporaires ne me permettent pas de m'acquitter de cette dette dans l'immédiat.${details}\n\nJe m'engage à respecter l'échéancier que nous conviendrons ensemble et vous remercie par avance de votre compréhension.\n\n${formula}\n\n${data.nom}`;
    },
    div_loyer: () => {
      return `${header}\nObjet : Refus d'augmentation de loyer\n\nMadame, Monsieur,\n\nJ'ai bien reçu votre courrier m'informant de l'augmentation de mon loyer.\n\nAprès examen, ${opening} vous informer que je conteste cette augmentation que j'estime non conforme aux dispositions légales en vigueur.${details}\n\nJe vous demande de bien vouloir reconsidérer cette hausse ou de me fournir les justificatifs la rendant applicable.\n\n${formula}\n\n${data.nom}`;
    },
    div_syndic: () => {
      return `${header}\nObjet : Signalement d'un problème\n\nMadame, Monsieur,\n\n${opening} vous signaler un problème qui affecte notre copropriété et nécessite votre intervention rapide.${details ? "\n" + details : ""}\n\nJe vous demande de bien vouloir prendre les mesures nécessaires dans les meilleurs délais et de me tenir informé(e) des suites données.\n\n${formula}\n\n${data.nom}`;
    },
    div_collab: () => {
      return `${header}\nObjet : Fin de collaboration\n\nMadame, Monsieur,\n\n${opening} vous informer de ma décision de mettre fin à notre collaboration.\n\nJe vous remercie pour la qualité des échanges que nous avons eus et souhaite que cette séparation se fasse dans les meilleures conditions possibles.${details}\n\n${formula}\n\n${data.nom}`;
    },
    div_geste: () => {
      return `${header}\nObjet : Demande de geste commercial\n\nMadame, Monsieur,\n\n${opening} solliciter un geste commercial de votre part suite à la situation décrite ci-après.${details ? "\n" + details : ""}\n\nEn tant que client fidèle, j'espère que vous pourrez accéder à ma demande et ainsi préserver notre relation commerciale.\n\n${formula}\n\n${data.nom}`;
    },
    div_devis: () => {
      return `${header}\nObjet : Refus de devis\n\nMadame, Monsieur,\n\nJe vous remercie pour le devis que vous m'avez fait parvenir.\n\nAprès étude, ${opening} vous informer que je ne donne pas suite à cette proposition.${details}\n\nJe vous souhaite bonne continuation dans vos activités.\n\n${formula}\n\n${data.nom}`;
    },
  };

  const generator = generators[templateId];
  if (generator) {
    return generator();
  }

  return `${header}\nObjet : ${templateId}\n\nMadame, Monsieur,\n\n${opening} vous adresser ce courrier.${details}\n\n${formula}\n\n${data.nom}`;
}
