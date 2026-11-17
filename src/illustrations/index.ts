// Illustrations originales (SVG) du prototype.
// Ce sont des créations graphiques d'ambiance : elles ne représentent aucune
// personne réelle et ne sont pas des archives. Elles sont toujours légendées comme telles.

const P = { paper: '#EFE5D3', paper2: '#E4D6BE', ink: '#2B1B30', plum: '#7A2860', red: '#C8232C', ochre: '#C9A46A', stone: '#8E7461' }

let n = 0
const uid = () => `i${++n}`

const grain = (id: string, o = 0.12) => `
<filter id="${id}g" x="0" y="0" width="100%" height="100%">
  <feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" stitchTiles="stitch"/>
  <feColorMatrix values="0 0 0 0 .17  0 0 0 0 .1  0 0 0 0 .18  0 0 0 ${o} 0"/>
</filter>`
const grainRect = (id: string) => `<rect width="400" height="250" filter="url(#${id}g)"/>`
const wrap = (id: string, label: string, body: string, defs = '') =>
  `<svg viewBox="0 0 400 250" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${label}" preserveAspectRatio="xMidYMid slice"><defs>${grain(id)}${defs}</defs>${body}${grainRect(id)}</svg>`

function hand(x: number, y: number, w: number, rows: number, gap = 13, color = '#3A2E5A') {
  let d = ''
  for (let r = 0; r < rows; r++) {
    const yy = y + r * gap
    const ww = r === rows - 1 ? w * 0.55 : w * (0.85 + ((r * 37) % 15) / 100)
    let path = `M${x} ${yy}`
    for (let k = 0; k < ww; k += 8) path += ` q 2 ${k % 16 ? -3 : 3} 4 0 t 4 0`
    d += `<path d="${path}" fill="none" stroke="${color}" stroke-width="1.3" stroke-linecap="round" opacity=".8"/>`
  }
  return d
}

function pin(x: number, y: number, r = 5.5) {
  return `<circle cx="${x}" cy="${y + 2}" r="${r}" fill="#000" opacity=".18"/><circle cx="${x}" cy="${y}" r="${r}" fill="${P.red}"/><circle cx="${x - r / 3}" cy="${y - r / 3}" r="${r / 3}" fill="#fff" opacity=".7"/>`
}

export function heroFort() {
  const id = uid()
  const pts: [number, number][] = [[58, 74], [126, 42], [204, 66], [276, 34], [344, 88]]
  return wrap(id, 'Illustration : le Fort et le fil rouge de l’enquête', `
<rect width="400" height="250" fill="url(#${id}sky)"/>
<circle cx="322" cy="150" r="30" fill="#E2B98E" opacity=".55"/>
<path d="M0 176 Q 80 156 160 170 T 400 162 V250 H0Z" fill="#D6C4A4"/>
<g fill="#4F4636"><circle cx="22" cy="176" r="18"/><circle cx="44" cy="170" r="22"/><circle cx="370" cy="172" r="20"/><circle cx="392" cy="178" r="16"/></g>
<polygon points="40,206 72,152 150,142 168,126 232,126 250,142 328,152 360,206" fill="#3A2640"/>
<polyline points="72,152 150,142 168,126 232,126 250,142 328,152" fill="none" stroke="#5B4262" stroke-width="3"/>
<g stroke="#4C3453" stroke-width="1.2">${[160, 172, 184, 196].map((y) => `<line x1="${60 + (206 - y) * 0.4}" y1="${y}" x2="${340 - (206 - y) * 0.4}" y2="${y}"/>`).join('')}</g>
<path d="M184 206 V168 A16 16 0 0 1 216 168 V206Z" fill="#1E1222"/>
<rect x="0" y="204" width="400" height="46" fill="#C7B38F"/>
<g stroke="#9E8B66" stroke-width="1.2" stroke-linecap="round">${Array.from({ length: 26 }, (_, i) => `<line x1="${i * 16 + 6}" y1="${214 + (i % 3) * 9}" x2="${i * 16 + 9}" y2="${208 + (i % 3) * 9}"/>`).join('')}</g>
<polyline points="${pts.map((p) => p.join(',')).join(' ')}" fill="none" stroke="${P.red}" stroke-width="2"/>
${pts.map(([x, y]) => pin(x, y)).join('')}`,
    `<linearGradient id="${id}sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E9DDC8"/><stop offset="1" stop-color="#F2E8D6"/></linearGradient>`)
}

