# Les Traces de la Mémoire – prototype v0.4

Prototype visiteur de l’enquête pilote, construit avec la pile technique du dossier de conception :

| Couche | Outil |
|---|---|
| Interface | **Vue 3** + **TypeScript** (composants `.vue`, Composition API) |
| Outillage | **Vite** |
| Navigation | **Vue Router** (routes `/enquete/:id/etape/:ordre`, `/e/:etapeId` pour les QR codes) |
| État | **Pinia**, progression et carnet enregistrés dans le navigateur (`localStorage`) |
| Maquette 3D | **Three.js** : Fort schématique au crépuscule, punaises cliquables, fil rouge animé (chargé à la demande, repli 2D automatique) |
| Carte | **Leaflet** en mode `CRS.Simple` : plan interne du Fort, sans GPS |
| API | **Node.js / Express** (routes publiques `GET /api/enquetes/:id`, `/api/etapes/:id`, `/api/lieux`) |

## Lancer le projet

```bash
npm install
npm run dev          # front sur http://localhost:5173 (lit le JSON local)
npm run api          # API Express sur http://localhost:3000
```

Pour que le front utilise l’API : copier `.env.example` en `.env` et décommenter `VITE_API_URL`.

```bash
npm run build        # vérification TypeScript + build de production
npm run build:demo   # un seul fichier HTML autonome (dist-demo/index.html)
```

## Déploiement

Chaque `git push` sur la branche `main` construit le site et le publie sur **GitHub Pages**
(workflow `.github/workflows/deploy.yml`). Dans le dépôt : *Settings → Pages → Source : GitHub Actions*.

## Structure

```
src/
  data/enquete-pilote.json   # même forme que la réponse de GET /api/enquetes/:id
  types.ts                   # types alignés sur le diagramme de classes v1.1
  services/api.ts            # JSON local ou API selon VITE_API_URL
  stores/progress.ts         # progression (Pinia + localStorage)
  components/                # PlanMap (Leaflet), QuestionBlock, ArchiveSlot, ProgressRail
  views/                     # Accueil, Enquête (plan), Étape, Fresque, entrée QR
server/index.js              # API Express
```

## Direction artistique

Thème « dossier d’enquête » : papier, fiches, tampons, carnet manuscrit, plan à l’encre et fil rouge.
Polices embarquées (Fontsource, licence OFL) : Fraunces (titres), Inter (texte), Special Elite (machine à écrire), Caveat (écriture manuscrite).
Les illustrations (`src/illustrations/`) sont des créations SVG originales : elles ne représentent aucune personne réelle, ne sont pas des archives et sont toujours légendées « Illustration ».

## Photographies

Les photos du Fort (vue actuelle, porte d’entrée, plaques commémoratives, carte postale ancienne) sont affichées directement depuis
**Wikimedia Commons**, avec un lien vers la page de chaque fichier. Commons n’accepte que des contenus sous licence libre
ou dans le domaine public, mais **l’auteur et la licence exacte de chaque image doivent être vérifiés et recopiés dans `src/data/`**
avant toute diffusion publique. Si une image ne charge pas, un cadre de remplacement s’affiche.

Aucune photo de résistante n’est intégrée : les portraits relèvent des archives (SHD, familles, associations) et nécessitent
une autorisation de diffusion. Les emplacements « pièce » de l’enquête sont prévus pour les recevoir.

## Règles du dossier respectées

- 5 étapes, déverrouillage par QR code ou mode manuel : le GPS n’est jamais obligatoire.
- Questions avec explication systématique, sans score ni blocage définitif.
- Chaque document affiche sa nature (archive, témoignage, reconstitution signalée), son statut et ses métadonnées (source, cote, droits).
- Aucun contenu historique inventé : les questions portent sur la méthode (critique des sources) ; les documents sont des emplacements à remplacer par des archives validées.

## Prochaines étapes

- Remplacer le plan schématique par le plan autorisé du Fort et positionner les points validés.
- Brancher PostgreSQL derrière l’API.
- Back-office éditeur / validateur (codé ou CMS headless, à décider).
- Internationalisation (vue-i18n) si l’extension européenne est retenue.
