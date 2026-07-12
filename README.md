# OTJV OPTECH Coaching

Application web statique, sans Node.js et sans base de données.

## Déploiement GitHub + Netlify

1. Créer un dépôt GitHub vide.
2. Décompresser le ZIP et téléverser tous les fichiers à la racine du dépôt.
3. Dans Netlify : **Add new project > Import an existing project > GitHub**.
4. Sélectionner le dépôt.
5. Laisser la commande de build vide.
6. Dossier de publication : `.`
7. Publier.

## Test rapide sans GitHub

Dans Netlify, utiliser le déploiement manuel par glisser-déposer du dossier décompressé.

## Fonctionnement

- Aucun compte ni serveur.
- Brouillon conservé localement dans le navigateur.
- Export Excel à partir de `template.xlsx`.
- Export PDF autonome.
- Les bibliothèques JavaScript sont chargées depuis jsDelivr : une connexion internet est nécessaire à l'ouverture de l'application.

## Cellules remplies dans le modèle

- `A6` : personne coachée
- `D6` : coach
- `F6` : date et heure
- `A9` : activité
- `F9` : emplacement
- `E14:H21` : catégorie de score de chaque thème
- `F24` : total obtenu
- `F25` : total possible
- `F26` : pourcentage
- `I24` : commentaire

Les signatures sont ajoutées sous le tableau des résultats.
