// Ciel, ambiances lumineuses par étape, poussière en suspension et rendu « cinéma ».
import * as THREE from 'three'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'

export interface Mood { top: string; horizon: string; sun: string; sunI: number; hemiI: number; fog: string; dust: number }

/** Une lumière par moment du récit : de l'aube grise à la nuit du départ. */
export const MOODS: Record<string, Mood> = {
  crepuscule: { top: '#2a1d36', horizon: '#d08a64', sun: '#ffc996', sunI: 2.4, hemiI: 1.25, fog: '#b98471', dust: 0.35 },
  aube: { top: '#3b4a66', horizon: '#c9b3a6', sun: '#d9e2ff', sunI: 1.4, hemiI: 1.1, fog: '#9fa4b0', dust: 0.55 },
  matin: { top: '#5f7fa6', horizon: '#e8d6b8', sun: '#fff1d6', sunI: 2.2, hemiI: 1.3, fog: '#c7c0b0', dust: 0.45 },
  couvert: { top: '#6c6f78', horizon: '#b9b4aa', sun: '#e7e3dc', sunI: 1.1, hemiI: 1.45, fog: '#a9a59c', dust: 0.3 },
  soir: { top: '#2c1f3d', horizon: '#e07a4f', sun: '#ff9b62', sunI: 2.6, hemiI: 1.0, fog: '#a8705e', dust: 0.6 },
  nuit: { top: '#0b0d1c', horizon: '#3a3150', sun: '#9fb2ff', sunI: 0.55, hemiI: 0.55, fog: '#2a2536', dust: 0.8 },
}
export const STEP_MOOD = ['aube', 'matin', 'couvert', 'soir', 'nuit']

export class Atmosphere {
  sky: THREE.Mesh
  dust: THREE.Points
  private cur: { top: THREE.Color; horizon: THREE.Color; sun: THREE.Color; fog: THREE.Color; sunI: number; hemiI: number; dust: number }
  private goal: Mood = MOODS.crepuscule

  constructor(private scene: THREE.Scene, private sun: THREE.DirectionalLight, private hemi: THREE.HemisphereLight) {
    const m = MOODS.crepuscule
    this.cur = { top: new THREE.Color(m.top), horizon: new THREE.Color(m.horizon), sun: new THREE.Color(m.sun), fog: new THREE.Color(m.fog), sunI: m.sunI, hemiI: m.hemiI, dust: m.dust }
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(90, 32, 16), new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false,
      uniforms: { top: { value: this.cur.top }, horizon: { value: this.cur.horizon } },
      vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: 'uniform vec3 top; uniform vec3 horizon; varying vec3 vP; void main(){ float h = clamp(vP.y * 1.6 + .08, 0., 1.); gl_FragColor = vec4(mix(horizon, top, pow(h, .7)), 1.); }',
    }))
    scene.add(this.sky)
    scene.fog = new THREE.Fog(this.cur.fog, 24, 75)

    // poussière en suspension autour de la caméra
    const n = 420, pos = new Float32Array(n * 3)
    for (let i = 0; i < n; i++) { pos[i * 3] = (Math.random() - 0.5) * 16; pos[i * 3 + 1] = Math.random() * 6; pos[i * 3 + 2] = (Math.random() - 0.5) * 16 }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    const dot = document.createElement('canvas'); dot.width = dot.height = 32
    const c = dot.getContext('2d')!; const gr = c.createRadialGradient(16, 16, 0, 16, 16, 16)
    gr.addColorStop(0, 'rgba(255,240,220,1)'); gr.addColorStop(1, 'rgba(255,240,220,0)'); c.fillStyle = gr; c.fillRect(0, 0, 32, 32)
    this.dust = new THREE.Points(g, new THREE.PointsMaterial({ size: 0.06, map: new THREE.CanvasTexture(dot), transparent: true, opacity: 0.35, depthWrite: false, blending: THREE.AdditiveBlending }))
    scene.add(this.dust)
  }

  setMood(name: string) { this.goal = MOODS[name] ?? MOODS.crepuscule }

  update(dt: number, t: number, camera: THREE.Camera, reduced: boolean) {
    const k = Math.min(1, dt * 1.2)
    this.cur.top.lerp(new THREE.Color(this.goal.top), k)
    this.cur.horizon.lerp(new THREE.Color(this.goal.horizon), k)
    this.cur.sun.lerp(new THREE.Color(this.goal.sun), k)
    this.cur.fog.lerp(new THREE.Color(this.goal.fog), k)
    this.cur.sunI += (this.goal.sunI - this.cur.sunI) * k
    this.cur.hemiI += (this.goal.hemiI - this.cur.hemiI) * k
    this.cur.dust += (this.goal.dust - this.cur.dust) * k
    this.sun.color.copy(this.cur.sun); this.sun.intensity = this.cur.sunI
    this.hemi.intensity = this.cur.hemiI
    ;(this.scene.fog as THREE.Fog).color.copy(this.cur.fog)
    this.sky.position.copy(camera.position)
    const dm = this.dust.material as THREE.PointsMaterial
    dm.opacity = this.cur.dust
    this.dust.position.set(Math.floor(camera.position.x / 16) * 16, 0, Math.floor(camera.position.z / 16) * 16)
    if (!reduced) {
      const a = this.dust.geometry.attributes.position as THREE.BufferAttribute
      for (let i = 0; i < a.count; i++) {
        let y = a.getY(i) + dt * 0.12 * (0.4 + (i % 7) / 7)
        if (y > 6) y = 0
        a.setY(i, y); a.setX(i, a.getX(i) + Math.sin(t * 0.3 + i) * dt * 0.05)
      }
      a.needsUpdate = true
    }
  }
}

/** Rendu cinéma : halo lumineux, vignette et grain de pellicule. */
export function createComposer(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera, light: boolean) {
  const composer = new EffectComposer(renderer)
  composer.addPass(new RenderPass(scene, camera))
  if (!light) composer.addPass(new UnrealBloomPass(new THREE.Vector2(256, 256), 0.32, 0.55, 0.82))
  const film = new ShaderPass({
    uniforms: { tDiffuse: { value: null }, time: { value: 0 }, amount: { value: 0.045 }, vignette: { value: 0.9 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `uniform sampler2D tDiffuse; uniform float time; uniform float amount; uniform float vignette; varying vec2 vUv;
      float rnd(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233)) + time) * 43758.5453); }
      void main(){ vec4 c = texture2D(tDiffuse, vUv); vec2 d = vUv - .5; float v = smoothstep(.85, .2, length(d) * vignette);
        c.rgb *= mix(.72, 1., v); c.rgb += (rnd(vUv * 900.) - .5) * amount; gl_FragColor = c; }`,
  })
  composer.addPass(film)
  composer.addPass(new OutputPass())
  return { composer, film }
}
