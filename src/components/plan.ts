// Plan schématique du Fort (provisoire), dessiné « à l'encre sur papier ».
// À remplacer par le plan autorisé. Coordonnées image 1000 × 600 (Leaflet CRS.Simple).
export const PLAN_W = 1000
export const PLAN_H = 600

const ink = '#3a2640'
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${PLAN_W} ${PLAN_H}">
<defs>
<pattern id="g" width="25" height="25" patternUnits="userSpaceOnUse"><path d="M25 0H0V25" fill="none" stroke="#cdbb9c" stroke-width=".8"/></pattern>
<filter id="n"><feTurbulence type="fractalNoise" baseFrequency=".7" numOctaves="3" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 .35 0 0 0 0 .25 0 0 0 0 .15 0 0 0 .12 0"/></filter>
<pattern id="h" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="10" stroke="${ink}" stroke-width="1.2" opacity=".35"/></pattern>
</defs>
<rect width="100%" height="100%" fill="#ece1cb"/><rect width="100%" height="100%" fill="url(#g)"/>
<polygon points="120,500 70,300 140,90 330,40 640,50 880,120 940,330 860,520 600,560 300,560" fill="url(#h)" stroke="${ink}" stroke-width="5"/>
<polygon points="150,480 108,300 168,118 340,74 628,82 850,145 902,330 830,494 592,528 310,528" fill="#efe5d2" stroke="${ink}" stroke-width="2" stroke-dasharray="10 6"/>
<g fill="none" stroke="${ink}" stroke-width="2.2">
<rect x="330" y="200" width="150" height="70"/><rect x="520" y="200" width="150" height="70"/>
<rect x="400" y="330" width="200" height="60"/><rect x="230" y="310" width="90" height="120"/>
</g>
<g font-family="Courier New,monospace" fill="${ink}">
<text x="24" y="36" font-size="24" font-weight="700" letter-spacing="3">FORT DE ROMAINVILLE</text>
<text x="24" y="58" font-size="14" opacity=".75">plan schématique – non contractuel</text>
</g>
<g transform="translate(920 470)" stroke="${ink}" fill="${ink}"><circle r="34" fill="none" stroke-width="1.5"/><path d="M0 -44 L8 0 L0 8 L-8 0Z"/><path d="M0 44 L8 0 L-8 0Z" fill="none"/><text y="-50" text-anchor="middle" font-family="Courier New,monospace" font-size="16" stroke="none">N</text></g>
<g transform="translate(60 560)" font-family="Courier New,monospace" font-size="14" fill="${ink}"><line x1="0" y1="0" x2="100" y2="0" stroke="${ink}" stroke-width="3"/><line x1="0" y1="-6" x2="0" y2="6" stroke="${ink}" stroke-width="2"/><line x1="100" y1="-6" x2="100" y2="6" stroke="${ink}" stroke-width="2"/><text x="0" y="-12">échelle indicative</text></g>
<rect width="100%" height="100%" filter="url(#n)"/>
</svg>`

export const PLAN_URL = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)
