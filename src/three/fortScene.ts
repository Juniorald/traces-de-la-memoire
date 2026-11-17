// Maquette 3D schématique du Fort (Three.js).
// Même repère que le plan 2D : coordonnées « plan » 1000 × 600 converties en mètres-scène.
// Volumes indicatifs, non contractuels : à remplacer par un relevé validé.
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { BUILDINGS, CENTER, COURTS, ENCLOSURE, INNER, MIRADORS, OUTER, PATH, ROUTE, type Kind, type Pt } from './layout'

export interface PinData { ordre: number; titre: string; x: number; y: number; state: 'done' | 'current' | 'locked'; reachable: boolean }
export type View =
  | { kind: 'hero' }
  | { kind: 'overview' }
  | { kind: 'focus'; x: number; y: number; ordre: number }
  | { kind: 'sky' }
  | { kind: 'gate' }
export interface FrameDoc { id: number; url: string; titre: string }
export interface FrameSet { ordre: number; x: number; y: number; docs: FrameDoc[] }
export interface SceneOptions { onSelect?: (ordre: number) => void; onPhoto?: (id: number) => void; reducedMotion?: boolean }

const S = 40 // 40 px de plan = 1 unité 3D
const toV = (x: number, y: number, h = 0) => new THREE.Vector3((x - CENTER[0]) / S, h, (y - CENTER[1]) / S)


const C = {
  sky: '#2a1d36', horizon: '#c98a6b', ground: '#cdb994', moat: '#8d7b5b', wallSide: '#b39874', wallTop: '#7f8a5e',
  court: '#d8c7a2', building: '#e6d8bd', roof: '#6d4f5c', tree: '#4d5a3a', red: '#c8232c', plum: '#7a2860', locked: '#8a7a8d',
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

function skyTexture() {
  const c = document.createElement('canvas'); c.width = 4; c.height = 256
  const g = c.getContext('2d')!
  const grad = g.createLinearGradient(0, 0, 0, 256)
  grad.addColorStop(0, C.sky); grad.addColorStop(0.55, '#6b3f55'); grad.addColorStop(0.85, C.horizon); grad.addColorStop(1, '#e9c39a')
  g.fillStyle = grad; g.fillRect(0, 0, 4, 256)
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace
  return t
}

function numberSprite(n: number) {
  const c = document.createElement('canvas'); c.width = c.height = 128
  const g = c.getContext('2d')!
  g.fillStyle = '#fbf7ef'; g.beginPath(); g.arc(64, 64, 54, 0, Math.PI * 2); g.fill()
  g.strokeStyle = '#2b1b30'; g.lineWidth = 6; g.stroke()
  g.fillStyle = '#2b1b30'; g.font = '700 64px Inter, system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'
  g.fillText(String(n), 64, 70)
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthTest: false, transparent: true }))
  s.scale.set(0.62, 0.62, 1); s.renderOrder = 10
  return s
}

export class FortScene {
  private renderer: THREE.WebGLRenderer
  private scene = new THREE.Scene()
  private camera: THREE.PerspectiveCamera
  private controls: OrbitControls
  private pinGroup = new THREE.Group()
  private threadMesh: THREE.Mesh | null = null
  private threadProgress = 1
  private pulse: THREE.Mesh
  private heads: { mesh: THREE.Mesh; ordre: number; reachable: boolean }[] = []
  private ray = new THREE.Raycaster()
  private pointer = new THREE.Vector2()
  private clock = new THREE.Clock()
  private raf = 0
  private visible = true
  private base = { pos: new THREE.Vector3(19, 5.2, 17), target: new THREE.Vector3(0, 1.6, 0) }
  private view: View = { kind: 'hero' }
  private shift = 0.12
  private shiftGoal = 0.12
  private scrollAz = 0
  private userOverride = false
  private arrived = false
  private pingT = new Map<number, number>()
  private lastThread = 0
  /** Sur un écran en portrait, on recule la caméra et on élargit l'angle pour garder tout le Fort visible. */
  private distScale = 1
  private ro: ResizeObserver
  private io: IntersectionObserver
  private down = { x: 0, y: 0 }

