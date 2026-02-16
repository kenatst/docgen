# Release Hardening Checklist

## Global
- [ ] Lancer `bunx tsc --noEmit` sans erreur.
- [ ] Lancer `bun run lint` sans erreur.
- [ ] Verifier qu'aucune erreur runtime n'apparait au demarrage.
- [ ] Verifier la reprise apres crash (fallback ErrorBoundary) avec relance UI.
- [ ] Verifier la navigation iOS/Android (back systeme + back header).
- [ ] Verifier qu'aucun ecran ne passe sous la tab bar.

## Ecran Accueil (Categories)
- [ ] Les 10 categories s'affichent correctement.
- [ ] Chaque carte ouvre la bonne categorie.
- [ ] VoiceOver/TalkBack lit un label utile sur chaque carte.
- [ ] Animations d'arrivee fluides (pas de drop visible).

## Ecran Categorie
- [ ] Le compteur de modeles correspond au nombre affiche.
- [ ] Chaque modele ouvre le bon formulaire.
- [ ] Liste scrollable sans coupure visuelle.
- [ ] Accessibilite: chaque modele a un label/hint vocal.

## Ecran Formulaire
- [ ] Pre-remplissage auto avec le profil (nom, adresse, email, tel, lieu).
- [ ] Raccourci "Date du jour" remplit tous les champs date du template.
- [ ] Raccourci "Mes infos" ecrase bien les champs expediteur existants.
- [ ] Raccourci "Dernier destinataire" reprend les infos attendues.
- [ ] Validation: champs requis, email invalide, erreurs lisibles.
- [ ] Signature import image fonctionnelle.
- [ ] Signature dessin multi-traits fonctionnelle sans scroll parasite.
- [ ] Bouton generation ouvre l'aperçu du document cree.

## Ecran Apercu / Viewer
- [ ] Le contenu texte est complet et selectable.
- [ ] La signature apparait si presente.
- [ ] Copier place bien le texte dans le presse-papiers.
- [ ] Export PDF fonctionne (fichier partageable).
- [ ] Partage natif fonctionne sur iOS/Android.
- [ ] Bouton "Creer un autre document" revient au flux attendu.

## Ecran Historique
- [ ] Le dernier document est en tete.
- [ ] Ouvrir un document affiche bien son detail.
- [ ] Appui long supprime uniquement l'item cible.
- [ ] "Supprimer tout" vide l'historique apres confirmation.
- [ ] Scrolling fluide avec historique long (>100 items).

## Ecran Profil
- [ ] Enregistrement profil persiste apres redemarrage app.
- [ ] Signature enregistree visible dans la preview profil.
- [ ] "Appliquer au formulaire actuel" rouvre le bon template et injecte les donnees.
- [ ] Etat vide profil lisible quand aucune info n'est renseignee.
- [ ] Gestion erreur import signature (message utilisateur present).

## Donnees / Securite
- [ ] Migration legacy -> secure executee sans perte.
- [ ] Historique conserve apres redemarrage (lecture secure primary).
- [ ] Si snapshot primary invalide, fallback staging fonctionne.
- [ ] Purge retention conserve uniquement la fenetre attendue.
- [ ] Aucune donnee sensible n'est loggee en clair.

## Matrice Validation
- [ ] iOS Expo Go
- [ ] Android Expo Go
- [ ] Web (fallbacks partage/impression adaptes)
- [ ] Petit ecran (< 5.5")
- [ ] Mode accessibilite (taille police augmentee)
