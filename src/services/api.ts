import type { Enquete, Etape } from '../types'
import pilote from '../data/enquete-pilote.json'

/**
 * Accès aux données. Si VITE_API_URL est défini, on interroge l'API Express
 * (routes du dossier : GET /api/enquetes/:id, GET /api/etapes/:id).
 * Sinon, on lit le JSON local : même forme que la réponse de l'API.
 */
const API = import.meta.env.VITE_API_URL

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API}${path}`)
  if (!res.ok) throw new Error(`Erreur API ${res.status} sur ${path}`)
  return res.json() as Promise<T>
}

export async function fetchEnquete(id: number): Promise<Enquete> {
  if (API) return get<Enquete>(`/api/enquetes/${id}`)
  return pilote as Enquete
}

export async function fetchEtape(id: number): Promise<{ enqueteId: number; etape: Etape } | null> {
  if (API) return get(`/api/etapes/${id}`)
  const etape = (pilote as Enquete).etapes.find((e) => e.id === id)
  return etape ? { enqueteId: pilote.id, etape } : null
}
