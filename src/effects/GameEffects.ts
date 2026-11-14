import Phaser from 'phaser'
import { loadWallet } from '../run/wallet'
import { trailStyle } from '../run/shopItems'
import { TRAIL_TEXTURE_KEYS, trailEmitterConfig } from './trail'
import {
  FIREFLY_TEXTURE,
  createFireflyTexture,
} from '../characters/forestProps'

const DUST_TEXTURE = 'dust'
const SPARK_TEXTURE = 'spark'

// Abaixo disso o Pipoca está parado (só deslizando pelo drag): sem poeira.
const DUST_MIN_SPEED = 40

const AMBIENT_FIREFLIES = 14

const RAY_TEXTURE = 'moon-ray'
const MOON_RAYS = 9
const RAY_COLOR = 0xb4c4ff

const FOG_TEXTURE = 'fog'
const LEAF_TEXTURE = 'leaf'
const FOG_PUFFS = 20
const LEAF_COLORS = [0x4f8a3a, 0x6aa84f, 0x8a6a2a, 0xa8863a]

const HUNTER_GLOW_RADIUS = 80
const HUNTER_GLOW_COLOR = 0xff5a2a
const HUNTER_GLOW_IDLE = 0.8
const HUNTER_GLOW_HUNTING = 1.9

// Vinheta do Phaser: dentro do raio a cor entra com sin(d/raio · π · strength) e
// fora do raio é 100% cor. Raio 1 cobre a tela toda (cantos a ~0,71), então
// strength 0 desliga de verdade e valores pequenos escurecem só as bordas.
const VIGNETTE_RADIUS = 1
const DARK_VIGNETTE_STRENGTH = 0.28
const HUNT_PULSE_MS = 650
const HUNT_PULSE_MIN = 0.06
const HUNT_PULSE_MAX = 0.26

function createDotTexture(
  scene: Phaser.Scene,
  key: string,
  size: number,
  color: number,
): void {
  if (scene.textures.exists(key)) {
    return
  }

  const graphics = scene.make.graphics({ x: 0, y: 0 })
  graphics.fillStyle(color, 0.5)
  graphics.fillCircle(size / 2, size / 2, size / 2)
  graphics.fillStyle(color, 1)
  graphics.fillCircle(size / 2, size / 2, size / 4)
  graphics.generateTexture(key, size, size)
  graphics.destroy()
}

/** Mancha macia e translúcida (névoa): gradiente radial desenhado num canvas. */
function createFogTexture(scene: Phaser.Scene): void {
  if (scene.textures.exists(FOG_TEXTURE)) {
    return
  }

  const size = 128
  const texture = scene.textures.createCanvas(FOG_TEXTURE, size, size)
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
  gradient.addColorStop(0, 'rgba(190, 205, 235, 0.9)')
  gradient.addColorStop(1, 'rgba(190, 205, 235, 0)')
  context.fillStyle = gradient
  context.fillRect(0, 0, size, size)
  texture.refresh()
  texture.setFilter(Phaser.Textures.FilterMode.LINEAR)
}

/** Feixe de luz da lua: faixa vertical que some nas bordas e nas pontas. */
function createRayTexture(scene: Phaser.Scene): void {
  if (scene.textures.exists(RAY_TEXTURE)) {
    return
  }

  const width = 64
  const height = 256
  const texture = scene.textures.createCanvas(RAY_TEXTURE, width, height)
  const context = texture?.getContext()

  if (!texture || !context) {
    return
  }

  const sides = context.createLinearGradient(0, 0, width, 0)
  sides.addColorStop(0, 'rgba(255,255,255,0)')
  sides.addColorStop(0.5, 'rgba(255,255,255,1)')
  sides.addColorStop(1, 'rgba(255,255,255,0)')
  context.fillStyle = sides
  context.fillRect(0, 0, width, height)

  // some nas pontas: mantém só o que a máscara vertical deixa passar
  context.globalCompositeOperation = 'destination-in'

  const ends = context.createLinearGradient(0, 0, 0, height)
  ends.addColorStop(0, 'rgba(0,0,0,0)')
  ends.addColorStop(0.3, 'rgba(0,0,0,1)')
  ends.addColorStop(0.7, 'rgba(0,0,0,1)')
  ends.addColorStop(1, 'rgba(0,0,0,0)')
  context.fillStyle = ends
  context.fillRect(0, 0, width, height)

  texture.refresh()
  texture.setFilter(Phaser.Textures.FilterMode.LINEAR)
}

