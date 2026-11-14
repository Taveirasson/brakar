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
