import Phaser from 'phaser'
import {
  CHARACTER_FRAME_SIZE,
  ESTOURO_TEXTURE,
  PIPOCA_TEXTURE,
  type AnimationDefinition,
} from './characterAnimationRules'

export function loadCharacterSprites(scene: Phaser.Scene): void {
  const frameConfig = {
    frameWidth: CHARACTER_FRAME_SIZE,
    frameHeight: CHARACTER_FRAME_SIZE,
  }

  scene.load.spritesheet(
    PIPOCA_TEXTURE,
    'assets/sprites/pipoca.png',
    frameConfig,
  )
  scene.load.spritesheet(
    ESTOURO_TEXTURE,
    'assets/sprites/estouro.png',
    frameConfig,
  )
}

/**
 * Registra as animações da spritesheet uma única vez (elas são globais no jogo).
 * Retorna `false` se a spritesheet não carregou, para quem chamou usar a forma provisória.
 */
export function ensureAnimations(
  scene: Phaser.Scene,
  texture: string,
  definitions: AnimationDefinition[],
): boolean {
  if (!scene.textures.exists(texture)) {
    return false
  }

  for (const { key, start, end, frameRate } of definitions) {
    if (scene.anims.exists(key)) {
      continue
    }

    scene.anims.create({
      key,
      frames: scene.anims.generateFrameNumbers(texture, { start, end }),
      frameRate,
      repeat: -1,
    })
  }

  return true
}
