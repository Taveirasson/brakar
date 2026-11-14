import Phaser from 'phaser'
import { SCENE_KEYS } from '../config/sceneKeys'
import { createTextButton } from '../ui/createTextButton'
import { resetNight } from '../run/runState'
import { addText } from '../ui/theme'
import {
  FIREFLY_TEXTURE,
  createFireflyTexture,
} from '../characters/forestProps'

const MENU_BACKGROUND = 'menu-background'

export class MenuScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.menu)
  }

  preload(): void {
    this.load.image(MENU_BACKGROUND, 'images/menu.png')
  }

  create(): void {
    this.createBackdrop()

    // a arte ocupa a esquerda com o Pipoca; título no céu escuro e botões
    // no caminho de terra à direita, longe do cachorro e da bomba
    const titleX = 600
    const buttonsX = 660

    addText(this, titleX, 62, 'BRAKAR', 'title')
    addText(
      this,
      titleX,
      112,
      'Ajude o Pipoca a voltar para casa',
      'body',
    ).setStroke('#050a07', 5)

    createTextButton({
      scene: this,
      x: buttonsX,
      y: 400,
      label: 'INICIAR',
      onClick: () => {
        this.startGame()
      },
    })

    createTextButton({
      scene: this,
      x: buttonsX,
      y: 462,
      label: 'CONFIGURAÇÕES',
      onClick: () => {
        this.openConfigScene()
      },
    })
  }

  /** Ilustração de fundo (cobre a tela inteira) e vagalumes flutuando. */
  private createBackdrop(): void {
    const { width, height } = this.scale

    this.add
      .image(width / 2, height / 2, MENU_BACKGROUND)
      .setDisplaySize(width, height)

    createFireflyTexture(this)
    this.add.particles(0, 0, FIREFLY_TEXTURE, {
      x: { min: 0, max: width },
      y: { min: 0, max: height },
      lifespan: 4000,
      speedX: { min: -12, max: 12 },
      speedY: { min: -14, max: 6 },
      scale: { min: 0.6, max: 1.1 },
      alpha: { values: [0, 1, 0.4, 1, 0] },
      frequency: 260,
      maxAliveParticles: 22,
    })
  }

  private startGame(): void {
    resetNight()
    this.scene.start(SCENE_KEYS.game)
  }

  private openConfigScene(): void {
    this.scene.stop(SCENE_KEYS.menu)
    this.scene.start(SCENE_KEYS.configuration)
  }
}
