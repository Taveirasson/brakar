import Phaser from 'phaser'
import { SCENE_KEYS } from '../config/sceneKeys'
import { createTextButton } from '../ui/createTextButton'
import { hasSeenIntro } from './IntroScene'
import { ACHIEVEMENTS, loadEarned } from '../run/achievements'
import { activeStreak, dateKey, loadDaily } from '../run/daily'
import { formatTime, loadRecords } from '../run/records'
import { loadMissions, missionStatuses } from '../run/missions'
import { loadWallet } from '../run/wallet'
import { resetNight, setGameMode } from '../run/runState'
import { FONT_FAMILY, addText } from '../ui/theme'
import {
  FIREFLY_TEXTURE,
  createFireflyTexture,
} from '../characters/forestProps'

const MENU_BACKGROUND = 'menu-background'
const GLOW_KEY = 'menu-eye-glow'
const SPARK_KEY = 'menu-fuse-spark'

// Pontos da arte (em px da tela de 960x540) onde ficam os olhos e o pavio do Estouro.
const EYES = [
  { x: 672, y: 183 },
  { x: 735, y: 183 },
]
const FUSE = { x: 772, y: 38 }

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

    this.showRecords()
    this.showMissions()

    const title = addText(this, titleX, 62, 'BRAKAR', 'title')

    this.tweens.add({
      targets: title,
      y: 58,
      duration: 1800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    })
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
      y: 300,
      label: 'INICIAR',
      onClick: () => {
        this.startGame()
      },
    })

    createTextButton({
      scene: this,
      x: buttonsX,
      y: 350,
      label: 'DESAFIO DO DIA',
      onClick: () => {
        resetNight()
        setGameMode('daily')
        this.scene.start(SCENE_KEYS.game)
      },
    })

    createTextButton({
      scene: this,
      x: buttonsX,
      y: 400,
      label: 'SOBREVIVÊNCIA',
      onClick: () => {
        resetNight()
        setGameMode('survival')
        this.scene.start(SCENE_KEYS.game)
      },
    })

    createTextButton({
      scene: this,
      x: buttonsX,
      y: 450,
      label: `LOJA  ·  ${loadWallet().bones} ossos`,
      onClick: () => {
        this.scene.start(SCENE_KEYS.shop)
      },
    })

    createTextButton({
      scene: this,
      x: buttonsX - 55,
      y: 500,
      width: 130,
      fontSize: 18,
      label: 'HISTÓRIA',
      onClick: () => {
        resetNight()
        setGameMode('normal')
        this.scene.start(SCENE_KEYS.intro)
      },
    })

    createTextButton({
      scene: this,
      x: buttonsX + 80,
      y: 500,
      width: 130,
      fontSize: 18,
      label: 'AJUSTES',
      onClick: () => {
        this.openConfigScene()
      },
    })
  }

  /** Ilustração de fundo (cobre a tela inteira) e vagalumes flutuando. */
  private createBackdrop(): void {
    const { width, height } = this.scale

    this.createMenuTextures()

    // fundo, olhos brilhantes e pavio num só contêiner, que "respira" devagar
    const art = this.add.container(width / 2, height / 2)

    art.add(this.add.image(0, 0, MENU_BACKGROUND).setDisplaySize(width, height))

    for (const eye of EYES) {
      const glow = this.add
        .image(eye.x - width / 2, eye.y - height / 2, GLOW_KEY)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setScale(0.55)
        .setAlpha(0.2)

      art.add(glow)
      this.tweens.add({
        targets: glow,
        alpha: { from: 0.15, to: 0.7 },
        scale: { from: 0.45, to: 0.75 },
        duration: 1300,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      })
    }

    this.tweens.add({
      targets: art,
      scale: 1.04,
      duration: 9000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    })

    this.add.particles(FUSE.x, FUSE.y, SPARK_KEY, {
      lifespan: 700,
      speed: { min: 25, max: 70 },
      angle: { min: 200, max: 340 },
      gravityY: 90,
      scale: { start: 1.1, end: 0 },
      alpha: { start: 1, end: 0 },
      frequency: 45,
      blendMode: 'ADD',
    })

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

  /** Recordes no canto da tela de título: dá um motivo para jogar de novo. */
  private showRecords(): void {
    const records = loadRecords()
    const daily = loadDaily()
    const today = dateKey()
    const streak = activeStreak(daily, today)
    const dailyLine = daily.best[today]
      ? `Desafio de hoje: ${formatTime(daily.best[today])}`
      : streak > 0
        ? `Desafio do dia: não perca a sequência (${streak})`
        : 'Desafio do dia: novo labirinto hoje'

    if (records.escapes === 0 && records.caught === 0 && streak === 0) {
      this.addInfoText([dailyLine])
      return
    }

    const lines = [
      `Recorde: noite ${records.bestNight}`,
      records.bestTimeMs
        ? `Melhor fuga: ${formatTime(records.bestTimeMs)}`
        : 'Ainda sem fuga',
      `Fugas: ${records.escapes}  ·  Capturas: ${records.caught}`,
      `Conquistas: ${loadEarned().length}/${ACHIEVEMENTS.length}`,
      streak > 0 ? `🔥 Sequência diária: ${streak}` : '',
      dailyLine,
    ].filter(Boolean)

    this.addInfoText(lines)
  }

  /** Missões do dia no canto superior direito. */
  private showMissions(): void {
    const statuses = missionStatuses(loadMissions())
    const lines = [
      'MISSÕES DO DIA',
      ...statuses.map(({ mission, progress, done }) =>
        done
          ? `✔ ${mission.title}`
          : `· ${mission.title} ${progress}/${mission.target}  (+${mission.reward})`,
      ),
    ]

    this.add
      .text(this.scale.width - 18, 14, lines, {
        fontFamily: FONT_FAMILY,
        fontSize: '14px',
        color: '#f2ead3',
        align: 'right',
        lineSpacing: 6,
        stroke: '#050a07',
        strokeThickness: 4,
      })
      .setOrigin(1, 0)
      .setDepth(5)
  }

  private addInfoText(lines: string[]): void {
    this.add
      .text(18, 14, lines, {
        fontFamily: FONT_FAMILY,
        fontSize: '15px',
        color: '#f2ead3',
        lineSpacing: 6,
        stroke: '#050a07',
        strokeThickness: 4,
      })
      .setDepth(5)
  }

  /** Brilho vermelho dos olhos (gradiente) e faísca do pavio. */
  private createMenuTextures(): void {
    if (!this.textures.exists(GLOW_KEY)) {
      const size = 64
      const texture = this.textures.createCanvas(GLOW_KEY, size, size)
      const context = texture?.getContext()

      if (texture && context) {
        const gradient = context.createRadialGradient(
          size / 2,
          size / 2,
          0,
          size / 2,
          size / 2,
          size / 2,
        )

        gradient.addColorStop(0, 'rgba(255, 120, 100, 0.95)')
        gradient.addColorStop(0.4, 'rgba(255, 50, 50, 0.45)')
        gradient.addColorStop(1, 'rgba(255, 30, 30, 0)')
        context.fillStyle = gradient
        context.fillRect(0, 0, size, size)
        texture.refresh()
        texture.setFilter(Phaser.Textures.FilterMode.LINEAR)
      }
    }

    if (!this.textures.exists(SPARK_KEY)) {
      const graphics = this.make.graphics({ x: 0, y: 0 })

      graphics.fillStyle(0xff9a3c, 0.5)
      graphics.fillCircle(3, 3, 3)
      graphics.fillStyle(0xfff2b0, 1)
      graphics.fillCircle(3, 3, 1.5)
      graphics.generateTexture(SPARK_KEY, 6, 6)
      graphics.destroy()
    }
  }

  private startGame(): void {
    resetNight()
    setGameMode('normal')
    // a história aparece na primeira vez; depois vai direto para o jogo
    this.scene.start(hasSeenIntro() ? SCENE_KEYS.game : SCENE_KEYS.intro)
  }

  private openConfigScene(): void {
    this.scene.stop(SCENE_KEYS.menu)
    this.scene.start(SCENE_KEYS.configuration)
  }
}
