import Phaser from 'phaser'
import type { TrailStyle } from '../run/shopItems'

/** Chaves das texturas usadas pelos rastros (criadas em GameEffects / forestProps). */
export const TRAIL_TEXTURE_KEYS: Record<TrailStyle['texture'], string> = {
  dust: 'dust',
  leaf: 'leaf',
  spark: 'spark',
  firefly: 'firefly',
}

/** Configuração do emissor de partículas das patas para o estilo escolhido na loja. */
export function trailEmitterConfig(
  style: TrailStyle,
): Phaser.Types.GameObjects.Particles.ParticleEmitterConfig {
  const base = style.scale

  return {
    lifespan: style.rise ? 700 : 380,
    speed: { min: 4, max: 14 },
    gravityY: style.rise ? -35 : 0,
    scale: { start: 0.9 * base, end: style.rise ? 0 : 0.2 * base },
    alpha: { start: style.texture === 'dust' ? 0.55 : 0.9, end: 0 },
    rotate: style.texture === 'leaf' ? { min: 0, max: 360 } : undefined,
    tint: style.tint,
    blendMode: style.rise ? 'ADD' : 'NORMAL',
    frequency: style.rise ? 55 : 70,
  }
}