  constructor(private host: HTMLElement, private opts: SceneOptions) {
    this.view = { kind: "hero" }
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.05
    host.appendChild(this.renderer.domElement)

    this.camera = new THREE.PerspectiveCamera(38, 1, 0.1, 200)
    this.camera.position.set(30, 14, 30) // arrivée en survol

    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.enableDamping = true
    this.controls.enablePan = false
    this.controls.enableZoom = false // la molette et le geste vertical servent à faire défiler le site
    this.controls.maxPolarAngle = 1.36
    this.controls.target.set(0, 1.6, 0)
    this.controls.autoRotateSpeed = 0.45
    this.controls.addEventListener('start', () => { this.userOverride = true; this.controls.autoRotate = false })

    this.scene.background = skyTexture()
    this.scene.fog = new THREE.Fog('#b98471', 26, 70)

    this.buildWorld()
    this.scene.add(this.pinGroup)

    this.pulse = new THREE.Mesh(new THREE.RingGeometry(0.45, 0.62, 48), new THREE.MeshBasicMaterial({ color: C.red, transparent: true, opacity: 0.8, side: THREE.DoubleSide }))
    this.pulse.rotation.x = -Math.PI / 2; this.pulse.visible = false
    this.scene.add(this.pulse)

    const el = this.renderer.domElement
    el.addEventListener('pointerdown', (e) => { this.down = { x: e.clientX, y: e.clientY } })
    el.addEventListener('pointerup', this.onUp)
    el.addEventListener('pointermove', this.onMove)

    this.ro = new ResizeObserver(() => this.resize()); this.ro.observe(host)
    this.io = new IntersectionObserver(([e]) => { this.visible = e.isIntersecting }); this.io.observe(host)
    this.resize()
    this.loop()
  }

  private buildWorld() {
    const hemi = new THREE.HemisphereLight('#f6dcc4', '#3a2640', 1.25); this.scene.add(hemi)
    const sun = new THREE.DirectionalLight('#ffc996', 2.4)
    sun.position.set(-14, 9, 8); sun.castShadow = true
    sun.shadow.mapSize.set(2048, 2048)
    Object.assign(sun.shadow.camera, { left: -16, right: 16, top: 16, bottom: -16, near: 1, far: 50 })
    sun.shadow.bias = -0.0008
    this.scene.add(sun)

    const ground = new THREE.Mesh(new THREE.CircleGeometry(80, 64), new THREE.MeshStandardMaterial({ color: C.ground, roughness: 1 }))
    ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; this.scene.add(ground)

    // Fossé (anneau légèrement plus sombre autour de l'enceinte)
    const moatShape = shapeFrom(OUTER, 1.13); moatShape.holes.push(shapeFrom(OUTER, 1.0))
    const moat = new THREE.Mesh(new THREE.ShapeGeometry(moatShape), new THREE.MeshStandardMaterial({ color: C.moat, roughness: 1, side: THREE.DoubleSide }))
    moat.rotation.x = Math.PI / 2; moat.position.y = 0.01; moat.receiveShadow = true; this.scene.add(moat)

    // Enceinte bastionnée : forme extérieure moins la cour intérieure, extrudée
    const wallShape = shapeFrom(OUTER); wallShape.holes.push(shapeFrom(INNER))
    const wallGeo = new THREE.ExtrudeGeometry(wallShape, { depth: 1.1, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.08, bevelSegments: 1 })
    const walls = new THREE.Mesh(wallGeo, [
      new THREE.MeshStandardMaterial({ color: C.wallTop, roughness: 0.95, flatShading: true }),
      new THREE.MeshStandardMaterial({ color: C.wallSide, roughness: 0.9, flatShading: true }),
    ])
    walls.rotation.x = Math.PI / 2; walls.position.y = 1.1
    walls.castShadow = true; walls.receiveShadow = true
    this.scene.add(walls)

    const courtShape = shapeFrom(INNER)
    const court = new THREE.Mesh(new THREE.ShapeGeometry(courtShape), new THREE.MeshStandardMaterial({ color: C.court, roughness: 1, side: THREE.DoubleSide }))
    court.rotation.x = Math.PI / 2; court.position.y = 0.02; court.receiveShadow = true; this.scene.add(court)

    // Porte d'entrée : au milieu de la courtine entre les bastions sud et ouest
    const [g1, g2] = [OUTER[14], OUTER[15]]
    const gate = new THREE.Mesh(new THREE.BoxGeometry(1, 0.9, 0.6), new THREE.MeshStandardMaterial({ color: '#2b1b30' }))
    gate.position.copy(toV((g1[0] + g2[0]) / 2, (g1[1] + g2[1]) / 2, 0.45))
    gate.rotation.y = -Math.atan2(g2[1] - g1[1], g2[0] - g1[0])
    this.scene.add(gate)
    this.gatePos.copy(gate.position)
    this.gateDir.copy(gate.position).setY(0).normalize() // vers l'extérieur du Fort

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
      this.scene.add(g)
      if (b.label) this.addLabel(b.label, toV(b.x, b.y, b.height + 0.9))
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
      this.scene.add(g)
      for (const c of COURTS) this.addLabel(c.label, toV(c.x, c.y, 0.9), true)
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
      t.add(cab, roof); t.position.copy(toV(m.x, m.y)); this.scene.add(t)
      if (m.label) this.addLabel(m.label, toV(m.x, m.y, 3.3))
    }