export function indice() {
  const id = uid()
  return wrap(id, 'Illustration : une lettre examinée à la loupe', `
<rect width="400" height="250" fill="${P.paper2}"/>
<g transform="rotate(-9 150 130)"><rect x="56" y="74" width="196" height="122" rx="3" fill="#D5BC94" stroke="#B0956C"/>
<path d="M56 74 L154 140 L252 74" fill="none" stroke="#B0956C" stroke-width="1.5"/></g>
<g transform="rotate(5 230 120)"><rect x="150" y="34" width="168" height="178" fill="#F7F0E3" stroke="#D9CCB4"/>
${hand(166, 64, 130, 9)}<path d="M240 196 c 10 -14 20 8 30 -6 s 14 6 22 -2" fill="none" stroke="#3A2E5A" stroke-width="1.6"/></g>
<g transform="rotate(-12 92 196)" opacity=".85"><circle cx="92" cy="196" r="28" fill="none" stroke="${P.plum}" stroke-width="2.4"/><circle cx="92" cy="196" r="21" fill="none" stroke="${P.plum}" stroke-width="1"/>
<text x="92" y="200" text-anchor="middle" font-family="Courier New,monospace" font-size="10" font-weight="700" fill="${P.plum}">ARCHIVE</text></g>
<circle cx="246" cy="118" r="40" fill="#fff" opacity=".28"/>
<circle cx="246" cy="118" r="40" fill="none" stroke="${P.ink}" stroke-width="7"/>
<path d="M232 98 a 22 22 0 0 1 22 -6" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".8"/>
<line x1="276" y1="148" x2="322" y2="196" stroke="#5A3A2A" stroke-width="13" stroke-linecap="round"/>`)
}

export function avant() {
  const id = uid()
  const bld = [[0, 120, 54], [50, 96, 46], [92, 132, 40], [128, 84, 58], [182, 116, 44], [222, 100, 50], [268, 138, 36], [300, 92, 56], [352, 124, 48]]
  let win = ''
  bld.forEach(([x, y, w], i) => {
    for (let r = y + 12; r < 214; r += 18) for (let c = x + 8; c < x + w - 8; c += 13) {
      const lit = (r * 7 + c * 3 + i) % 5 === 0
      win += `<rect x="${c}" y="${r}" width="6" height="9" fill="${lit ? '#F2C46D' : '#3A2843'}"/>`
    }
  })
  return wrap(id, 'Illustration : une rue au crépuscule', `
<rect width="400" height="250" fill="url(#${id}sky)"/>
<circle cx="334" cy="46" r="13" fill="#F3E3C0"/>
${bld.map(([x, y, w]) => `<rect x="${x}" y="${y}" width="${w}" height="${220 - y}" fill="#2A1A2E"/>`).join('')}
${win}
<rect x="0" y="214" width="400" height="36" fill="#1E1322"/>
<circle cx="96" cy="128" r="42" fill="url(#${id}glow)"/>
<line x1="96" y1="214" x2="96" y2="130" stroke="#120A14" stroke-width="4"/>
<path d="M86 130 h20 l-4 -12 h-12z" fill="#120A14"/><rect x="91" y="129" width="10" height="5" fill="#F7D58A"/>
<g fill="#120A14"><circle cx="236" cy="174" r="6"/><path d="M228 182 h16 l5 32 h-26z"/><rect x="230" y="212" width="4" height="4"/><rect x="239" y="212" width="4" height="4"/></g>`,
    `<linearGradient id="${id}sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#352645"/><stop offset=".65" stop-color="#9C5E62"/><stop offset="1" stop-color="#D49A6E"/></linearGradient>
<radialGradient id="${id}glow"><stop offset="0" stop-color="#F7D58A" stop-opacity=".7"/><stop offset="1" stop-color="#F7D58A" stop-opacity="0"/></radialGradient>`)
}

export function engagement() {
  const id = uid()
  const tract = (x: number, y: number, r: number) => `<g transform="rotate(${r} ${x + 45} ${y + 55})"><rect x="${x}" y="${y}" width="90" height="112" fill="#F7F1E4" stroke="#D8CBB2"/><rect x="${x + 10}" y="${y + 12}" width="56" height="9" fill="${P.ink}" opacity=".85"/>${hand(x + 10, y + 36, 64, 5, 12, '#4A4060')}</g>`
  return wrap(id, 'Illustration : des tracts et une machine à écrire', `
<rect width="400" height="250" fill="#E8DDC8"/>
${tract(18, 22, -12)}${tract(290, 18, 10)}${tract(300, 120, -6)}${tract(26, 128, 7)}
<rect x="150" y="34" width="104" height="96" fill="#FBF6EC" stroke="#D8CBB2"/>${hand(162, 52, 80, 5, 13)}
<rect x="128" y="120" width="148" height="20" rx="10" fill="#3A2640"/>
<path d="M112 238 L132 140 H272 L292 238Z" fill="${P.ink}"/>
<g fill="#E8DDC8">${[0, 1, 2, 3].map((r) => Array.from({ length: 9 - r }, (_, c) => `<circle cx="${148 + r * 6 + c * 14}" cy="${160 + r * 18}" r="5"/>`).join('')).join('')}</g>
<rect x="160" y="228" width="84" height="6" rx="3" fill="#E8DDC8"/>
<path d="M120 128 h-18 v-10" fill="none" stroke="${P.ink}" stroke-width="5" stroke-linecap="round"/>`)
}

