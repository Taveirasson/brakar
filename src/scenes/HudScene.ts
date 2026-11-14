import Phaser from 'phaser'
import { SCENE_KEYS } from '../config/sceneKeys'
import { formatTime } from '../run/records'
import { sfx } from '../audio/sfx'
import {
  joystickDirection,
  resetTouchInput,
  touchInput,
} from '../input/touchInput'
import { FONT_FAMILY, THEME } from '../ui/theme'

const VIGNETTE_TEXTURE = 'danger-vignette'

const JOYSTICK = { x: 120, y: 420, radius: 62, knob: 26 }
const PAUSE_BUTTON_Y = 130
const SPRINT_BUTTON = { x: 840, y: 430, radius: 46 }

/** Camada fixa por cima do jogo: cronômetro, vagalumes e vinheta de perigo. */
export class HudScene extends Phaser.Scene {
  private timer!: Phaser.GameObjects.Text
  private fireflies!: Phaser.GameObjects.Text
  private nightLabel!: Phaser.GameObjects.Text
  private vignette!: Phaser.GameObjects.Image
  private staminaBar!: Phaser.GameObjects.Graphics
  private staminaValue = 1
  private staminaExhausted = false
  private hiddenLabel!: Phaser.GameObjects.Text
  private tutorialLabel?: Phaser.GameObjects.Text
  private compass?: Phaser.GameObjects.Triangle
  private modifierLabel!: Phaser.GameObjects.Text
  private powerUpLabel!: Phaser.GameObjects.Text
  private danger = 0
  private nextBeatAt = 0
  private touchEnabled = false

  constructor() {
    super(SCENE_KEYS.hud)
  }

  create(): void {
    this.danger = 0
    this.nextBeatAt = 0
    resetTouchInput()
    this.touchEnabled = false
    this.createVignetteTexture()

    this.vignette = this.add
      .image(0, 0, VIGNETTE_TEXTURE)
      .setOrigin(0)
      .setDisplaySize(this.scale.width, this.scale.height)
      .setAlpha(0)

    const style = {
      fontFamily: FONT_FAMILY,
      fontSize: '20px',
      color: THEME.text,
      stroke: '#050a07',
      strokeThickness: 4,
    }

    this.timer = this.add.text(16, 12, '0:00.0', style)
    this.nightLabel = this.add.text(16, 62, '', {
      ...style,
      fontSize: '16px',
      color: THEME.muted,
    })
    this.staminaBar = this.add.graphics()
    const isTouch = this.sys.game.device.input.touch

    this.add.text(
      16,
      86,
      isTouch
        ? 'moitas escondem  ·  ossos dão fôlego'
        : 'SHIFT: correr  ·  moitas escondem  ·  M: som',
      {
        ...style,
        fontSize: '13px',
        strokeThickness: 3,
        color: THEME.muted,
      },
    )
    if (this.sys.game.device.input.touch) {
      this.enableTouchControls()
    }

    this.modifierLabel = this.add.text(16, 124, '', {
      ...style,
      fontSize: '14px',
      strokeThickness: 3,
      color: '#ffd36a',
    })
    this.powerUpLabel = this.add.text(16, 146, '', {
      ...style,
      fontSize: '16px',
      strokeThickness: 3,
      color: '#9fe0ff',
    })
    this.hiddenLabel = this.add
      .text(this.scale.width / 2, this.scale.height - 40, 'ESCONDIDO', {
        ...style,
        color: '#9fe870',
      })
      .setOrigin(0.5)
      .setAlpha(0)
    this.compass = this.add
      .triangle(0, 0, -9, 9, 0, -11, 9, 9, 0xd9ff6b, 0.85)
      .setStrokeStyle(2, 0x050a07, 0.8)
      .setAlpha(0)
    this.tweens.add({
      targets: this.compass,
      scale: { from: 0.85, to: 1.15 },
      duration: 500,
      yoyo: true,
      repeat: -1,
    })
    this.tutorialLabel = this.add
      .text(this.scale.width / 2, 70, '', {
        ...style,
        color: '#ffd36a',
        align: 'center',
      })
      .setOrigin(0.5)
      .setAlpha(0)
    this.fireflies = this.add.text(16, 38, '', {
      ...style,
      color: THEME.title,
    })
  }

