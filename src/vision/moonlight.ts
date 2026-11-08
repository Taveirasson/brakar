/** Iluminação do mundo depois do apagão. */
export interface WorldLighting {
  /** Cor da luz ambiente (afeta árvores, chão e o Estouro). */
  ambientColor: number
  /** Quanto do mundo aparece fora da lanterna (alfa da máscara de visão). */
  worldVisibility: number
  /** Raio (px) em volta do Pipoca que fica bem visível. */
  visionRadius: number
}

/** Lanterna acesa: o cone ilumina e o resto fica escuro. */
export const DARK_LIGHTING: WorldLighting = {
  ambientColor: 0x40334f,
  worldVisibility: 0.45,
  visionRadius: 28,
}

/** Lanterna apagada: luz da lua, fria e mais clara, para enxergar em volta. */
export const MOON_LIGHTING: WorldLighting = {
  ambientColor: 0x8496c4,
  worldVisibility: 0.76,
  visionRadius: 90,
}

const lerp = (from: number, to: number, t: number) => from + (to - from) * t

function lerpColor(from: number, to: number, t: number): number {
  let color = 0

  for (const shift of [16, 8, 0]) {
    const channel = Math.round(
      lerp((from >> shift) & 0xff, (to >> shift) & 0xff, t),
    )
    color |= channel << shift
  }

  return color
}

/** Iluminação para um nível de lua entre 0 (lanterna acesa) e 1 (lua cheia). */
export function moonlightAt(level: number): WorldLighting {
  const t = Math.min(1, Math.max(0, level))

  if (t === 0) return { ...DARK_LIGHTING }
  if (t === 1) return { ...MOON_LIGHTING }

  return {
    ambientColor: lerpColor(
      DARK_LIGHTING.ambientColor,
      MOON_LIGHTING.ambientColor,
      t,
    ),
    worldVisibility: lerp(
      DARK_LIGHTING.worldVisibility,
      MOON_LIGHTING.worldVisibility,
      t,
    ),
    visionRadius: lerp(
      DARK_LIGHTING.visionRadius,
      MOON_LIGHTING.visionRadius,
      t,
    ),
  }
}
