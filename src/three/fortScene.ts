// Visite 3D du Fort de Romainville (Three.js).
// - Vues d'ensemble (accueil, plan, fresque) en orbite autour de la maquette.
// - Étapes visitées « à hauteur de visiteur » : la caméra vole jusqu'au lieu, on regarde autour en glissant
//   (ou avec le gyroscope), les tirages d'archives sont suspendus au fil rouge et se prennent en main.
// Volumes indicatifs, d'après le plan d'août 1944.
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { CENTER } from './layout'
import { buildWorld, C, toV } from './world'
import { Atmosphere, createComposer, STEP_MOOD } from './atmosphere'

export interface PinData { ordre: number; titre: string; x: number; y: number; state: 'done' | 'current' | 'locked'; reachable: boolean }
export type View =
  | { kind: 'hero' }
  | { kind: 'overview' }
  | { kind: 'station'; x: number; y: number; ordre: number }
  | { kind: 'sky' }
  | { kind: 'gate' }
export interface FrameDoc { id: number; url: string; verso?: string; titre: string }
export interface FrameSet { ordre: number; x: number; y: number; docs: FrameDoc[] }
export interface SceneOptions {
  onSelect?: (ordre: number) => void
  onPhoto?: (id: number) => void
  onInspectEnd?: () => void
  onLook?: () => void
  reducedMotion?: boolean
}

const EYE = 1.9 // hauteur du regard en mode visite
const easeInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2)

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

type Mode = 'orbit' | 'travel' | 'station'
interface Print { mesh: THREE.Mesh; id: number; ordre: number; home: THREE.Object3D; homePos: THREE.Vector3; w: number; h: number }

export class FortScene {
  private renderer: THREE.WebGLRenderer
  private scene = new THREE.Scene()
  private camera: THREE.PerspectiveCamera
  private controls: OrbitControls
  private composer: ReturnType<typeof createComposer>
  private atmo: Atmosphere
  private pinGroup = new THREE.Group()
  private threadMesh: THREE.Mesh | null = null
  private threadProgress = 1
  private lastThread = 0
  private pulse: THREE.Mesh
  private pulseOn = false
  private heads: { mesh: THREE.Mesh; ordre: number; reachable: boolean }[] = []
  private labels: THREE.Sprite[] = []
  private ray = new THREE.Raycaster()
  private pointer = new THREE.Vector2()
  private clock = new THREE.Clock()
  private raf = 0
  private visible = true
  private ro: ResizeObserver
  private io: IntersectionObserver
  private loader = new THREE.TextureLoader()
  private gatePos = new THREE.Vector3()
  private gateDir = new THREE.Vector3(0, 0, 1)

  // vues d'ensemble
  private mode: Mode = 'orbit'
  private view: View = { kind: 'hero' }
  private base = { pos: new THREE.Vector3(12.5, 4.6, 11.5), target: new THREE.Vector3(0, 1.2, 0) }
  private shift = 0.1
  private shiftGoal = 0.1
  private panelShift = 0
  private scrollAz = 0
  private userOverride = false
  private arrived = false
  private distScale = 1

  // trajet et visite
  private travel: { curve: THREE.CatmullRomCurve3; lookFrom: THREE.Vector3; lookTo: THREE.Vector3; t: number; dur: number } | null = null
  private yaw = 0
  private pitch = 0
  private yawGoal = 0
  private pitchGoal = 0
  private gyro = { on: false, a0: NaN, b0: NaN, yaw: 0, pitch: 0 }
  private dragging = false
  private down = { x: 0, y: 0, lastX: 0, lastY: 0 }
  private nudgeT = -10

  // exposition et inspection
  private exhibits = new Map<number, { group: THREE.Group; s: number }>()
  private prints: Print[] = []
  private unlocked = new Set<number>()
  private inspecting: Print | null = null
  private inspectRot = { yaw: 0, pitch: 0, flip: 0 }
  private returning: Print[] = []
  private pingT = new Map<number, number>()
  private bulb: THREE.PointLight

  constructor(private host: HTMLElement, private opts: SceneOptions) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.05
    host.appendChild(this.renderer.domElement)

