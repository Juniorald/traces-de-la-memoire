// Disposition du Fort en 1944, partagée par la maquette 3D et le plan 2D.
// Redessinée d'après le plan schématique (août 1944) transmis par le Mémorial national
// des femmes en résistance et en déportation. Proportions indicatives, à valider.
// Coordonnées « plan » : 1000 × 600, y vers le bas.

export type Pt = [number, number]

const TIPS: Pt[] = [[604, 16], [741, 310], [515, 551], [258, 320]] // bastions N, E, S, O
export const CENTER: Pt = [530, 300]

/** Enceinte bastionnée : 4 bastions reliés par des courtines. */
function bastioned(tips: Pt[], shoulder = 0.24, flank = 0.11): Pt[] {
  const out: Pt[] = []
  const n = tips.length
  for (let i = 0; i < n; i++) {
    const T = tips[i], P = tips[(i + n - 1) % n], N = tips[(i + 1) % n]
    const toward = (a: Pt, b: Pt, k: number): Pt => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]
    const sP = toward(T, P, shoulder), sN = toward(T, N, shoulder)
    const fP = toward(sP, CENTER, flank), fN = toward(sN, CENTER, flank)
    out.push(fP, sP, T, sN, fN)
  }
  return out
}

export const OUTER: Pt[] = bastioned(TIPS)
export const INNER: Pt[] = OUTER.map(([x, y]) => [CENTER[0] + (x - CENTER[0]) * 0.8, CENTER[1] + (y - CENTER[1]) * 0.8])

export type Kind = 'detenus' | 'garnison' | 'internes' | 'kommandantur' | 'garde' | 'annexe'
export interface Building { x: number; y: number; w: number; h: number; rot: number; kind: Kind; label?: string; height: number }

export const BUILDINGS: Building[] = [
  { x: 520, y: 192, w: 78, h: 34, rot: -32, kind: 'detenus', label: 'Bâtiment des détenus', height: 0.9 },
  { x: 604, y: 196, w: 108, h: 30, rot: -58, kind: 'garnison', label: 'Casemate de la garnison', height: 0.75 },
  { x: 676, y: 236, w: 86, h: 26, rot: -66, kind: 'internes', label: 'Casemates des internés', height: 0.75 },
  { x: 655, y: 338, w: 92, h: 26, rot: -32, kind: 'internes', height: 0.75 },
  { x: 494, y: 400, w: 44, h: 28, rot: -32, kind: 'kommandantur', label: 'Kommandantur', height: 0.85 },
  { x: 594, y: 312, w: 30, h: 30, rot: -32, kind: 'annexe', height: 0.6 },
]

/** Cour des détenus grillagée, séparée en deux : cour des femmes / cour des hommes. */
export const ENCLOSURE = { x: 548, y: 222, w: 150, h: 104, rot: -32 }
export const COURTS = [
  { x: 572, y: 200, label: 'Cour des femmes' },
  { x: 548, y: 262, label: 'Cour des hommes' },
]

export const MIRADORS: { x: number; y: number; label?: string }[] = [
  { x: 604, y: 92, label: 'Mirador' },
  { x: 418, y: 392, label: 'Poste de garde' },
  { x: 664, y: 258 },
]

/** Route goudronnée des camions et des cars de détenus. */
export const ROUTE: Pt[] = [[436, 252], [446, 205], [496, 152], [565, 128], [640, 150], [674, 190], [680, 238]]
/** Chemin d'accès depuis l'entrée. */
export const PATH: Pt[] = [[515, 520], [505, 470], [478, 420], [470, 360], [496, 300], [512, 268]]

export const SOURCE = 'Disposition d’après le plan schématique d’août 1944 (Mémorial national des femmes en résistance et en déportation) – proportions indicatives'