/** Folha pequena (elipse); a cor vem do tint de cada partícula. */
function createLeafTexture(scene: Phaser.Scene): void {
  if (scene.textures.exists(LEAF_TEXTURE)) {
    return
  }

  const graphics = scene.make.graphics({ x: 0, y: 0 })

  graphics.fillStyle(0xffffff, 1)
  graphics.fillEllipse(4, 2.5, 7, 4)
  graphics.fillStyle(0xcccccc, 1)
  graphics.fillRect(1, 2, 6, 1)
  graphics.generateTexture(LEAF_TEXTURE, 8, 5)
  graphics.destroy()
}

/**
 * Efeitos visuais do jogo, fora do GameScene: vinheta, pulso vermelho durante a
 * caçada, poeira nas patas do Pipoca, vagalumes de enfeite e faíscas do Estouro.
 */
export class GameEffects {
  private readonly dust: Phaser.GameObjects.Particles.ParticleEmitter
  private readonly huntVignette: Phaser.Filters.Vignette
  private huntPulse?: Phaser.Tweens.Tween
  private hunterSparks?: Phaser.GameObjects.Particles.ParticleEmitter
  private hunterGlow?: Phaser.GameObjects.Light
  private hunterSprite?: Phaser.GameObjects.Sprite
  private hunting = false

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly player: Phaser.Physics.Arcade.Sprite,
    private readonly hiddenFrom: Phaser.Cameras.Scene2D.Camera,
    worldPixels: number,
  ) {
    createDotTexture(scene, DUST_TEXTURE, 6, 0x8a7356)
    createDotTexture(scene, SPARK_TEXTURE, 4, 0xffb43c)
    createFireflyTexture(scene)
    createLeafTexture(scene)

    const camera = scene.cameras.main
    camera.filters.external.addVignette(
      0.5,
      0.5,
      VIGNETTE_RADIUS,
      DARK_VIGNETTE_STRENGTH,
      0x000000,
    )
    this.huntVignette = camera.filters.external.addVignette(
      0.5,
      0.5,
      VIGNETTE_RADIUS,
      0,
      0xb3122e,
    )

    // rastro das patas: o estilo vem da loja (poeira, folhas, brasas, estrelas)
    const style = trailStyle(loadWallet().trail)

    this.dust = scene.add.particles(0, 0, TRAIL_TEXTURE_KEYS[style.texture], {
      ...trailEmitterConfig(style),
      follow: player,
      followOffset: { x: 0, y: 5 },
      emitting: false,
    })
    this.dust.setDepth(9)
    this.hide(this.dust)

    const ambient = scene.add.particles(0, 0, FIREFLY_TEXTURE, {
      x: { min: 0, max: worldPixels },
      y: { min: 0, max: worldPixels },
      lifespan: 5000,
      speedX: { min: -8, max: 8 },
      speedY: { min: -8, max: 8 },
      scale: { min: 0.35, max: 0.6 },
      alpha: { values: [0, 0.9, 0.3, 0.9, 0] },
      frequency: 5000 / AMBIENT_FIREFLIES,
      maxAliveParticles: AMBIENT_FIREFLIES,
    })
    ambient.setDepth(8)
    this.hide(ambient)

    this.createAtmosphere(worldPixels)
  }

  /** Névoa rasteira e folhas caindo em volta do Pipoca, para a mata parecer viva. */
  private createAtmosphere(worldPixels: number): void {
    createFogTexture(this.scene)
    createLeafTexture(this.scene)
    createRayTexture(this.scene)

    // raios de lua entrando pela copa das árvores: faixas inclinadas que respiram
    for (let i = 0; i < MOON_RAYS; i++) {
      const ray = this.scene.add
        .image(
          Phaser.Math.Between(0, worldPixels),
          Phaser.Math.Between(0, worldPixels),
          RAY_TEXTURE,
        )
        .setDepth(11)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setTint(RAY_COLOR)
        .setAngle(Phaser.Math.Between(18, 28))
        .setScale(
          Phaser.Math.FloatBetween(1.2, 2.4),
          Phaser.Math.FloatBetween(1.6, 2.6),
        )
        .setAlpha(0)

      this.hide(ray)
      this.scene.tweens.add({
        targets: ray,
        alpha: { from: 0.02, to: Phaser.Math.FloatBetween(0.16, 0.28) },
        x: ray.x + Phaser.Math.Between(-25, 25),
        duration: Phaser.Math.Between(3500, 6500),
        delay: Phaser.Math.Between(0, 3000),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      })
    }

    const fog = this.scene.add.particles(0, 0, FOG_TEXTURE, {
      x: { min: 0, max: worldPixels },
      y: { min: 0, max: worldPixels },
      lifespan: 16000,
      speedX: { min: 5, max: 12 },
      speedY: { min: -2, max: 2 },
      scale: { min: 1.8, max: 3 },
      alpha: { values: [0, 0.17, 0.17, 0] },
      frequency: 16000 / FOG_PUFFS,
      maxAliveParticles: FOG_PUFFS,
    })
    fog.setDepth(12)
    this.hide(fog)

    const leaves = this.scene.add.particles(0, 0, LEAF_TEXTURE, {
      follow: this.player,
      x: { min: -260, max: 260 },
      y: { min: -190, max: -70 },
      lifespan: 5200,
      speedY: { min: 14, max: 30 },
      speedX: { min: -14, max: 14 },
      rotate: { min: 0, max: 360 },
      scale: { min: 0.45, max: 0.8 },
      tint: LEAF_COLORS,
      alpha: { values: [0, 0.9, 0.9, 0] },
      frequency: 420,
      maxAliveParticles: 14,
    })
    leaves.setDepth(13)
    this.hide(leaves)
  }

  /** Faíscas que seguem o Estouro; chamado quando ele surge no apagão. */
  attachHunter(hunter: Phaser.GameObjects.Sprite): void {
    this.hunterSparks = this.scene.add.particles(0, 0, SPARK_TEXTURE, {
      follow: hunter,
      lifespan: 450,
      speed: { min: 10, max: 35 },
      gravityY: -20,
      scale: { start: 1, end: 0 },
      alpha: { start: 1, end: 0 },
      frequency: 140,
    })
    this.hunterSparks.setDepth(10)
    this.hide(this.hunterSparks)

    // brilho vermelho do pavio: ilumina o chão e as árvores por onde ele passa
    this.hunterSprite = hunter
    this.hunterGlow = this.scene.lights.addLight(
      hunter.x,
      hunter.y,
      HUNTER_GLOW_RADIUS,
      HUNTER_GLOW_COLOR,
      HUNTER_GLOW_IDLE,
    )
  }

  update(hunterIsHunting: boolean): void {
    if (this.hunterGlow && this.hunterSprite?.active) {
      const flicker = 1 + 0.15 * Math.sin(this.scene.time.now / 90)

      this.hunterGlow.setPosition(this.hunterSprite.x, this.hunterSprite.y)
      this.hunterGlow.setIntensity(
        (hunterIsHunting ? HUNTER_GLOW_HUNTING : HUNTER_GLOW_IDLE) * flicker,
      )
    }

    const body = this.player.body
    const speed = body ? body.velocity.length() : 0
    this.dust.emitting = speed > DUST_MIN_SPEED

    if (hunterIsHunting !== this.hunting) {
      this.setHunting(hunterIsHunting)
    }
  }

  /** Para os efeitos contínuos (fim de jogo). */
  stop(): void {
    this.dust.emitting = false
    this.setHunting(false)
  }

  private setHunting(hunting: boolean): void {
    this.hunting = hunting

    if (this.hunterSparks) {
      this.hunterSparks.frequency = hunting ? 35 : 140
    }

    this.huntPulse?.stop()
    this.huntPulse = undefined

    if (!hunting) {
      this.huntVignette.strength = 0
      return
    }

    this.huntPulse = this.scene.tweens.add({
      targets: this.huntVignette,
      strength: { from: HUNT_PULSE_MIN, to: HUNT_PULSE_MAX },
      duration: HUNT_PULSE_MS,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    })
  }

  private hide(object: Phaser.GameObjects.GameObject): void {
    this.hiddenFrom.ignore(object)
  }
}