    this.camera = new THREE.PerspectiveCamera(38, 1, 0.05, 200)
    this.camera.position.set(30, 14, 30)
    this.scene.add(this.camera)

    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.enableDamping = true
    this.controls.enablePan = false
    this.controls.enableZoom = false
    this.controls.maxPolarAngle = 1.36
    this.controls.target.set(0, 1.2, 0)
    this.controls.addEventListener('start', () => { this.userOverride = true; this.controls.autoRotate = false })

    const world = buildWorld(this.scene, (t, at, hand) => this.addLabel(t, at, hand))
    this.gatePos.copy(world.gatePos); this.gateDir.copy(world.gateDir)
    this.atmo = new Atmosphere(this.scene, world.sun, world.hemi)
    const light = (navigator.hardwareConcurrency ?? 8) <= 4 || !!opts.reducedMotion
    this.composer = createComposer(this.renderer, this.scene, this.camera, light)
    this.scene.add(this.pinGroup)

    this.pulse = new THREE.Mesh(new THREE.RingGeometry(0.45, 0.62, 48), new THREE.MeshBasicMaterial({ color: C.red, transparent: true, opacity: 0.8, side: THREE.DoubleSide }))
    this.pulse.rotation.x = -Math.PI / 2; this.pulse.visible = false
    this.scene.add(this.pulse)

