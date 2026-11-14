/** Efeitos sonoros sintetizados com Web Audio (sem arquivos); M liga/desliga. */
const STORAGE_KEY = 'brakar-muted'

let context: AudioContext | null = null
let muted = readMuted()
let drone: { osc: OscillatorNode; gain: GainNode } | null = null

function readMuted(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

function audio(): AudioContext | null {
  if (muted) return null

  try {
    context ??= new AudioContext()

    if (context.state === 'suspended') {
      void context.resume()
    }

    return context
  } catch {
    return null
  }
}

function tone(
  frequency: number,
  duration: number,
  options: {
    type?: OscillatorType
    volume?: number
    delay?: number
    slideTo?: number
  } = {},
): void {
  const ctx = audio()

  if (!ctx) return

  const start = ctx.currentTime + (options.delay ?? 0)
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()

  osc.type = options.type ?? 'sine'
  osc.frequency.setValueAtTime(frequency, start)

  if (options.slideTo) {
    osc.frequency.exponentialRampToValueAtTime(
      options.slideTo,
      start + duration,
    )
  }

  gain.gain.setValueAtTime(0.0001, start)
  gain.gain.exponentialRampToValueAtTime(options.volume ?? 0.15, start + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)

  osc.connect(gain).connect(ctx.destination)
  osc.start(start)
  osc.stop(start + duration + 0.05)
}

export function isMuted(): boolean {
  return muted
}

export function toggleMuted(): boolean {
  muted = !muted

  try {
    localStorage.setItem(STORAGE_KEY, muted ? '1' : '0')
  } catch {
    // sem armazenamento: vale só nesta sessão
  }

  if (muted) stopDrone()

  return muted
}

export const sfx = {
  /** Vagalume ou osso coletado. */
  pickup(): void {
    tone(660, 0.12, { type: 'triangle', volume: 0.12 })
    tone(990, 0.18, { type: 'triangle', volume: 0.12, delay: 0.08 })
  },
  /** Última peça: o farol acende. */
  unlock(): void {
    ;[523, 659, 784, 1047].forEach((f, i) =>
      tone(f, 0.25, { type: 'triangle', volume: 0.13, delay: i * 0.1 }),
    )
  },
  /** Moita: farfalhar curto. */
  rustle(): void {
    tone(220, 0.15, { type: 'sawtooth', volume: 0.04, slideTo: 120 })
  },
  /** Susto da captura. */
  caught(): void {
    tone(180, 0.7, { type: 'sawtooth', volume: 0.2, slideTo: 40 })
    tone(90, 0.8, { type: 'square', volume: 0.12, slideTo: 30 })
  },
  victory(): void {
    ;[392, 494, 587, 784].forEach((f, i) =>
      tone(f, 0.35, { type: 'triangle', volume: 0.14, delay: i * 0.14 }),
    )
  },
  /** Um batimento (dois toques graves). */
  heartbeat(strength: number): void {
    const volume = 0.08 + 0.18 * strength

    tone(70, 0.14, { volume, slideTo: 45 })
    tone(60, 0.16, { volume: volume * 0.8, delay: 0.17, slideTo: 40 })
  },
  /** Zumbido grave contínuo da mata à noite. */
  startDrone(): void {
    const ctx = audio()

    if (!ctx || drone) return

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sine'
    osc.frequency.value = 55
    gain.gain.value = 0.0001
    gain.gain.exponentialRampToValueAtTime(0.035, ctx.currentTime + 2)
    osc.connect(gain).connect(ctx.destination)
    osc.start()
    drone = { osc, gain }
  },
  stopDrone,
}

function stopDrone(): void {
  if (!drone || !context) return

  const { osc, gain } = drone

  gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.4)
  osc.stop(context.currentTime + 0.5)
  drone = null
}
