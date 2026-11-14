import Phaser from 'phaser'
import { SCENE_KEYS } from '../config/sceneKeys'
import { pickBoonChoices } from '../run/boons'
import { addBoon, getBoons, getNight } from '../run/runState'
import { createTextButton } from '../ui/createTextButton'
import { enableKeyboardMenu } from '../ui/menuNavigation'
import { addBackdrop, addPanel, addText, THEME } from '../ui/theme'

/** Antes de cada noite (a partir da 2): escolha 1 de 3 bênçãos para o resto da corrida. */
export class BoonScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.boon)
  }

  create(): void {
    const centerX = this.scale.width / 2
    const centerY = this.scale.height / 2
    const choices = pickBoonChoices(getBoons())

    addBackdrop(this, 1)
    addPanel(this, centerX, centerY, 700, 460)
    addText(this, centerX, centerY - 178, `NOITE ${getNight()}`, 'heading')
    addText(this, centerX, centerY - 132, 'Escolha uma bênção da mata', 'body')

    choices.forEach((boon, index) => {
      const y = centerY - 62 + index * 98

      createTextButton({
        scene: this,
        x: centerX,
        y,
        width: 520,
        label: boon.name.toUpperCase(),
        onClick: () => this.pick(boon.id),
      })
      addText(this, centerX, y + 40, boon.description, 'muted', THEME.title)
    })

    enableKeyboardMenu(this)

    // atalhos 1, 2 e 3 escolhem direto
    choices.forEach((boon, index) => {
      this.input.keyboard?.on(`keydown-${index + 1}`, () => this.pick(boon.id))
    })

    this.cameras.main.fadeIn(250, 5, 10, 7)
  }

  private pick(id: string): void {
    addBoon(id)
    this.scene.start(SCENE_KEYS.game)
  }
}