  update(time: number): void {
    // pulsa como batimento quanto mais perto o Estouro está
    const pulse = 0.75 + 0.25 * Math.sin(time / (260 - this.danger * 120))

    this.vignette?.setAlpha(this.danger * pulse)

    if (this.danger > 0.15 && time >= this.nextBeatAt) {
      sfx.heartbeat(this.danger)
      this.nextBeatAt = time + 1100 - this.danger * 600
    }
  }

  setTime(ms: number): void {
    this.timer?.setText(formatTime(ms))
  }

  setStamina(value: number, exhausted: boolean): void {
    this.staminaValue = value
    this.staminaExhausted = exhausted
    this.drawStamina()
  }

  private drawStamina(): void {
    const bar = this.staminaBar

    if (!bar) {
      return
    }

    const width = 110
    const color = this.staminaExhausted ? 0xc0504f : 0x9fe870

    bar.clear()
    bar.fillStyle(0x050a07, 0.7)
    bar.fillRoundedRect(16, 106, width + 4, 10, 4)
    bar.fillStyle(color, 1)
    bar.fillRoundedRect(18, 108, Math.max(0, width * this.staminaValue), 6, 3)
  }

  setPowerUps(shield: boolean, speedLeftMs: number): void {
    const parts: string[] = []

    if (shield) parts.push('ESCUDO')
    if (speedLeftMs > 0) {
      parts.push(`PATA VELOZ ${Math.ceil(speedLeftMs / 1000)}s`)
    }

    this.powerUpLabel?.setText(parts.join('   '))
  }

  setModifiers(names: string[]): void {
    this.modifierLabel?.setText(
      names.length > 0 ? `⚠ ${names.join('  ·  ')}` : '',
    )
  }

  /** Seta na borda da área de jogo apontando para o alvo (ângulo em radianos); null esconde. */
  setCompass(angle: number | null, color = 0xd9ff6b): void {
    if (!this.compass) return

    if (angle === null) {
      this.compass.setAlpha(0)

      return
    }

    const radius = Math.min(this.scale.width, this.scale.height) * 0.3

    this.compass
      .setPosition(
        this.scale.width / 2 + Math.cos(angle) * radius,
        this.scale.height / 2 + Math.sin(angle) * radius,
      )
      .setRotation(angle + Math.PI / 2)
      .setFillStyle(color, 0.85)
      .setAlpha(1)
  }

  /** Passo do tutorial no alto da tela; null esconde. */
  setTutorial(text: string | null): void {
    if (!this.tutorialLabel) return

    if (text !== null && this.tutorialLabel.text !== text) {
      this.tutorialLabel.setText(text)
    }

    this.tutorialLabel.setAlpha(text === null ? 0 : 1)
  }

  setHidden(hidden: boolean): void {
    this.hiddenLabel?.setAlpha(hidden ? 1 : 0)
  }

  setNight(night: number, daily = false, score?: number): void {
    this.nightLabel?.setText(
      daily
        ? 'Desafio do dia'
        : score === undefined
          ? `Noite ${night}`
          : `Noite ${night}  ·  ${score} pts`,
    )
  }

  setFireflies(collected: number, required: number | null): void {
    this.fireflies?.setText(
      required === null ? '' : `Vagalumes ${collected}/${required}`,
    )
  }

  /** 0 = longe, 1 = encostando. */
  setDanger(level: number): void {
    this.danger = Phaser.Math.Clamp(level, 0, 1)
  }

