# Les Traces de la Mémoire – prototype v0.6

Prototype visiteur de l’enquête pilote, construit avec la pile technique du dossier de conception :

| Couche | Outil |
|---|---|
| Interface | **Vue 3** + **TypeScript** (composants `.vue`, Composition API) |
| Outillage | **Vite** |
| Navigation | **Vue Router** (routes `/enquete/:id/etape/:ordre`, `/e/:etapeId` pour les QR codes) |
| État | **Pinia**, progression et carnet enregistrés dans le navigateur (`localStorage`) |
| Expérience 3D | **Three.js** : tout le site se joue dans une scène 3D unique du Fort au crépuscule. La caméra se déplace à chaque navigation (accueil → vue d’ensemble → étape → fresque) et tourne avec le défilement ; punaises cliquables, fil rouge qui se déroule, rebonds à chaque action. Chargé à la demande, repli 2D automatique sans WebGL, mouvements coupés si « réduire les animations » est activé. |
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

## Disposition du Fort (1944)

La maquette 3D et le plan 2D (`src/three/layout.ts`) suivent le plan schématique d’août 1944 transmis par le
Mémorial national des femmes en résistance et en déportation : 4 bastions, bâtiment des détenus, cour grillagée
séparée en cour des femmes et cour des hommes, casemates de la garnison et des internés, Kommandantur, poste de garde,
miradors, route des camions et des cars. Les proportions sont indicatives et les emplacements des étapes restent à valider.

Les scans fournis par le Mémorial (plan publié dans un ouvrage, photographies de Brassaï prises à la Libération)
**ne sont pas intégrés au dépôt public** : leur diffusion en ligne nécessite l’autorisation des ayants droit.

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
