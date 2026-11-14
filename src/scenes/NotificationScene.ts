import Phaser from 'phaser'
import { SCENE_KEYS } from '../config/sceneKeys'
import { FONT_FAMILY, THEME } from '../ui/theme'

export type NotificationOptions = {
  color?: string
  duration?: number
}

type NotificationRequest = {
  message: string
  color: string
  duration: number
}

/** Largura máxima do texto: a caixa fica entre a coluna do HUD e o minimapa. */
const MAX_TEXT_WIDTH = 460
const TOP_Y = 50

export class NotificationScene extends Phaser.Scene {
  private notificationQueue: NotificationRequest[] = []
  private showingNotification = false

  constructor() {
    super(SCENE_KEYS.notifications)
  }

  create(): void {
    this.scene.setVisible(true)
    this.notificationQueue = []
    this.showingNotification = false

    this.cameras.main.setZoom(1)
  }

  public show(message: string, options: NotificationOptions) {
    this.notificationQueue.push({
      message,
      color: options.color ?? '#ffffff',
      duration: options.duration ?? 1600,
    })

    this.showNextNotification()
  }

  private showNextNotification(): void {
    if (this.showingNotification) {
      return
    }

    const notification = this.notificationQueue.shift()

    if (!notification) {
      return
    }

    this.showingNotification = true

    const centerX = this.scale.width / 2

    const text = this.add
      .text(0, 0, notification.message, {
        fontFamily: FONT_FAMILY,
        fontSize: '19px',
        color: notification.color,
        align: 'center',
        wordWrap: { width: MAX_TEXT_WIDTH },
      })
      .setOrigin(0.5)

    text.setResolution(Math.max(2, window.devicePixelRatio))

    // a caixa acompanha o texto (nunca fica menor que ele)
    const boxWidth = Math.max(260, text.width + 44)
    const boxHeight = text.height + 28
    const background = this.add.graphics()

    background.fillStyle(THEME.panel, 0.94)
    background.fillRoundedRect(
      -boxWidth / 2,
      -boxHeight / 2,
      boxWidth,
      boxHeight,
      14,
    )
    background.lineStyle(2, THEME.buttonBorder, 1)
    background.strokeRoundedRect(
      -boxWidth / 2,
      -boxHeight / 2,
      boxWidth,
      boxHeight,
      14,
    )

    const container = this.add
      .container(centerX, -50, [background, text])
      .setDepth(1000)
      .setAlpha(0)

    this.tweens.add({
      targets: container,
      y: TOP_Y,
      alpha: 1,
      duration: 250,
      ease: 'Back.Out',
      onComplete: () => {
        this.time.delayedCall(notification.duration, () => {
          this.hideNotification(container)
        })
      },
    })
  }

  private hideNotification(container: Phaser.GameObjects.Container): void {
    this.tweens.add({
      targets: container,
      y: TOP_Y - 30,
      alpha: 0,
      duration: 220,
      ease: 'Sine.In',
      onComplete: () => {
        container.destroy(true)

        this.showingNotification = false
        this.showNextNotification()
      },
    })
  }

  public clear(): void {
    this.notificationQueue = []
    this.showingNotification = false

    this.tweens.killAll()
    this.time.removeAllEvents()
    this.children.removeAll(true)
  }
}
