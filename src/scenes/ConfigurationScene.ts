import Phaser from 'phaser'
import { SCENE_KEYS } from '../config/sceneKeys'
import { createTextButton } from '../ui/createTextButton'
import {
  getSavedMazeSize,
  MAZE_SIZES,
  saveMazeSize,
} from '../config/mazeSettings'
import type { NotificationScene } from './NotificationScene'
import { addPanel, addText } from '../ui/theme'

export class ConfigurationScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.configuration)
  }

  create(): void {
    const centerX = this.scale.width / 2
    const centerY = this.scale.height / 2

    addPanel(this, centerX, centerY + 15, 480, 400)
    addText(this, centerX, centerY - 130, 'CONFIGURAÇÕES', 'heading')

    let selectedSize = getSavedMazeSize()
    addText(this, centerX, centerY - 55, 'TAMANHO DA MATA', 'body')

    const dropdown = document.createElement('details')
    dropdown.className = 'maze-dropdown'

    for (const eventName of [
      'mousedown',
      'mouseup',
      'touchstart',
      'touchend',
    ]) {
      dropdown.addEventListener(eventName, (event) => {
        event.stopPropagation()
      })
    }

    const trigger = document.createElement('summary')
    trigger.textContent = `${selectedSize} × ${selectedSize}`

    const options = document.createElement('div')
    options.className = 'maze-options'

    MAZE_SIZES.forEach((size) => {
      const option = document.createElement('button')
      option.type = 'button'
      option.textContent = `${size} × ${size}`
      option.classList.toggle('is-selected', size === selectedSize)

      option.addEventListener('click', () => {
        selectedSize = size
        trigger.textContent = `${size} × ${size}`

        options.querySelectorAll('button').forEach((button) => {
          button.classList.toggle('is-selected', button === option)
        })

        dropdown.open = false
      })

      options.appendChild(option)
    })

    dropdown.append(trigger, options)
    this.add.dom(centerX, centerY + 5, dropdown)

    createTextButton({
      scene: this,
      x: centerX,
      y: centerY + 80,
      label: 'SALVAR',
      onClick: () => {
        saveMazeSize(selectedSize)
        this.showSavedNotification()
      },
    })

    createTextButton({
      scene: this,
      x: centerX,
      y: centerY + 140,
      label: 'VOLTAR',
      onClick: () => {
        this.returnToMenu()
      },
    })
  }

  private returnToMenu(): void {
    this.scene.stop(SCENE_KEYS.configuration)
    this.scene.start(SCENE_KEYS.menu)
  }

  private showSavedNotification(): void {
    const key = SCENE_KEYS.notifications
    const notificationScene = this.scene.get(key) as NotificationScene

    const show = () => {
      this.scene.bringToTop(key)
      notificationScene.show('CONFIGURAÇÕES SALVAS', {
        color: '#55ff88',
        duration: 1800,
      })
    }

    if (this.scene.isActive(key)) {
      show()
      return
    }

    notificationScene.events.once(Phaser.Scenes.Events.CREATE, show)
    this.scene.launch(key)
  }
}
