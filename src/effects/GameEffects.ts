import Phaser from 'phaser'
import {
  FIREFLY_TEXTURE,
  createFireflyTexture,
} from '../characters/forestProps'

const DUST_TEXTURE = 'dust'
const SPARK_TEXTURE = 'spark'

// Abaixo disso o Pipoca está parado (só deslizando pelo drag): sem poeira.
const DUST_MIN_SPEED = 40

const AMBIENT_FIREFLIES = 14

const SHADOW_TEXTURE = 'shadow'
const SHADOW_ALPHA = 0.6
const PLAYER_SHADOW = { width: 26, height: 10, offsetY: 13 }
const HUNTER_SHADOW = { width: 19, height: 8, offsetY: 9 }

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

/** Elipse escura e macia para a sombra no chão sob os personagens. */
function createShadowTexture(scene: Phaser.Scene): void {
  if (scene.textures.exists(SHADOW_TEXTURE)) {
    return
  }

  const graphics = scene.make.graphics({ x: 0, y: 0 })

  graphics.fillStyle(0x000000, 0.35)
  graphics.fillEllipse(16, 8, 32, 16)
  graphics.fillStyle(0x000000, 0.65)
  graphics.fillEllipse(16, 8, 22, 10)
  graphics.generateTexture(SHADOW_TEXTURE, 32, 16)
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
  private playerShadow?: Phaser.GameObjects.Image
  private hunterShadow?: Phaser.GameObjects.Image
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

    this.dust = scene.add.particles(0, 0, DUST_TEXTURE, {
      follow: player,
      followOffset: { x: 0, y: 5 },
      lifespan: 380,
      speed: { min: 4, max: 14 },
      scale: { start: 0.9, end: 0.2 },
      alpha: { start: 0.55, end: 0 },
      frequency: 70,
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

    createShadowTexture(scene)
    this.playerShadow = this.makeShadow(PLAYER_SHADOW, 9)

    this.createAtmosphere(worldPixels)
  }

  private makeShadow(
    size: { width: number; height: number },
    depth: number,
  ): Phaser.GameObjects.Image {
    const shadow = this.scene.add
      .image(0, 0, SHADOW_TEXTURE)
      .setDisplaySize(size.width, size.height)
      .setDepth(depth)
      .setAlpha(SHADOW_ALPHA)

    this.hide(shadow)

    return shadow
  }

  /** Névoa rasteira e folhas caindo em volta do Pipoca, para a mata parecer viva. */
  private createAtmosphere(worldPixels: number): void {
    createFogTexture(this.scene)
    createLeafTexture(this.scene)

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

    this.hunterShadow = this.makeShadow(HUNTER_SHADOW, 8)

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
    this.playerShadow
      ?.setPosition(this.player.x, this.player.y + PLAYER_SHADOW.offsetY)
      .setAlpha(SHADOW_ALPHA * this.player.alpha)

    if (this.hunterShadow && this.hunterSprite?.active) {
      this.hunterShadow.setPosition(
        this.hunterSprite.x,
        this.hunterSprite.y + HUNTER_SHADOW.offsetY,
      )
    }

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
