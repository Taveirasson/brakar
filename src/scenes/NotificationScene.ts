import Phaser from 'phaser'
import { SCENE_KEYS } from '../config/sceneKeys'

export type NotificationOptions = {
  color?: string
  duration?: number
}

type NotificationRequest = {
  message: string
  color: string
  duration: number
}

export class NotificationScene extends Phaser.Scene {
  private notificationQueue: NotificationRequest[] = []
  private showingNotification = false

  constructor() {
    super(SCENE_KEYS.notifications)
  }

  create(): void {
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

    const background = this.add
      .rectangle(0, 0, 520, 64, 0x09070f, 0.94)
      .setStrokeStyle(2, 0x5a4473)

    const text = this.add
      .text(0, 0, notification.message, {
        fontFamily: 'monospace',
        fontSize: '20px',
        color: notification.color,
        align: 'center',
      })
      .setOrigin(0.5)

    text.setResolution(Math.max(2, window.devicePixelRatio))

    const container = this.add
      .container(centerX, -50, [background, text])
      .setDepth(1000)
      .setAlpha(0)

    this.tweens.add({
      targets: container,
      y: 70,
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
      y: 35,
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
