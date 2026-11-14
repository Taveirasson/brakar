import Phaser from 'phaser'

export const FIREFLY_TEXTURE = 'firefly'
export const HEADLIGHTS_TEXTURE = 'headlights'

export const FIREFLY_COLOR = 0xd9ff6b
export const HEADLIGHT_COLOR = 0xfff2b0

const FIREFLY_SIZE = 9
const HEADLIGHTS_WIDTH = 22
const HEADLIGHTS_HEIGHT = 8

/** Vagalume: miolo claro com halo, desenhado no código (brilha sozinho no escuro). */
export function createFireflyTexture(scene: Phaser.Scene): void {
  if (scene.textures.exists(FIREFLY_TEXTURE)) {
    return
  }

  const graphics = scene.make.graphics({ x: 0, y: 0 })
  const center = FIREFLY_SIZE / 2

  graphics.fillStyle(FIREFLY_COLOR, 0.25)
  graphics.fillCircle(center, center, 4.5)
  graphics.fillStyle(FIREFLY_COLOR, 0.6)
  graphics.fillCircle(center, center, 3)
  graphics.fillStyle(0xffffe0, 1)
  graphics.fillCircle(center, center, 1.5)

  graphics.generateTexture(FIREFLY_TEXTURE, FIREFLY_SIZE, FIREFLY_SIZE)
  graphics.destroy()
}

/** Os dois faróis do carro da família, vistos de cima na beira da clareira. */
export function createHeadlightsTexture(scene: Phaser.Scene): void {
  if (scene.textures.exists(HEADLIGHTS_TEXTURE)) {
    return
  }

  const graphics = scene.make.graphics({ x: 0, y: 0 })
  const middleY = HEADLIGHTS_HEIGHT / 2

  for (const x of [4, HEADLIGHTS_WIDTH - 4]) {
    graphics.fillStyle(HEADLIGHT_COLOR, 0.35)
    graphics.fillCircle(x, middleY, 4)
    graphics.fillStyle(0xffffff, 1)
    graphics.fillCircle(x, middleY, 2)
  }

  graphics.generateTexture(
    HEADLIGHTS_TEXTURE,
    HEADLIGHTS_WIDTH,
    HEADLIGHTS_HEIGHT,
  )
  graphics.destroy()
}

export const BONE_TEXTURE = 'bone'

/** Osso: recupera o fôlego do Pipoca. Desenhado no código, com contorno escuro. */
export function createBoneTexture(scene: Phaser.Scene): void {
  if (scene.textures.exists(BONE_TEXTURE)) {
    return
  }

  const graphics = scene.make.graphics({ x: 0, y: 0 })

  for (const [color, grow] of [
    [0x2a2118, 1],
    [0xf2ead3, 0],
  ] as const) {
    graphics.fillStyle(color, 1)
    graphics.fillRect(4 - grow, 5 - grow, 10 + grow * 2, 4 + grow * 2)

    for (const [x, y] of [
      [3, 4],
      [3, 10],
      [15, 4],
      [15, 10],
    ]) {
      graphics.fillCircle(x, y, 2.4 + grow)
    }
  }

  graphics.generateTexture(BONE_TEXTURE, 18, 14)
  graphics.destroy()
}

export const GLOW_TEXTURE = 'exit-glow'

/** Halo amarelo macio (gradiente radial) para o farol da saída. */
export function createGlowTexture(scene: Phaser.Scene): void {
  if (scene.textures.exists(GLOW_TEXTURE)) {
    return
  }

  const size = 128
  const texture = scene.textures.createCanvas(GLOW_TEXTURE, size, size)
  const context = texture?.getContext()

  if (!texture || !context) {
    return
  }

  const gradient = context.createRadialGradient(
    size / 2,
    size / 2,
    0,
    size / 2,
    size / 2,
    size / 2,
  )
  gradient.addColorStop(0, 'rgba(255, 242, 176, 0.95)')
  gradient.addColorStop(0.35, 'rgba(255, 220, 120, 0.45)')
  gradient.addColorStop(1, 'rgba(255, 200, 80, 0)')
  context.fillStyle = gradient
  context.fillRect(0, 0, size, size)
  texture.refresh()
  // filtro linear: com pixelArt o gradiente ampliado formaria anéis
  texture.setFilter(Phaser.Textures.FilterMode.LINEAR)
}

export function powerUpTextureKey(id: string): string {
  return `powerup-${id}`
}

/** Orbes brilhantes dos power-ups, com o símbolo de cada um desenhado em branco. */
export function createPowerUpTextures(
  scene: Phaser.Scene,
  powerUps: Array<{ id: string; color: number }>,
): void {
  const symbols: Record<string, Array<[number, number]>> = {
    shield: [
      [12, 5],
      [18, 7],
      [18, 13],
      [12, 19],
      [6, 13],
      [6, 7],
    ],
    speed: [
      [13, 4],
      [8, 13],
      [12, 13],
      [10, 20],
      [17, 10],
      [13, 10],
    ],
    map: [
      [12, 4],
      [16, 12],
      [12, 20],
      [8, 12],
    ],
  }

  for (const powerUp of powerUps) {
    const key = powerUpTextureKey(powerUp.id)

    if (scene.textures.exists(key)) {
      continue
    }

    const graphics = scene.make.graphics({ x: 0, y: 0 })

    graphics.fillStyle(powerUp.color, 0.22)
    graphics.fillCircle(12, 12, 12)
    graphics.fillStyle(powerUp.color, 0.55)
    graphics.fillCircle(12, 12, 9)
    graphics.fillStyle(0x0b1410, 0.85)
    graphics.fillCircle(12, 12, 7.5)
    graphics.fillStyle(0xffffff, 1)
    graphics.fillPoints(
      (symbols[powerUp.id] ?? symbols.map).map(
        ([x, y]) => new Phaser.Math.Vector2(x, y),
      ),
      true,
    )
    graphics.generateTexture(key, 24, 24)
    graphics.destroy()
  }
}
