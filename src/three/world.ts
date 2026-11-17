// Construction du décor 3D du Fort (1944), d'après la disposition de layout.ts.
import * as THREE from 'three'
import { BUILDINGS, CENTER, COURTS, ENCLOSURE, INNER, MIRADORS, OUTER, PATH, ROUTE, type Kind, type Pt } from './layout'

export const S = 40 // 40 px de plan = 1 unité 3D
export const toV = (x: number, y: number, h = 0) => new THREE.Vector3((x - CENTER[0]) / S, h, (y - CENTER[1]) / S)

export const C = {
  ground: '#cdb994', moat: '#8d7b5b', wallSide: '#b39874', wallTop: '#7f8a5e',
  court: '#d8c7a2', roof: '#6d4f5c', tree: '#4d5a3a', red: '#c8232c', plum: '#7a2860', locked: '#8a7a8d',
}

function shapeFrom(points: Pt[], scale = 1) {
  const [cx, cy] = CENTER
  const s = new THREE.Shape()
  points.forEach(([x, y], i) => {
    const px = ((x - cx) * scale) / S
    const py = ((y - cy) * scale) / S
    i ? s.lineTo(px, py) : s.moveTo(px, py)
  })
  s.closePath()
  return s
}

export function buildWorld(scene: THREE.Scene, addLabel: (text: string, at: THREE.Vector3, hand?: boolean) => void) {
    const hemi = new THREE.HemisphereLight('#f6dcc4', '#3a2640', 1.25); scene.add(hemi)
    const sun = new THREE.DirectionalLight('#ffc996', 2.4)
    sun.position.set(-14, 9, 8); sun.castShadow = true
    sun.shadow.mapSize.set(2048, 2048)
    Object.assign(sun.shadow.camera, { left: -16, right: 16, top: 16, bottom: -16, near: 1, far: 50 })
    sun.shadow.bias = -0.0008
    scene.add(sun)

    const ground = new THREE.Mesh(new THREE.CircleGeometry(80, 64), new THREE.MeshStandardMaterial({ color: C.ground, roughness: 1 }))
    ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground)

    // Fossé (anneau légèrement plus sombre autour de l'enceinte)
    const moatShape = shapeFrom(OUTER, 1.13); moatShape.holes.push(shapeFrom(OUTER, 1.0))
    const moat = new THREE.Mesh(new THREE.ShapeGeometry(moatShape), new THREE.MeshStandardMaterial({ color: C.moat, roughness: 1, side: THREE.DoubleSide }))
    moat.rotation.x = Math.PI / 2; moat.position.y = 0.01; moat.receiveShadow = true; scene.add(moat)

    // Enceinte bastionnée : forme extérieure moins la cour intérieure, extrudée
    const wallShape = shapeFrom(OUTER); wallShape.holes.push(shapeFrom(INNER))
    const wallGeo = new THREE.ExtrudeGeometry(wallShape, { depth: 1.1, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.08, bevelSegments: 1 })
    const walls = new THREE.Mesh(wallGeo, [
      new THREE.MeshStandardMaterial({ color: C.wallTop, roughness: 0.95, flatShading: true }),
      new THREE.MeshStandardMaterial({ color: C.wallSide, roughness: 0.9, flatShading: true }),
    ])
    walls.rotation.x = Math.PI / 2; walls.position.y = 1.1
    walls.castShadow = true; walls.receiveShadow = true
    scene.add(walls)

    const courtShape = shapeFrom(INNER)
    const court = new THREE.Mesh(new THREE.ShapeGeometry(courtShape), new THREE.MeshStandardMaterial({ color: C.court, roughness: 1, side: THREE.DoubleSide }))
    court.rotation.x = Math.PI / 2; court.position.y = 0.02; court.receiveShadow = true; scene.add(court)

    // Porte d'entrée : au milieu de la courtine entre les bastions sud et ouest
    const [g1, g2] = [OUTER[14], OUTER[15]]
    const gate = new THREE.Mesh(new THREE.BoxGeometry(1, 0.9, 0.6), new THREE.MeshStandardMaterial({ color: '#2b1b30' }))
    gate.position.copy(toV((g1[0] + g2[0]) / 2, (g1[1] + g2[1]) / 2, 0.45))
    gate.rotation.y = -Math.atan2(g2[1] - g1[1], g2[0] - g1[0])
    scene.add(gate)
    const gatePos = gate.position.clone()
    const gateDir = gate.position.clone().setY(0).normalize() // vers l'extérieur du Fort

    // Bâtiments de 1944 (d'après le plan schématique)
    const colors: Record<Kind, string> = { detenus: '#e9dcc2', garnison: '#cdbb9a', internes: '#bfae8f', kommandantur: '#ddd0b6', garde: '#d6c8ad', annexe: '#d8cab0' }
    const rMat = new THREE.MeshStandardMaterial({ color: C.roof, roughness: 0.8, flatShading: true })
    for (const b of BUILDINGS) {
      const bw = b.w / S, bd = b.h / S
      const g = new THREE.Group()
      const body = new THREE.Mesh(new THREE.BoxGeometry(bw, b.height, bd), new THREE.MeshStandardMaterial({ color: colors[b.kind], roughness: 0.9, flatShading: true }))
      body.position.y = b.height / 2; body.castShadow = body.receiveShadow = true
      g.add(body)
      if (b.kind === 'internes' || b.kind === 'garnison') {
        // casemates : voûte en berceau, à demi enterrées dans le rempart
        const vault = new THREE.Mesh(new THREE.CylinderGeometry(bd / 2, bd / 2, bw, 16, 1, false, 0, Math.PI), new THREE.MeshStandardMaterial({ color: C.wallTop, roughness: 1, flatShading: true }))
        vault.rotation.z = Math.PI / 2; vault.rotation.x = Math.PI / 2; vault.position.y = b.height; vault.castShadow = true
        g.add(vault)
      } else {
        const roof = new THREE.Mesh(new THREE.CylinderGeometry(0.01, bd * 0.72, 0.42, 4, 1), rMat)
        roof.rotation.y = Math.PI / 4; roof.scale.set(bw / bd, 1, 1); roof.position.y = b.height + 0.21; roof.castShadow = true
        g.add(roof)
      }
      g.position.copy(toV(b.x, b.y)); g.rotation.y = -THREE.MathUtils.degToRad(b.rot)
      scene.add(g)
      if (b.label) addLabel(b.label, toV(b.x, b.y, b.height + 0.9))
    }

    // Cour des détenus grillagée, coupée en deux (femmes / hommes)
    {
      const e = ENCLOSURE, w = e.w / S, d = e.h / S, hgt = 0.55
      const g = new THREE.Group()
      const fenceMat = new THREE.MeshBasicMaterial({ color: '#3a2a2a', transparent: true, opacity: 0.55, side: THREE.DoubleSide, wireframe: true })
      const side = (len: number) => new THREE.Mesh(new THREE.PlaneGeometry(len, hgt, Math.round(len * 6), 3), fenceMat)
      const n = side(w); n.position.set(0, hgt / 2, -d / 2)
      const so = side(w); so.position.set(0, hgt / 2, d / 2)
      const ea = side(d); ea.rotation.y = Math.PI / 2; ea.position.set(w / 2, hgt / 2, 0)
      const we = side(d); we.rotation.y = Math.PI / 2; we.position.set(-w / 2, hgt / 2, 0)
      const mid = side(w); mid.position.set(0, hgt / 2, 0)
      const floor = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshStandardMaterial({ color: '#c9b48c', roughness: 1 }))
      floor.rotation.x = -Math.PI / 2; floor.position.y = 0.03; floor.receiveShadow = true
      g.add(floor, n, so, ea, we, mid)
      g.position.copy(toV(e.x, e.y)); g.rotation.y = -THREE.MathUtils.degToRad(e.rot)
      scene.add(g)
      for (const c of COURTS) addLabel(c.label, toV(c.x, c.y, 0.9), true)
    }

    // Miradors : tours de guet en bois
    const wood = new THREE.MeshStandardMaterial({ color: '#5b4330', roughness: 1, flatShading: true })
    for (const m of MIRADORS) {
      const t = new THREE.Group()
      for (const [dx, dz] of [[-0.22, -0.22], [0.22, -0.22], [-0.22, 0.22], [0.22, 0.22]]) {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.06, 2.1, 0.06), wood); leg.position.set(dx, 1.05, dz); leg.castShadow = true; t.add(leg)
      }
      const cab = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.45, 0.7), wood); cab.position.y = 2.3; cab.castShadow = true
      const roof = new THREE.Mesh(new THREE.ConeGeometry(0.62, 0.38, 4), new THREE.MeshStandardMaterial({ color: '#3b2a22', flatShading: true }))
      roof.position.y = 2.72; roof.rotation.y = Math.PI / 4
      t.add(cab, roof); t.position.copy(toV(m.x, m.y)); scene.add(t)
      if (m.label) addLabel(m.label, toV(m.x, m.y, 3.3))
    }

    // Route goudronnée (camions et cars de détenus) et chemin d'accès
    const ribbon = (pts: Pt[], width: number, color: string, y: number) => {
      const curve = new THREE.CatmullRomCurve3(pts.map(([x, z]) => toV(x, z, y)))
      const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 80, width, 4, false), new THREE.MeshStandardMaterial({ color, roughness: 1 }))
      tube.scale.y = 0.15; tube.receiveShadow = true
      scene.add(tube)
    }
    ribbon(ROUTE, 0.32, '#4a4248', 0.05)
    ribbon(PATH, 0.22, '#e3d4b6', 0.05)

    // Arbres autour du fort (InstancedMesh pour rester léger sur mobile)
    const rnd = (s: number) => { const x = Math.sin(s * 12.9898) * 43758.5453; return x - Math.floor(x) }
    const treeGeo = new THREE.IcosahedronGeometry(0.55, 0)
    const trees = new THREE.InstancedMesh(treeGeo, new THREE.MeshStandardMaterial({ color: C.tree, flatShading: true, roughness: 1 }), 90)
    const m = new THREE.Matrix4(); const q = new THREE.Quaternion(); const sc = new THREE.Vector3(); const p = new THREE.Vector3()
    for (let i = 0; i < 90; i++) {
      const a = rnd(i + 1) * Math.PI * 2, r = 13.5 + rnd(i + 7) * 9
      const s = 0.7 + rnd(i + 3) * 0.9
      p.set(Math.cos(a) * r * 1.25, 0.45 * s, Math.sin(a) * r * 0.8); sc.set(s, s * (1.1 + rnd(i) * 0.5), s)
      q.setFromEuler(new THREE.Euler(0, rnd(i + 9) * 3, 0))
      trees.setMatrixAt(i, m.compose(p, q, sc))
    }
    trees.castShadow = true; scene.add(trees)
  return { hemi, sun, gatePos, gateDir }
}
