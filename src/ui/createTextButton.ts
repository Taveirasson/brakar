import Phaser from 'phaser'
import { FONT_FAMILY, THEME } from './theme'

/** Botões de cada cena, na ordem de criação (usado pela navegação por teclado). */
const registry = new WeakMap<Phaser.Scene, Phaser.GameObjects.Container[]>()

export function sceneButtons(
  scene: Phaser.Scene,
): Phaser.GameObjects.Container[] {
  return (registry.get(scene) ?? []).filter((button) => button.active)
}

export type CreateButtonProps = {
  scene: Phaser.Scene
  x: number
  y: number
  label: string
  onClick: () => void
  /** Largura fixa (px); por padrão se ajusta ao texto (mínimo 220). */
  width?: number
  fontSize?: number
}

const PADDING_X = 26
const PADDING_Y = 12
const RADIUS = 12

/** Botão arredondado no tema da floresta; brilha e cresce um pouco ao passar o mouse. */
export function createTextButton({
  scene,
  x,
  y,
  label,
  onClick,
  width: fixedWidth,
  fontSize = 22,
}: CreateButtonProps): Phaser.GameObjects.Container {
  const text = scene.add
    .text(0, 0, label, {
      fontFamily: FONT_FAMILY,
      fontSize: `${fontSize}px`,
      color: THEME.text,
    })
    .setOrigin(0.5)

  const width = fixedWidth ?? Math.max(220, text.width + PADDING_X * 2)
  const height = text.height + PADDING_Y * 2

  const background = scene.add.graphics()

  const draw = (hovered: boolean) => {
    background.clear()

    if (hovered) {
      background.fillStyle(THEME.border, 0.18)
      background.fillRoundedRect(
        -width / 2 - 5,
        -height / 2 - 5,
        width + 10,
        height + 10,
        RADIUS + 4,
      )
    }

    background.fillStyle(hovered ? THEME.buttonHover : THEME.buttonFill, 1)
    background.fillRoundedRect(-width / 2, -height / 2, width, height, RADIUS)
    background.lineStyle(2, hovered ? THEME.border : THEME.buttonBorder, 1)
    background.strokeRoundedRect(-width / 2, -height / 2, width, height, RADIUS)
  }

  draw(false)

  const button = scene.add.container(x, y, [background, text])
  button.setSize(width, height)
  registry.set(scene, [...(registry.get(scene) ?? []), button])
  button.setInteractive({ useHandCursor: true })

  button.on('pointerover', () => {
    draw(true)
    text.setColor(THEME.title)
    scene.tweens.add({ targets: button, scale: 1.05, duration: 120 })
  })

  button.on('pointerout', () => {
    draw(false)
    text.setColor(THEME.text)
    scene.tweens.add({ targets: button, scale: 1, duration: 120 })
  })

  button.on('pointerdown', onClick)

  // foco por teclado (ui/menuNavigation): mesmo destaque do mouse
  button.setData('activate', onClick)
  button.setData('focus', (on: boolean) => {
    draw(on)
    text.setColor(on ? THEME.title : THEME.text)
    scene.tweens.add({ targets: button, scale: on ? 1.05 : 1, duration: 120 })
  })

  return button
}