    // Route goudronnée (camions et cars de détenus) et chemin d'accès
    const ribbon = (pts: Pt[], width: number, color: string, y: number) => {
      const curve = new THREE.CatmullRomCurve3(pts.map(([x, z]) => toV(x, z, y)))
      const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 80, width, 4, false), new THREE.MeshStandardMaterial({ color, roughness: 1 }))
      tube.scale.y = 0.15; tube.receiveShadow = true
      this.scene.add(tube)
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
    trees.castShadow = true; this.scene.add(trees)
  }

  private labels: THREE.Sprite[] = []
  private frames = new Map<number, { group: THREE.Group; n: number; s: number }>()
  private frameMeshes: { mesh: THREE.Mesh; id: number }[] = []
  private gatePos = new THREE.Vector3()
  private gateDir = new THREE.Vector3(0, 0, 1)
  private loader = new THREE.TextureLoader()

  /** Direction (dans le plan horizontal) d'où la caméra regarde une étape. */
  private focusDir(ordre: number) { return new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), -0.6 + ordre * 0.85) }

  /** Expose les documents d'archives de chaque étape, sur des chevalets autour de la punaise. */
  setFrames(sets: FrameSet[]) {
    for (const { group } of this.frames.values()) this.scene.remove(group)
    this.frames.clear(); this.frameMeshes = []
    const wood = new THREE.MeshStandardMaterial({ color: '#3b2a22', roughness: 0.8 })
    for (const set of sets) {
      if (!set.docs.length) continue
      const g = new THREE.Group()
      const dir = this.focusDir(set.ordre)
      const side = new THREE.Vector3(dir.z, 0, -dir.x)
      const base = toV(set.x, set.y).sub(dir.clone().multiplyScalar(1.1))
      set.docs.forEach((d, i) => {
        const f = new THREE.Group()
        const H = 1.5
        const mat = new THREE.MeshBasicMaterial({ color: '#d8ccb6' })
        const photo = new THREE.Mesh(new THREE.PlaneGeometry(H, H), mat)
        this.loader.load(d.url, (tex) => {
          tex.colorSpace = THREE.SRGBColorSpace
          const a = tex.image.width / tex.image.height
          photo.scale.set(a, 1, 1); border.scale.set(a + 0.12 / H, 1 + 0.12 / H, 1)
          mat.map = tex; mat.color.set('#ffffff'); mat.needsUpdate = true
        })
        const border = new THREE.Mesh(new THREE.BoxGeometry(H, H, 0.06), new THREE.MeshStandardMaterial({ color: '#fbf7ef', roughness: 0.9 }))
        border.position.z = -0.04; border.castShadow = true
        photo.position.y = border.position.y = 0
        const legs = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.2, 6), wood)
        legs.position.set(0, -1.1, -0.1)
        f.add(border, photo, legs)
        const lateral = (i - (set.docs.length - 1) / 2) * 1.85
        f.position.copy(base).add(side.clone().multiplyScalar(lateral)).add(new THREE.Vector3(0, 1.75, 0))
        f.position.add(dir.clone().multiplyScalar(-Math.abs(lateral) * 0.25)) // léger arc de cercle
        f.lookAt(f.position.clone().add(dir))
        g.add(f)
        this.frameMeshes.push({ mesh: photo, id: d.id })
      })
      g.children.forEach((c) => c.scale.setScalar(0.001)); g.visible = false
      this.scene.add(g)
      this.frames.set(set.ordre, { group: g, n: set.docs.length, s: 0.001 })
    }
  }

  /** Étiquette flottante (nom d'un bâtiment), visible en vue d'ensemble. */
  private addLabel(text: string, at: THREE.Vector3, hand = false) {
    const c = document.createElement('canvas'); const g = c.getContext('2d')!
    const font = hand ? '600 44px Caveat, cursive' : '600 30px Inter, system-ui, sans-serif'
    g.font = font; const w = Math.ceil(g.measureText(text).width) + 36
    c.width = w; c.height = 64
    g.font = font
    if (!hand) { g.fillStyle = 'rgba(251,247,239,.92)'; g.beginPath(); g.roundRect(0, 6, w, 52, 8); g.fill() }
    g.fillStyle = hand ? '#fbf3e8' : '#2b1b30'; g.textAlign = 'center'; g.textBaseline = 'middle'
    if (hand) { g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = 8 }
    g.fillText(text, w / 2, 34)
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthTest: false, opacity: 0 }))
    sp.scale.set((w / 64) * 0.62, 0.62, 1); sp.position.copy(at); sp.renderOrder = 5
    this.scene.add(sp); this.labels.push(sp)
  }

  setPins(pins: PinData[], current?: number) {
    this.pinGroup.clear(); this.heads = []
    const pts: THREE.Vector3[] = []
    for (const pin of pins) {
      const g = new THREE.Group()
      const color = pin.state === 'done' ? C.plum : pin.state === 'current' ? C.red : C.locked
      const needle = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.6, 6), new THREE.MeshStandardMaterial({ color: '#9a9a9a', metalness: 0.6, roughness: 0.3 }))
      needle.position.y = 0.8; needle.castShadow = true
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.3, 24, 16), new THREE.MeshStandardMaterial({ color, roughness: 0.35, emissive: pin.state === 'current' ? '#5a0a0f' : '#000000' }))
      head.position.y = 1.7; head.castShadow = true
      const label = numberSprite(pin.ordre); label.position.y = 2.35
      g.add(needle, head, label); g.position.copy(toV(pin.x, pin.y))
      g.userData = { ordre: pin.ordre, bob: pin.state === 'current' }
      this.pinGroup.add(g)
      this.heads.push({ mesh: head, ordre: pin.ordre, reachable: pin.reachable })
      if (pin.state !== 'locked') pts.push(toV(pin.x, pin.y, 1.7))
    }

    // Fil rouge tendu entre les punaises des étapes atteintes
    if (this.threadMesh) { this.scene.remove(this.threadMesh); this.threadMesh.geometry.dispose() }
    this.threadMesh = null
    if (pts.length > 1) {
      const sag: THREE.Vector3[] = []
      for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i], b = pts[i + 1]
        sag.push(a, a.clone().lerp(b, 0.5).add(new THREE.Vector3(0, -0.45, 0)))
      }
      sag.push(pts[pts.length - 1])
      const curve = new THREE.CatmullRomCurve3(sag)
      const geo = new THREE.TubeGeometry(curve, 160, 0.045, 8, false)
      this.threadMesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: C.red, emissive: '#7a0d14', roughness: 0.5 }))
      this.threadMesh.castShadow = true
      this.scene.add(this.threadMesh)
      // le fil se déroule depuis sa longueur précédente jusqu'à la nouvelle punaise
      this.threadProgress = this.opts.reducedMotion || pts.length <= this.lastThread ? 1 : Math.max(0, (this.lastThread - 1) / (pts.length - 1))
    }

    this.lastThread = pts.length
    const cur = pins.find((p) => p.ordre === current)
    this.pulse.visible = !!cur
    if (cur) this.pulse.position.copy(toV(cur.x, cur.y, 0.04))
  }

  /** Place la caméra selon la page affichée : chaque navigation devient un mouvement de caméra. */
  setView(v: View) {
    this.view = v
    this.userOverride = false
    this.arrived = false
    this.controls.autoRotate = false
    const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z)
    if (v.kind === 'hero') { this.base = { pos: V(12.5, 4.6, 11.5), target: V(0, 1.2, 0) }; this.shiftGoal = 0.1 }
    if (v.kind === 'overview') { this.base = { pos: V(3, 17, 14), target: V(0, 0, 0.5) }; this.shiftGoal = 0.2 }
    if (v.kind === 'sky') { this.base = { pos: V(0, 27, 7), target: V(0, 0, 0) }; this.shiftGoal = 0.16 }
    if (v.kind === 'gate') {
      const target = this.gatePos.clone().setY(0.8)
      this.base = { pos: target.clone().add(this.gateDir.clone().multiplyScalar(6.5)).setY(2.2), target }
      this.shiftGoal = 0.05
    }
    if (v.kind === 'focus') {
      const n = this.frames.get(v.ordre)?.n ?? 0
      const target = toV(v.x, v.y, 1.3)
      const off = V(0, 5.2, 8.2).multiplyScalar(1 + Math.max(0, n - 1) * 0.22).applyAxisAngle(V(0, 1, 0), -0.6 + v.ordre * 0.85)
      this.base = { pos: target.clone().add(off), target }
      this.shiftGoal = 0.22
    }
    if (this.opts.reducedMotion) { this.camera.position.copy(this.base.pos.clone().sub(this.base.target).multiplyScalar(this.distScale).add(this.base.target)); this.controls.target.copy(this.base.target); this.arrived = true }
  }

  /** 0 → 1 selon le défilement de la page : la caméra tourne doucement autour du lieu. */
  setScroll(f: number) { this.scrollAz = this.opts.reducedMotion ? 0 : f * 0.7 }

  /** Petit rebond d'une punaise (réponse donnée, lieu débloqué…). */
  ping(ordre: number) { if (!this.opts.reducedMotion) this.pingT.set(ordre, this.clock.elapsedTime) }

  private pick(e: PointerEvent) {
    const r = this.renderer.domElement.getBoundingClientRect()
    this.pointer.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1)
    this.ray.setFromCamera(this.pointer, this.camera)
    const hit = this.ray.intersectObjects(this.heads.map((h) => h.mesh))[0]
    return hit ? this.heads.find((h) => h.mesh === hit.object) : undefined
  }

  private onMove = (e: PointerEvent) => {
    const h = this.pick(e)
    const onFrame = this.ray.intersectObjects(this.frameMeshes.filter((f) => f.mesh.parent?.parent?.visible).map((f) => f.mesh)).length > 0
    this.renderer.domElement.style.cursor = h?.reachable || onFrame ? 'pointer' : ''
  }

  private onUp = (e: PointerEvent) => {
    if (Math.hypot(e.clientX - this.down.x, e.clientY - this.down.y) > 6) return // c'était une rotation
    const visibleFrames = this.frameMeshes.filter((f) => f.mesh.parent?.parent?.visible)
    const fh = this.ray.intersectObjects(visibleFrames.map((f) => f.mesh))[0]
    if (fh) { const f = visibleFrames.find((x) => x.mesh === fh.object); if (f) { this.opts.onPhoto?.(f.id); return } }
    const h = this.pick(e)
    if (h?.reachable) this.opts.onSelect?.(h.ordre)
  }

  private resize() {
    const { clientWidth: w, clientHeight: h } = this.host
    if (!w || !h) return
    this.renderer.setSize(w, h, false)
    this.camera.aspect = w / h
    const portrait = w / h < 1
    this.camera.fov = portrait ? 52 : 38
    this.distScale = portrait ? Math.min(1.6, Math.max(1, 0.62 / (w / h))) : 1
    this.applyShift()
  }

  /** Décale le cadrage vers le haut de l'écran (le bas est occupé par les fiches). */
  private applyShift() {
    const { clientWidth: w, clientHeight: h } = this.host
    if (!w || !h) return
    this.camera.setViewOffset(w, h, 0, h * this.shift, w, h)
    this.camera.updateProjectionMatrix()
  }

  private loop = () => {
    this.raf = requestAnimationFrame(this.loop)
    if (!this.visible) return
    const dt = Math.min(this.clock.getDelta(), 0.25)
    const t = this.clock.elapsedTime
    const k = 1 - Math.pow(0.08, dt) // amorti des mouvements de caméra
    if (Math.abs(this.shift - this.shiftGoal) > 0.001) { this.shift += (this.shiftGoal - this.shift) * k; this.applyShift() }
    const orbiting = (this.view.kind === 'hero' || this.view.kind === 'sky') && this.arrived
    if (!this.userOverride && !orbiting) {
      const goal = this.base.pos.clone().sub(this.base.target).multiplyScalar(this.distScale).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.scrollAz).add(this.base.target)
      this.camera.position.lerp(goal, k)
      this.controls.target.lerp(this.base.target, k)
      if (!this.arrived && this.camera.position.distanceTo(goal) < 0.08) {
        this.arrived = true
        if ((this.view.kind === 'hero' || this.view.kind === 'sky') && !this.opts.reducedMotion) {
          this.controls.autoRotate = true
          this.controls.autoRotateSpeed = this.view.kind === 'sky' ? 0.3 : 0.45
        }
      }
    }
    if (!this.opts.reducedMotion) {
      for (const g of this.pinGroup.children) if (g.userData.bob) g.children.forEach((c) => { if (c.position.y > 1) c.position.y = (c instanceof THREE.Sprite ? 2.35 : 1.7) + Math.sin(t * 2.4) * 0.12 })
      const s = 1 + ((t * 0.8) % 1) * 1.4
      this.pulse.scale.set(s, s, s);
      (this.pulse.material as THREE.MeshBasicMaterial).opacity = 0.85 * (1 - ((t * 0.8) % 1))
    }
    for (const h of this.heads) {
      const t0 = this.pingT.get(h.ordre)
      if (t0 === undefined) continue
      const u = t - t0
      if (u > 1.2) { this.pingT.delete(h.ordre); h.mesh.scale.setScalar(1); continue }
      h.mesh.scale.setScalar(1 + Math.sin(u * Math.PI * 3) * Math.exp(-u * 3) * 0.9)
    }
    if (this.threadMesh && this.threadProgress < 1) {
      this.threadProgress = Math.min(1, this.threadProgress + dt * 0.6)
      const idx = this.threadMesh.geometry.index!
      this.threadMesh.geometry.setDrawRange(0, Math.floor(idx.count * this.threadProgress / 6) * 6)
    }
    for (const [ordre, f] of this.frames) {
      const want = this.view.kind === 'focus' && this.view.ordre === ordre ? 1 : 0.001
      f.s += (want - f.s) * Math.min(1, dt * (want > 0.5 ? 2.5 : 6))
      f.group.children.forEach((c) => c.scale.setScalar(f.s)); f.group.visible = f.s > 0.01
      if (!this.opts.reducedMotion) f.group.children.forEach((c, i) => { c.position.y = 1.75 + Math.sin(t * 1.1 + i) * 0.05 })
    }
    const wantLabels = this.view.kind === 'overview' || this.view.kind === 'sky' ? 1 : 0
    for (const l of this.labels) { const m = l.material as THREE.SpriteMaterial; m.opacity += (wantLabels - m.opacity) * Math.min(1, dt * 4) }
    this.controls.update()
    this.renderer.render(this.scene, this.camera)
  }

  dispose() {
    cancelAnimationFrame(this.raf)
    this.ro.disconnect(); this.io.disconnect()
    this.controls.dispose()
    this.scene.traverse((o) => {
      const mesh = o as THREE.Mesh
      mesh.geometry?.dispose()
      const mat = mesh.material as THREE.Material | THREE.Material[] | undefined
      ;(Array.isArray(mat) ? mat : mat ? [mat] : []).forEach((mm) => mm.dispose())
    })
    this.renderer.dispose()
    this.renderer.domElement.remove()
  }
}

export function webglAvailable() {
  try {
    const c = document.createElement('canvas')
    return !!(window.WebGL2RenderingContext && c.getContext('webgl2'))
  } catch { return false }
}
