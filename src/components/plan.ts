// Plan 2D du Fort en 1944, « à l'encre sur papier », généré depuis la même disposition que la maquette 3D.
import { BUILDINGS, COURTS, ENCLOSURE, INNER, MIRADORS, OUTER, PATH, ROUTE, type Pt } from '../three/layout'

export const PLAN_W = 1000
export const PLAN_H = 600

const ink = '#3a2640'
const poly = (pts: Pt[]) => pts.map((p) => p.join(',')).join(' ')
const line = (pts: Pt[]) => 'M' + pts.map((p) => p.join(' ')).join(' L')
const esc = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;')

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${PLAN_W} ${PLAN_H}">
<defs>
<pattern id="g" width="25" height="25" patternUnits="userSpaceOnUse"><path d="M25 0H0V25" fill="none" stroke="#cdbb9c" stroke-width=".8"/></pattern>
<pattern id="h" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="9" stroke="${ink}" stroke-width="1.1" opacity=".35"/></pattern>
<filter id="n"><feTurbulence type="fractalNoise" baseFrequency=".7" numOctaves="3" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 .35 0 0 0 0 .25 0 0 0 0 .15 0 0 0 .12 0"/></filter>
</defs>
<rect width="100%" height="100%" fill="#ece1cb"/><rect width="100%" height="100%" fill="url(#g)"/>
<polygon points="${poly(OUTER)}" fill="url(#h)" stroke="${ink}" stroke-width="4"/>
<polygon points="${poly(INNER)}" fill="#efe5d2" stroke="${ink}" stroke-width="1.5" stroke-dasharray="8 5"/>
<path d="${line(PATH)}" fill="none" stroke="#bfb29b" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/>
<path d="${line(ROUTE)}" fill="none" stroke="#2f5560" stroke-width="5" stroke-dasharray="14 8" stroke-linecap="round"/>
<g transform="translate(${ENCLOSURE.x} ${ENCLOSURE.y}) rotate(${ENCLOSURE.rot})">
  <rect x="${-ENCLOSURE.w / 2}" y="${-ENCLOSURE.h / 2}" width="${ENCLOSURE.w}" height="${ENCLOSURE.h}" fill="none" stroke="#b0303a" stroke-width="2" stroke-dasharray="6 4"/>
  <line x1="${-ENCLOSURE.w / 2}" y1="0" x2="${ENCLOSURE.w / 2}" y2="0" stroke="#b0303a" stroke-width="2" stroke-dasharray="6 4"/>
</g>
${BUILDINGS.map((b) => `<rect x="${-b.w / 2}" y="${-b.h / 2}" width="${b.w}" height="${b.h}" transform="translate(${b.x} ${b.y}) rotate(${b.rot})" fill="#f7efe0" stroke="${ink}" stroke-width="2.2"/>`).join('')}
${MIRADORS.map((m) => `<g transform="translate(${m.x} ${m.y})"><rect x="-10" y="-10" width="20" height="20" fill="none" stroke="${ink}" stroke-width="2"/><path d="M-10 -10 L10 10 M10 -10 L-10 10" stroke="${ink}" stroke-width="1.5"/></g>`).join('')}
<g font-family="Courier New,monospace" font-size="15" fill="${ink}">
${BUILDINGS.filter((b) => b.label).map((b) => `<text x="${b.x + 14}" y="${b.y - 22}">${esc(b.label!)}</text>`).join('')}
${COURTS.map((c) => `<text x="${c.x}" y="${c.y}" text-anchor="middle" fill="#8e1d26" font-size="14">${esc(c.label)}</text>`).join('')}
${MIRADORS.filter((m) => m.label).map((m) => `<text x="${m.x - 14}" y="${m.y + 30}" text-anchor="end">${esc(m.label!)}</text>`).join('')}
<text x="${ROUTE[0][0] - 12}" y="${ROUTE[0][1] + 6}" text-anchor="end" fill="#2f5560">route des camions et des cars</text>
</g>
<g font-family="Courier New,monospace" fill="${ink}">
<text x="24" y="36" font-size="24" font-weight="700" letter-spacing="3">FORT DE ROMAINVILLE, 1944</text>
<text x="24" y="58" font-size="14" opacity=".75">d’après le plan schématique d’août 1944 – proportions indicatives</text>
</g>
<rect width="100%" height="100%" filter="url(#n)"/>
</svg>`

export const PLAN_URL = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)