export function fort() {
  const id = uid()
  let bricks = ''
  for (let y = 58; y < 206; y += 12) for (let x = (y / 12) % 2 ? -14 : 0; x < 400; x += 28) bricks += `<rect x="${x}" y="${y}" width="27" height="11" fill="${(x * 3 + y) % 7 === 0 ? '#9B806B' : '#8E7461'}"/>`
  return wrap(id, 'Illustration : la porte d’un fort', `
<rect width="400" height="250" fill="#E3D8C6"/>
<rect x="0" y="56" width="400" height="152" fill="#7C6352"/>${bricks}
<rect x="0" y="44" width="400" height="14" fill="#6A5243"/>
<path d="M150 208 V120 A50 50 0 0 1 250 120 V208Z" fill="#B49B83"/>
<path d="M160 208 V122 A40 40 0 0 1 240 122 V208Z" fill="#3A2640"/>
<g stroke="#2A1A2E" stroke-width="2">${[176, 192, 208, 224].map((x) => `<line x1="${x}" y1="${x === 176 || x === 224 ? 104 : 90}" x2="${x}" y2="208"/>`).join('')}<line x1="200" y1="82" x2="200" y2="208" stroke-width="3"/></g>
<rect x="166" y="34" width="68" height="18" fill="#D8CBB4" stroke="#A8957C"/>
<g stroke="#8A7A66" stroke-width="1.4"><line x1="174" y1="41" x2="226" y2="41"/><line x1="182" y1="46" x2="218" y2="46"/></g>
<rect x="300" y="110" width="44" height="30" fill="#C9BDA6" stroke="#8C7B67"/><g stroke="#7A6A58"><line x1="308" y1="120" x2="336" y2="120"/><line x1="308" y1="127" x2="330" y2="127"/></g>
<rect x="0" y="206" width="400" height="44" fill="#9DA27A"/>
<g stroke="#7C8358" stroke-width="1.3" stroke-linecap="round">${Array.from({ length: 30 }, (_, i) => `<line x1="${i * 14}" y1="${222 + (i % 3) * 8}" x2="${i * 14 + 3}" y2="${214 + (i % 3) * 8}"/>`).join('')}</g>`)
}

export function liens() {
  const id = uid()
  const nodes: [number, number][] = [[64, 64], [200, 44], [336, 62], [64, 190], [336, 188]]
  const portrait = (x: number, y: number, main = false) => `
<g transform="rotate(${main ? 0 : ((x + y) % 9) - 4} ${x} ${y})">
<rect x="${x - 30}" y="${y - 36}" width="60" height="72" fill="#FBF6EC" stroke="${main ? P.plum : '#D2C3A8'}" stroke-width="${main ? 3 : 1}"/>
<rect x="${x - 23}" y="${y - 29}" width="46" height="46" fill="${main ? '#E7D3E0' : '#E6DAC5'}"/>
<circle cx="${x}" cy="${y - 12}" r="9" fill="${main ? P.plum : '#B3A189'}"/><path d="M${x - 17} ${y + 17} q 17 -26 34 0z" fill="${main ? P.plum : '#B3A189'}"/>
<line x1="${x - 18}" y1="${y + 27}" x2="${x + 18}" y2="${y + 27}" stroke="#9C8B74" stroke-width="1.5"/></g>`
  return wrap(id, 'Illustration : des parcours reliés par un fil rouge', `
<rect width="400" height="250" fill="#E9DFCB"/>
${nodes.map(([x, y]) => `<line x1="200" y1="140" x2="${x}" y2="${y - 34}" stroke="${P.red}" stroke-width="1.8"/>`).join('')}
${nodes.map(([x, y]) => portrait(x, y)).join('')}
${portrait(200, 150, true)}
${nodes.map(([x, y]) => pin(x, y - 34, 4.5)).join('')}${pin(200, 116)}`)
}

export const illustrations: Record<string, () => string> = { heroFort, indice, avant, engagement, fort, liens }
