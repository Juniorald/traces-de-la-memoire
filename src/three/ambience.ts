// Ambiance sonore synthétisée (aucun fichier audio) : vent filtré et nappe grave, désactivée par défaut.
let ctx: AudioContext | null = null
let master: GainNode | null = null
let filter: BiquadFilterNode | null = null

export function soundOn() {
  if (!ctx) {
    ctx = new AudioContext()
    master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination)
    // vent : bruit brun filtré, modulé lentement
    const len = ctx.sampleRate * 4, buf = ctx.createBuffer(1, len, ctx.sampleRate), data = buf.getChannelData(0)
    let last = 0
    for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; last = (last + 0.02 * w) / 1.02; data[i] = last * 3.2 }
    const noise = ctx.createBufferSource(); noise.buffer = buf; noise.loop = true
    filter = ctx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 420; filter.Q.value = 0.8
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.07
    const lfoGain = ctx.createGain(); lfoGain.gain.value = 220
    lfo.connect(lfoGain).connect(filter.frequency)
    const wind = ctx.createGain(); wind.gain.value = 0.55
    noise.connect(filter).connect(wind).connect(master)
    // nappe grave, très discrète
    const drone = ctx.createOscillator(); drone.type = 'sine'; drone.frequency.value = 55
    const dg = ctx.createGain(); dg.gain.value = 0.05
    drone.connect(dg).connect(master)
    noise.start(); lfo.start(); drone.start()
  }
  void ctx.resume()
  master!.gain.setTargetAtTime(0.5, ctx.currentTime, 1.2)
}

export function soundOff() {
  if (!ctx || !master) return
  master.gain.setTargetAtTime(0, ctx.currentTime, 0.4)
}

/** Ambiance plus sourde la nuit, plus claire le matin. */
export function soundMood(bright: number) {
  if (ctx && filter) filter.frequency.setTargetAtTime(260 + bright * 420, ctx.currentTime, 1.5)
}
