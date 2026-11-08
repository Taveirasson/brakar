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

/**
 * Efeitos visuais do jogo, fora do GameScene: vinheta, pulso vermelho durante a
 * caçada, poeira nas patas do Pipoca, vagalumes de enfeite e faíscas do Estouro.
 */
export class GameEffects {
  private readonly dust: Phaser.GameObjects.Particles.ParticleEmitter
  private readonly huntVignette: Phaser.Filters.Vignette
  private huntPulse?: Phaser.Tweens.Tween
  private hunterSparks?: Phaser.GameObjects.Particles.ParticleEmitter
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
  }

  update(hunterIsHunting: boolean): void {
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
