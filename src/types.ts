// Types alignés sur le modèle de classes du dossier (v1.1).
export type StatutPublication = 'brouillon' | 'a_valider' | 'publie' | 'retire'
export type NatureDocument = 'archive' | 'temoignage' | 'reconstitution'

export interface Archive {
  id: number
  titre: string
  type: string
  nature: NatureDocument
  source: string | null
  cote: string | null
  droits: string | null
  statut: StatutPublication
  /** Image du document (chemin relatif dans public/), si disponible. */
  src?: string
  auteur?: string
  date?: string
  legende?: string
}

export interface Lieu {
  id: number
  nom: string
  description: string
  /** Coordonnées sur le plan interne (Leaflet CRS.Simple), pas de GPS. */
  plan: { x: number; y: number }
  accessible: boolean
  site: string
}

export interface Indice { id: number; ordre: number; consigne: string; archive: Archive | null }

export interface OptionReponse { id: string; texte: string; correcte: boolean }

export interface Question { id: number; libelle: string; options: OptionReponse[]; explication: string }

/** Photographie du lieu (photo actuelle ou carte postale ancienne), avec crédit obligatoire. */
export interface Photo {
  fichier: string
  legende: string
  nature: 'photo_actuelle' | 'carte_postale' | 'plaque'
  credit: string
}

export interface Etape {
  id: number
  ordre: number
  titre: string
  consigne: string
  lieu: Lieu | null
  indices: Indice[]
  question: Question
  /** Illustration d'ambiance (création graphique, jamais présentée comme une archive). */
  illustration?: string
  photos?: Photo[]
  /** Documents d'archives présentés sur le lieu (cadres dans la maquette 3D). */
  documents?: Archive[]
}

export interface Enquete {
  id: number
  titre: string
  questionCentrale: string
  statut: StatutPublication
  resistante: { id: number; nom: string; statutPublication: StatutPublication }
  etapes: Etape[]
}