    // lampe chaude au-dessus de l'exposition en cours
    this.bulb = new THREE.PointLight('#ffcf8a', 0, 7, 1.6)
    const glow = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 8), new THREE.MeshBasicMaterial({ color: '#fff0c8' }))
    this.bulb.add(glow); this.scene.add(this.bulb)

    const el = this.renderer.domElement
    el.addEventListener('pointerdown', this.onDown)
    el.addEventListener('pointermove', this.onMove)
    el.addEventListener('pointerup', this.onUp)
    el.addEventListener('pointercancel', () => { this.dragging = false })

    this.ro = new ResizeObserver(() => this.resize()); this.ro.observe(host)
    this.io = new IntersectionObserver(([e]) => { this.visible = e.isIntersecting }); this.io.observe(host)
    this.resize()
    this.loop()
  }

  // ---------- étiquettes, punaises, fil rouge ----------

  private addLabel(text: string, at: THREE.Vector3, hand = false) {
    const c = document.createElement('canvas'); const g = c.getContext('2d')!
    const font = hand ? '600 44px Caveat, cursive' : '600 30px Inter, system-ui, sans-serif'
    g.font = font; const w = Math.ceil(g.measureText(text).width) + 36
    c.width = w; c.height = 64; g.font = font
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
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.3, 24, 16), new THREE.MeshStandardMaterial({ color, roughness: 0.35, emissive: pin.state === 'current' ? '#7a0d14' : '#000000' }))
      head.position.y = 1.7; head.castShadow = true
      const label = numberSprite(pin.ordre); label.position.y = 2.35
      g.add(needle, head, label); g.position.copy(toV(pin.x, pin.y))
      g.userData = { bob: pin.state === 'current', ordre: pin.ordre }
      this.pinGroup.add(g)
      this.heads.push({ mesh: head, ordre: pin.ordre, reachable: pin.reachable })
      if (pin.state !== 'locked') pts.push(toV(pin.x, pin.y, 1.7))
    }
    if (this.threadMesh) { this.scene.remove(this.threadMesh); this.threadMesh.geometry.dispose() }
    this.threadMesh = null
    if (pts.length > 1) {
      const sag: THREE.Vector3[] = []
      for (let i = 0; i < pts.length - 1; i++) sag.push(pts[i], pts[i].clone().lerp(pts[i + 1], 0.5).add(new THREE.Vector3(0, -0.45, 0)))
      sag.push(pts[pts.length - 1])
      this.threadMesh = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(sag), 160, 0.045, 8, false), new THREE.MeshStandardMaterial({ color: C.red, emissive: '#7a0d14', roughness: 0.5 }))
      this.threadMesh.castShadow = true
      this.scene.add(this.threadMesh)
      this.threadProgress = this.opts.reducedMotion || pts.length <= this.lastThread ? 1 : Math.max(0, (this.lastThread - 1) / (pts.length - 1))
    }
    this.lastThread = pts.length
    const cur = pins.find((p) => p.ordre === current)
    this.pulseOn = !!cur
    if (cur) this.pulse.position.copy(toV(cur.x, cur.y, 0.04))
  }

  // ---------- exposition : tirages suspendus au fil rouge ----------

  private stationGeo(x: number, y: number) {
    const P = toV(x, y)
    const dir = toV(CENTER[0], CENTER[1]).sub(P).setY(0)
    if (dir.lengthSq() < 0.01) dir.set(0, 0, 1)
    dir.normalize() // de l'exposition vers le visiteur (vers l'intérieur du Fort)
    const eye = P.clone().add(dir.clone().multiplyScalar(3.3)).setY(EYE)
    return { P, dir, eye }
  }

  setFrames(sets: FrameSet[]) {
    for (const { group } of this.exhibits.values()) this.scene.remove(group)
    this.exhibits.clear(); this.prints = []
    const wood = new THREE.MeshStandardMaterial({ color: '#3b2a22', roughness: 0.8 })
    const red = new THREE.MeshStandardMaterial({ color: C.red, emissive: '#5a0a0f', roughness: 0.5 })
    const paper = new THREE.MeshStandardMaterial({ color: '#efe6d6', roughness: 0.95 })
    for (const set of sets) {
      if (!set.docs.length) continue
      const { P, dir } = this.stationGeo(set.x, set.y)
      const g = new THREE.Group()
      g.position.copy(P)
      g.lookAt(P.clone().add(dir)) // la face avant (+z) des tirages regarde le visiteur
      const span = Math.max(2.2, set.docs.length * 1.25)
      for (const sx of [-span / 2 - 0.3, span / 2 + 0.3]) {
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 2.9, 8), wood)
        pole.position.set(sx, 1.45, 0); pole.castShadow = true; g.add(pole)
      }
      const wire = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
        new THREE.Vector3(-span / 2 - 0.3, 2.75, 0), new THREE.Vector3(0, 2.6, 0), new THREE.Vector3(span / 2 + 0.3, 2.75, 0)]), 40, 0.018, 6), red)
      g.add(wire)
      set.docs.forEach((d, i) => {
        const hanger = new THREE.Group()
        hanger.position.set((i - (set.docs.length - 1) / 2) * 1.25, 2.62, 0)
        const clip = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.12, 0.04), wood); clip.position.y = -0.02
        hanger.add(clip)
        const front = new THREE.MeshBasicMaterial({ color: '#d8ccb6' })
        const back = d.verso ? new THREE.MeshBasicMaterial({ color: '#d8ccb6' }) : paper
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 0.012), [paper, paper, paper, paper, front, back])
        mesh.castShadow = true
        mesh.position.y = -0.6
        const print: Print = { mesh, id: d.id, ordre: set.ordre, home: hanger, homePos: mesh.position.clone(), w: 1, h: 1 }
        this.loader.load(d.url, (tex) => {
          tex.colorSpace = THREE.SRGBColorSpace; front.map = tex; front.color.set('#ffffff'); front.needsUpdate = true
          const a = tex.image.width / tex.image.height
          print.w = a >= 1 ? 1.05 : 1.05 * a; print.h = a >= 1 ? 1.05 / a : 1.05
          print.homePos.set(0, -0.06 - print.h / 2, 0)
          if (mesh.parent === hanger) { mesh.scale.set(print.w, print.h, 1); mesh.position.copy(print.homePos) }
        })
        if (d.verso) this.loader.load(d.verso, (tex) => { tex.colorSpace = THREE.SRGBColorSpace; back.map = tex; back.color.set('#ffffff'); back.needsUpdate = true })
        hanger.add(mesh)
        hanger.scale.setScalar(0.001)
        g.add(hanger)
        this.prints.push(print)
      })
      g.visible = false
      g.scale.setScalar(0.001)
      this.scene.add(g)
      this.exhibits.set(set.ordre, { group: g, s: 0 })
    }
  }

  /** Les tirages n'apparaissent qu'une fois le visiteur « arrivé » sur le lieu. */
  setUnlocked(ordres: number[]) { this.unlocked = new Set(ordres) }

  /** Prend un tirage en main : il vient face à la caméra. */
  inspect(id: number) {
    const p = this.prints.find((x) => x.id === id)
    if (!p || p === this.inspecting) return
    if (this.inspecting) this.release(false)
    this.scene.attach(p.mesh)
    this.inspecting = p
    this.inspectRot = { yaw: 0, pitch: 0, flip: 0 }
    this.returning = this.returning.filter((r) => r !== p)
  }

  flip() { if (this.inspecting) this.inspectRot.flip += Math.PI }

  release(notify = true) {
    const p = this.inspecting
    if (!p) return
    this.inspecting = null
    this.returning.push(p)
    if (notify) this.opts.onInspectEnd?.()
  }

  // ---------- vues et trajets ----------

  setView(v: View) {
    const prev = this.view
    this.view = v
    this.userOverride = false
    this.arrived = false
    this.controls.autoRotate = false
    if (this.inspecting) this.release()
    const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z)
    this.atmo.setMood(v.kind === 'station' ? STEP_MOOD[(v.ordre - 1) % STEP_MOOD.length] : v.kind === 'sky' ? 'nuit' : 'crepuscule')

    if (v.kind === 'station') {
      const { P, eye } = this.stationGeo(v.x, v.y)
      const look = P.clone().setY(1.85)
      this.bulb.position.copy(P).setY(3.3)
      this.shiftGoal = 0.1
      const from = this.camera.position.clone()
      const lookFrom = this.currentLook()
      this.controls.enabled = false
      if (this.opts.reducedMotion) { this.camera.position.copy(eye); this.endTravel(look); return }
      const mid = from.clone().lerp(eye, 0.5)
      mid.y = Math.max(from.y, eye.y) + (prev.kind === 'station' ? 3.2 : 1.5)
      this.travel = { curve: new THREE.CatmullRomCurve3([from, mid, eye]), lookFrom, lookTo: look, t: 0, dur: prev.kind === 'station' ? 2.6 : 3.2 }
      this.mode = 'travel'
      return
    }

    // vues d'ensemble : orbite autour de la maquette
    const look = this.currentLook()
    this.mode = 'orbit'
    this.travel = null
    this.controls.enabled = true
    this.controls.target.copy(look)
    if (v.kind === 'hero') { this.base = { pos: V(12.5, 4.6, 11.5), target: V(0, 1.2, 0) }; this.shiftGoal = 0.1 }
    if (v.kind === 'overview') { this.base = { pos: V(3, 17, 14), target: V(0, 0, 0.5) }; this.shiftGoal = 0.2 }
    if (v.kind === 'sky') { this.base = { pos: V(0, 27, 7), target: V(0, 0, 0) }; this.shiftGoal = 0.16 }
    if (v.kind === 'gate') {
      const target = this.gatePos.clone().setY(0.8)
      this.base = { pos: target.clone().add(this.gateDir.clone().multiplyScalar(6.5)).setY(2.2), target }
      this.shiftGoal = 0.05
    }
    if (this.opts.reducedMotion) { this.camera.position.copy(this.goalPos()); this.controls.target.copy(this.base.target); this.arrived = true }
  }

  private currentLook() {
    if (this.mode === 'orbit') return this.controls.target.clone()
    const d = new THREE.Vector3(); this.camera.getWorldDirection(d)
    return this.camera.position.clone().add(d.multiplyScalar(4))
  }

  private endTravel(look: THREE.Vector3) {
    this.travel = null
    this.mode = 'station'
    const d = look.clone().sub(this.camera.position).normalize()
    this.yaw = this.yawGoal = Math.atan2(d.x, d.z)
    this.pitch = this.pitchGoal = Math.asin(THREE.MathUtils.clamp(d.y, -1, 1))
  }

  private goalPos() {
    return this.base.pos.clone().sub(this.base.target).multiplyScalar(this.distScale)
      .applyAxisAngle(new THREE.Vector3(0, 1, 0), this.scrollAz).add(this.base.target)
  }

  setScroll(f: number) { this.scrollAz = this.opts.reducedMotion ? 0 : f * 0.7 }
  /** Le panneau de contenu déplié : on recadre la scène plus haut. */
  setPanel(open: boolean) { this.panelShift = open ? 0.14 : 0 }
  ping(ordre: number) { if (!this.opts.reducedMotion) this.pingT.set(ordre, this.clock.elapsedTime) }
  /** Petit mouvement de caméra en réponse à une action (réponse, arrivée…). */
  nudge() { if (!this.opts.reducedMotion) this.nudgeT = this.clock.elapsedTime }

  // ---------- gyroscope (regarder autour en bougeant le téléphone) ----------

  async enableGyro(): Promise<boolean> {
    const DOE = window.DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> } | undefined
    if (!DOE) return false
    try { if (DOE.requestPermission && (await DOE.requestPermission()) !== 'granted') return false } catch { return false }
    this.gyro = { on: true, a0: NaN, b0: NaN, yaw: 0, pitch: 0 }
    addEventListener('deviceorientation', this.onOrient)
    return true
  }
  disableGyro() { this.gyro.on = false; this.gyro.yaw = this.gyro.pitch = 0; removeEventListener('deviceorientation', this.onOrient) }
  private onOrient = (e: DeviceOrientationEvent) => {
    if (e.alpha == null || e.beta == null) return
    if (Number.isNaN(this.gyro.a0)) { this.gyro.a0 = e.alpha; this.gyro.b0 = e.beta }
    let da = e.alpha - this.gyro.a0; if (da > 180) da -= 360; if (da < -180) da += 360
    this.gyro.yaw = THREE.MathUtils.degToRad(da)
    this.gyro.pitch = THREE.MathUtils.clamp(THREE.MathUtils.degToRad(e.beta - this.gyro.b0) * 0.7, -0.5, 0.5)
  }

  // ---------- pointeur ----------

  private pickFrom(e: PointerEvent, objects: THREE.Object3D[]) {
    const r = this.renderer.domElement.getBoundingClientRect()
    this.pointer.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1)
    this.ray.setFromCamera(this.pointer, this.camera)
    return this.ray.intersectObjects(objects, false)[0]
  }

  private visiblePrints() {
    return this.prints.filter((p) => p === this.inspecting || (p.home.scale.x > 0.5 && (this.exhibits.get(p.ordre)?.s ?? 0) > 0.5))
  }

  private onDown = (e: PointerEvent) => {
    this.down = { x: e.clientX, y: e.clientY, lastX: e.clientX, lastY: e.clientY }
    this.dragging = this.mode === 'station' || !!this.inspecting
  }

  private onMove = (e: PointerEvent) => {
    if (this.dragging) {
      const dx = e.clientX - this.down.lastX, dy = e.clientY - this.down.lastY
      this.down.lastX = e.clientX; this.down.lastY = e.clientY
      if (this.inspecting) {
        this.inspectRot.yaw += dx * 0.01
        this.inspectRot.pitch = THREE.MathUtils.clamp(this.inspectRot.pitch + dy * 0.006, -0.6, 0.6)
      } else if (this.mode === 'station') {
        this.yawGoal -= dx * 0.005
        this.pitchGoal = THREE.MathUtils.clamp(this.pitchGoal - dy * 0.004, -0.55, 0.45)
        if (Math.abs(dx) + Math.abs(dy) > 2) this.opts.onLook?.()
      }
      return
    }
    const onPrint = !!this.pickFrom(e, this.visiblePrints().map((p) => p.mesh))
    const head = this.pickFrom(e, this.heads.map((h) => h.mesh))
    const reach = head && this.heads.find((h) => h.mesh === head.object)?.reachable
    this.renderer.domElement.style.cursor = onPrint ? 'zoom-in' : reach ? 'pointer' : this.mode === 'station' ? 'grab' : ''
  }

  private onUp = (e: PointerEvent) => {
    this.dragging = false
    if (Math.hypot(e.clientX - this.down.x, e.clientY - this.down.y) > 6) return // c'était un glissé
    if (this.inspecting) {
      if (!this.pickFrom(e, [this.inspecting.mesh])) this.release()
      return
    }
    const ph = this.pickFrom(e, this.visiblePrints().map((p) => p.mesh))
    if (ph) { const p = this.prints.find((x) => x.mesh === ph.object); if (p) { this.opts.onPhoto?.(p.id); return } }
    const hh = this.pickFrom(e, this.heads.map((h) => h.mesh))
    const h = hh && this.heads.find((x) => x.mesh === hh.object)
    if (h?.reachable) this.opts.onSelect?.(h.ordre)
  }

  // ---------- rendu ----------

  private resize() {
    const { clientWidth: w, clientHeight: h } = this.host
    if (!w || !h) return
    this.renderer.setSize(w, h, false)
    this.composer.composer.setSize(w, h)
    this.camera.aspect = w / h
    const portrait = w / h < 1
    this.camera.fov = portrait ? 56 : 42
    this.distScale = portrait ? Math.min(1.6, Math.max(1, 0.62 / (w / h))) : 1
    this.applyShift()
  }

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
    const k = 1 - Math.pow(0.08, dt)
    const reduced = !!this.opts.reducedMotion

    const sg = this.shiftGoal + this.panelShift
    if (Math.abs(this.shift - sg) > 0.001) { this.shift += (sg - this.shift) * k; this.applyShift() }

    if (this.mode === 'orbit') {
      const orbiting = (this.view.kind === 'hero' || this.view.kind === 'sky') && this.arrived
      if (!this.userOverride && !orbiting) {
        const goal = this.goalPos()
        this.camera.position.lerp(goal, k)
        this.controls.target.lerp(this.base.target, k)
        if (!this.arrived && this.camera.position.distanceTo(goal) < 0.08) {
          this.arrived = true
          if ((this.view.kind === 'hero' || this.view.kind === 'sky') && !reduced) { this.controls.autoRotate = true; this.controls.autoRotateSpeed = this.view.kind === 'sky' ? 0.3 : 0.45 }
        }
      }
      this.controls.update()
    } else if (this.mode === 'travel' && this.travel) {
      const tr = this.travel
      tr.t = Math.min(1, tr.t + dt / tr.dur)
      const e = easeInOut(tr.t)
      this.camera.position.copy(tr.curve.getPoint(e))
      this.camera.lookAt(tr.lookFrom.clone().lerp(tr.lookTo, Math.min(1, e * 1.3)))
      if (tr.t >= 1) this.endTravel(tr.lookTo)
    } else if (this.mode === 'station') {
      this.yaw += (this.yawGoal - this.yaw) * Math.min(1, dt * 8)
      this.pitch += (this.pitchGoal - this.pitch) * Math.min(1, dt * 8)
      const sway = reduced ? 0 : Math.sin(t * 0.6) * 0.012
      const nud = t - this.nudgeT < 0.9 ? Math.sin(((t - this.nudgeT) / 0.9) * Math.PI) * 0.35 : 0
      const yw = this.yaw + this.gyro.yaw + sway, pt = this.pitch + this.gyro.pitch
      const dir = new THREE.Vector3(Math.cos(pt) * Math.sin(yw), Math.sin(pt), Math.cos(pt) * Math.cos(yw))
      if (this.view.kind === 'station') {
        const { eye } = this.stationGeo(this.view.x, this.view.y)
        this.camera.position.lerp(eye.clone().add(dir.clone().setY(0).normalize().multiplyScalar(nud)), k)
      }
      this.camera.lookAt(this.camera.position.clone().add(dir))
    }

    // exposition : apparition des tirages sur le lieu de l'étape
    const stationOrdre = this.view.kind === 'station' ? this.view.ordre : -1
    this.bulb.intensity += ((stationOrdre > 0 && this.mode === 'station' ? 6 : 0) - this.bulb.intensity) * Math.min(1, dt * 2)
    for (const [ordre, ex] of this.exhibits) {
      const on = ordre === stationOrdre && this.mode !== 'orbit'
      const showPrints = on && this.unlocked.has(ordre)
      ex.s += ((on ? 1 : 0) - ex.s) * Math.min(1, dt * 3)
      ex.group.visible = ex.s > 0.01
      ex.group.scale.setScalar(Math.max(0.001, ex.s))
      let i = 0
      for (const c of ex.group.children) {
        if (!(c instanceof THREE.Group)) continue
        const target = showPrints ? 1 : 0.001
        c.scale.setScalar(c.scale.x + (target - c.scale.x) * Math.min(1, dt * (2.2 - i * 0.25)))
        if (!reduced) c.rotation.z = Math.sin(t * 1.3 + i * 1.7) * 0.03
        i++
      }
    }

    // tirage en main
    if (this.inspecting) {
      const p = this.inspecting
      const fwd = new THREE.Vector3(); this.camera.getWorldDirection(fwd)
      const visH = 2 * 1.2 * Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2))
      const visW = visH * this.camera.aspect
      const s = Math.min((0.6 * visH) / p.h, (0.86 * visW) / p.w)
      const up = new THREE.Vector3(0, 1, 0).applyQuaternion(this.camera.quaternion)
      const goal = this.camera.position.clone().add(fwd.multiplyScalar(1.2)).add(up.multiplyScalar(visH * 0.12))
      const q = this.camera.quaternion.clone()
        .multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(this.inspectRot.pitch, this.inspectRot.yaw + this.inspectRot.flip, 0)))
      p.mesh.position.lerp(goal, Math.min(1, k * 1.4))
      p.mesh.quaternion.slerp(q, Math.min(1, k * 1.4))
      const cs = p.mesh.scale.x / p.w
      const ns = cs + (s - cs) * k
      p.mesh.scale.set(p.w * ns, p.h * ns, 1)
    }
    for (const r of [...this.returning]) {
      const hp = r.home.localToWorld(r.homePos.clone())
      const hq = r.home.getWorldQuaternion(new THREE.Quaternion())
      const hs = new THREE.Vector3(); r.home.getWorldScale(hs)
      r.mesh.position.lerp(hp, Math.min(1, k * 1.4)); r.mesh.quaternion.slerp(hq, Math.min(1, k * 1.4))
      r.mesh.scale.lerp(new THREE.Vector3(r.w * hs.x, r.h * hs.y, hs.z), Math.min(1, k * 1.4))
      if (r.mesh.position.distanceTo(hp) < 0.03 || !r.home.parent?.visible) {
        r.home.attach(r.mesh); r.mesh.position.copy(r.homePos); r.mesh.quaternion.identity(); r.mesh.scale.set(r.w, r.h, 1)
        this.returning = this.returning.filter((x) => x !== r)
      }
    }

    // punaises : celle du lieu visité s'efface pour laisser voir l'exposition
    for (const g of this.pinGroup.children) {
      const hide = this.mode !== 'orbit' // en visite, les punaises s'effacent : on est sur le lieu
      const sc = g.scale.x + ((hide ? 0.001 : 1) - g.scale.x) * Math.min(1, dt * 5)
      g.scale.setScalar(sc); g.visible = sc > 0.02
    }
    this.pulse.visible = this.pulseOn && this.mode === 'orbit'
    // punaises, pulsation, fil rouge, étiquettes
    if (!reduced) {
      for (const g of this.pinGroup.children) if (g.userData.bob) g.children.forEach((c) => { if (c.position.y > 1) c.position.y = (c instanceof THREE.Sprite ? 2.35 : 1.7) + Math.sin(t * 2.4) * 0.12 })
      const s = 1 + ((t * 0.8) % 1) * 1.4
      this.pulse.scale.set(s, s, s)
      ;(this.pulse.material as THREE.MeshBasicMaterial).opacity = 0.85 * (1 - ((t * 0.8) % 1))
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
      this.threadMesh.geometry.setDrawRange(0, Math.floor((idx.count * this.threadProgress) / 6) * 6)
    }
    const wantLabels = this.view.kind === 'overview' || this.view.kind === 'sky' ? 1 : 0
    for (const l of this.labels) { const m = l.material as THREE.SpriteMaterial; m.opacity += (wantLabels - m.opacity) * Math.min(1, dt * 4) }

    this.atmo.update(dt, t, this.camera, reduced)
    this.composer.film.uniforms.time.value = t
    this.composer.composer.render()
  }

  dispose() {
    cancelAnimationFrame(this.raf)
    this.ro.disconnect(); this.io.disconnect()
    this.disableGyro()
    this.controls.dispose()
    this.scene.traverse((o) => {
      const mesh = o as THREE.Mesh
      mesh.geometry?.dispose()
      const mat = mesh.material as THREE.Material | THREE.Material[] | undefined
      ;(Array.isArray(mat) ? mat : mat ? [mat] : []).forEach((mm) => mm.dispose())
    })
    this.composer.composer.dispose()
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