  private createVignetteTexture(): void {
    if (this.textures.exists(VIGNETTE_TEXTURE)) {
      return
    }

    const width = 480
    const height = 270
    const texture = this.textures.createCanvas(VIGNETTE_TEXTURE, width, height)
    const context = texture?.getContext()

    if (!texture || !context) {
      return
    }

    const gradient = context.createRadialGradient(
      width / 2,
      height / 2,
      height * 0.35,
      width / 2,
      height / 2,
      width * 0.62,
    )
    gradient.addColorStop(0, 'rgba(120, 0, 10, 0)')
    gradient.addColorStop(1, 'rgba(160, 10, 20, 0.85)')
    context.fillStyle = gradient
    context.fillRect(0, 0, width, height)
    texture.refresh()
  }

  /** Mostra o joystick e o botão de correr em telas de toque. */
  enableTouchControls(): void {
    if (this.touchEnabled) {
      return
    }

    this.touchEnabled = true
    this.input.addPointer(2)

    const base = this.add
      .circle(JOYSTICK.x, JOYSTICK.y, JOYSTICK.radius, 0x050a07, 0.35)
      .setStrokeStyle(2, 0xe8c766, 0.5)
    const knob = this.add
      .circle(JOYSTICK.x, JOYSTICK.y, JOYSTICK.knob, 0xe8c766, 0.55)
      .setStrokeStyle(2, 0xffffff, 0.4)

    const joystickZone = this.add
      .zone(JOYSTICK.x, JOYSTICK.y, JOYSTICK.radius * 3, JOYSTICK.radius * 3)
      .setInteractive()
    let joystickPointer = -1

    const moveKnob = (pointer: Phaser.Input.Pointer) => {
      let dx = pointer.x - JOYSTICK.x
      let dy = pointer.y - JOYSTICK.y
      const length = Math.hypot(dx, dy)

      if (length > JOYSTICK.radius) {
        dx = (dx / length) * JOYSTICK.radius
        dy = (dy / length) * JOYSTICK.radius
      }

      knob.setPosition(JOYSTICK.x + dx, JOYSTICK.y + dy)

      const direction = joystickDirection(dx, dy, JOYSTICK.radius)

      touchInput.h = direction.h
      touchInput.v = direction.v
    }

    const releaseKnob = () => {
      joystickPointer = -1
      knob.setPosition(JOYSTICK.x, JOYSTICK.y)
      touchInput.h = 0
      touchInput.v = 0
    }

    joystickZone.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      joystickPointer = pointer.id
      moveKnob(pointer)
    })
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (pointer.id === joystickPointer && pointer.isDown) {
        moveKnob(pointer)
      }
    })
    this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (pointer.id === joystickPointer) {
        releaseKnob()
      }
    })

    const sprint = this.add
      .circle(
        SPRINT_BUTTON.x,
        SPRINT_BUTTON.y,
        SPRINT_BUTTON.radius,
        0x9fe870,
        0.3,
      )
      .setStrokeStyle(2, 0x9fe870, 0.7)
      .setInteractive()

    this.add
      .text(SPRINT_BUTTON.x, SPRINT_BUTTON.y, 'CORRER', {
        fontFamily: FONT_FAMILY,
        fontSize: '16px',
        color: THEME.text,
        stroke: '#050a07',
        strokeThickness: 3,
      })
      .setOrigin(0.5)

    sprint.on('pointerdown', () => {
      touchInput.sprint = true
      sprint.setFillStyle(0x9fe870, 0.6)
    })

    for (const event of ['pointerup', 'pointerout']) {
      sprint.on(event, () => {
        touchInput.sprint = false
        sprint.setFillStyle(0x9fe870, 0.3)
      })
    }

    const pause = this.add
      .circle(this.scale.width - 52, PAUSE_BUTTON_Y, 22, 0x050a07, 0.45)
      .setStrokeStyle(2, 0xe8c766, 0.6)
      .setInteractive()

    this.add
      .text(this.scale.width - 52, PAUSE_BUTTON_Y, 'II', {
        fontFamily: FONT_FAMILY,
        fontSize: '18px',
        color: THEME.title,
      })
      .setOrigin(0.5)

    pause.on('pointerdown', () => {
      this.events.emit('pause-request')
    })

    base.setDepth(50)
    knob.setDepth(51)
  }
}
