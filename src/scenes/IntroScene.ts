import Phaser from 'phaser'
import { SCENE_KEYS } from '../config/sceneKeys'
import { sfx } from '../audio/sfx'
import { resetNight } from '../run/runState'
import { FONT_FAMILY, THEME, isTouchDevice } from '../ui/theme'

const INTRO_SEEN_KEY = 'brakar-intro-seen'
const BACKGROUND = 'menu-background'
const TYPE_MS = 28

export function hasSeenIntro(): boolean {
  try {
    return localStorage.getItem(INTRO_SEEN_KEY) === '1'
  } catch {
    return false
  }
}

function markIntroSeen(): void {
  try {
    localStorage.setItem(INTRO_SEEN_KEY, '1')
  } catch {
    // sem armazenamento: a introdução aparece de novo, sem problema
  }
}

interface Slide {
  text: string
  /** Ponto da arte (em px da tela cheia) para onde a câmera "olha". */
  focus: { x: number; y: number }
  zoom: number
  tint: number
}

const SLIDES: Slide[] = [
  {
    text: 'Numa noite de lua cheia, a família levou o Pipoca para passear na mata ao lado da estrada.',
    focus: { x: 430, y: 120 },
    zoom: 1.9,
    tint: 0x9aa8d8,
  },
  {
    text: 'Pipoca seguiu um cheiro pela trilha. Quando levantou a cabeça, o carro já tinha ido embora.',
    focus: { x: 250, y: 370 },
    zoom: 1.7,
    tint: 0xd8b48a,
  },
  {
    text: 'Então algo acendeu na escuridão: dois olhos vermelhos e um pavio aceso. O ESTOURO. Ele não gosta de visitas.',
    focus: { x: 720, y: 200 },
    zoom: 2.1,
    tint: 0xff7a7a,
  },
  {
    text: 'Só os vagalumes iluminam o caminho de volta. Junte 3, ache a estrada... e não deixe o Estouro te alcançar.',
    focus: { x: 480, y: 270 },
    zoom: 1.05,
    tint: 0xffffff,
  },
]

/** Abertura: arte do menu com câmera lenta e texto digitando, uma cena por vez. */
export class IntroScene extends Phaser.Scene {
  private art!: Phaser.GameObjects.Image
  private caption!: Phaser.GameObjects.Text
  private slideIndex = 0
  private typed = ''
  private typer?: Phaser.Time.TimerEvent
  private leaving = false

  constructor() {
    super(SCENE_KEYS.intro)
  }

  preload(): void {
    if (!this.textures.exists(BACKGROUND)) {
      this.load.image(BACKGROUND, 'images/menu.png')
    }
  }

  create(): void {
    const { width, height } = this.scale

    this.slideIndex = 0
    this.leaving = false

    this.cameras.main.setBackgroundColor(0x000000)

    this.art = this.add
      .image(width / 2, height / 2, BACKGROUND)
      .setDisplaySize(width, height)

    // faixa escura embaixo para o texto ficar legível sobre qualquer trecho da arte
    this.add.rectangle(width / 2, height - 70, width, 140, 0x050a07, 0.82)

    this.caption = this.add
      .text(width / 2, height - 70, '', {
        fontFamily: FONT_FAMILY,
        fontSize: '22px',
        color: THEME.text,
        align: 'center',
        wordWrap: { width: width - 120 },
        lineSpacing: 8,
      })
      .setOrigin(0.5)

    this.add
      .text(
        width - 16,
        12,
        isTouchDevice() ? 'TOQUE: avançar' : 'ESPAÇO: avançar · ESC: pular',
        {
          fontFamily: FONT_FAMILY,
          fontSize: '14px',
          color: THEME.muted,
          stroke: '#050a07',
          strokeThickness: 3,
        },
      )
      .setOrigin(1, 0)

    const advance = () => this.advance()

    if (isTouchDevice()) {
      // não há ESC no celular: botão de pular no canto
      this.add
        .text(width - 16, this.scale.height - 14, 'PULAR ▸', {
          fontFamily: FONT_FAMILY,
          fontSize: '18px',
          color: THEME.title,
          stroke: '#050a07',
          strokeThickness: 4,
          padding: { x: 10, y: 8 },
        })
        .setOrigin(1, 1)
        .setDepth(10)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.finish())
    }

    this.input.keyboard?.on('keydown-SPACE', advance)
    this.input.keyboard?.on('keydown-ENTER', advance)
    this.input.keyboard?.on('keydown-ESC', () => this.finish())
    this.input.on(
      'pointerdown',
      (_pointer: Phaser.Input.Pointer, over: unknown[]) => {
        if (over.length === 0) advance()
      },
    )

    this.cameras.main.fadeIn(600, 0, 0, 0)
    this.showSlide()
  }

  private showSlide(): void {
    const slide = SLIDES[this.slideIndex]
    const { width, height } = this.scale

    this.tweens.killTweensOf(this.art)
    this.art.setTint(slide.tint)

    // "câmera" lenta: a arte cresce e desliza até o ponto de foco
    const baseX = width / this.art.width
    const baseY = height / this.art.height
    const targetX = width / 2 - (slide.focus.x - width / 2) * (slide.zoom - 1)
    const targetY = height / 2 - (slide.focus.y - height / 2) * (slide.zoom - 1)

    this.art.setScale(baseX * slide.zoom * 0.9, baseY * slide.zoom * 0.9)
    this.art.setPosition(
      targetX + (slide.focus.x - width / 2) * 0.12,
      targetY + (slide.focus.y - height / 2) * 0.12,
    )
    this.tweens.add({
      targets: this.art,
      scaleX: baseX * slide.zoom,
      scaleY: baseY * slide.zoom,
      x: targetX,
      y: targetY,
      duration: 6000,
      ease: 'Sine.easeOut',
    })

    if (this.slideIndex === 2) {
      sfx.alert()
      this.cameras.main.shake(300, 0.004)
    }

    this.typed = ''
    this.caption.setText('')
    this.typer?.remove()
    this.typer = this.time.addEvent({
      delay: TYPE_MS,
      repeat: slide.text.length - 1,
      callback: () => {
        this.typed = slide.text.slice(0, this.typed.length + 1)
        this.caption.setText(this.typed)
      },
    })
  }

  private advance(): void {
    if (this.leaving) {
      return
    }

    const slide = SLIDES[this.slideIndex]

    // primeiro toque completa o texto; o seguinte passa para a próxima cena
    if (this.typed.length < slide.text.length) {
      this.typer?.remove()
      this.typed = slide.text
      this.caption.setText(slide.text)
      return
    }

    if (this.slideIndex >= SLIDES.length - 1) {
      this.finish()
      return
    }

    this.slideIndex++
    this.showSlide()
  }

  private finish(): void {
    if (this.leaving) {
      return
    }

    this.leaving = true
    markIntroSeen()
    resetNight()

    this.cameras.main.fadeOut(500, 0, 0, 0)
    this.cameras.main.once(
      Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE,
      () => {
        this.scene.start(SCENE_KEYS.game)
      },
    )
  }
}
