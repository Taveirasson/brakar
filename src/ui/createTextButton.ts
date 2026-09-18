import Phaser from 'phaser'

export type CreateButtonProps = {
  scene: Phaser.Scene
  x: number
  y: number
  label: string
  color?: string
  backgrondColor?: string
  onClick: () => void
}

export function createTextButton({
  scene,
  x,
  y,
  label,
  color = '#ffffff',
  backgrondColor = '#5a4473',
  onClick,
}: CreateButtonProps): Phaser.GameObjects.Text {
  const button = scene.add
    .text(x, y, label, {
      fontFamily: 'monospace',
      fontSize: '24px',
      color: color,
      backgroundColor: backgrondColor,
      padding: {
        x: 20,
        y: 10,
      },
    })
    .setOrigin(0.5)
    .setInteractive({ useHandCursor: true })

  button.on('pointerover', () => {
    button.setColor('#f4d35e')
  })

  button.on('pointerout', () => {
    button.setColor('#ffffff')
  })

  button.on('pointerdown', onClick)

  return button
}
