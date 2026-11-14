import Phaser from 'phaser'

/** Fonte pixel arredondada do Google Fonts (carregada em index.html), com reserva monospace. */
export const FONT_FAMILY = '"Pixelify Sans", monospace'

export const THEME = {
  backdrop: 0x050a07,
  panel: 0x0d1a12,
  panelEdge: 0x1c3324,
  border: 0xe8c766,
  buttonFill: 0x1f3a26,
  buttonHover: 0x2f5a37,
  buttonBorder: 0xb59a4c,
  title: '#f4d35e',
  text: '#f2efe6',
  muted: '#9fb59a',
  danger: '#ff6b6b',
  glow: '#f4d35e',
} as const

type TextKind = 'title' | 'heading' | 'body' | 'muted'

const TEXT_SIZES: Record<TextKind, string> = {
  title: '56px',
  heading: '38px',
  body: '18px',
  muted: '15px',
}

export function textStyle(
  kind: TextKind,
  color?: string,
): Phaser.Types.GameObjects.Text.TextStyle {
  const isTitle = kind === 'title' || kind === 'heading'

  return {
    fontFamily: FONT_FAMILY,
    fontSize: TEXT_SIZES[kind],
    color:
      color ??
      (isTitle ? THEME.title : kind === 'muted' ? THEME.muted : THEME.text),
    align: 'center',
    lineSpacing: 8,
    ...(isTitle && {
      // espaço para o brilho não ser cortado na borda do texto (vira uma "caixa")
      padding: { x: 28, y: 20 },
      shadow: {
        offsetX: 0,
        offsetY: 0,
        color: color ?? THEME.glow,
        blur: 18,
        fill: true,
      },
    }),
  }
}

export function addText(
  scene: Phaser.Scene,
  x: number,
  y: number,
  content: string | string[],
  kind: TextKind,
  color?: string,
): Phaser.GameObjects.Text {
  return scene.add.text(x, y, content, textStyle(kind, color)).setOrigin(0.5)
}

/** Escurece a cena de baixo (usado nas telas que abrem por cima do jogo). */
export function addBackdrop(scene: Phaser.Scene, alpha = 0.82): void {
  const { width, height } = scene.scale

  scene.add.rectangle(
    width / 2,
    height / 2,
    width,
    height,
    THEME.backdrop,
    alpha,
  )
}

/** Painel de cantos arredondados com sombra e borda dupla dourada. */
export function addPanel(
  scene: Phaser.Scene,
  centerX: number,
  centerY: number,
  width: number,
  height: number,
  borderColor: number = THEME.border,
): Phaser.GameObjects.Graphics {
  const left = centerX - width / 2
  const top = centerY - height / 2
  const graphics = scene.add.graphics()

  graphics.fillStyle(0x000000, 0.45)
  graphics.fillRoundedRect(left + 6, top + 8, width, height, 18)

  graphics.fillStyle(THEME.panel, 0.94)
  graphics.fillRoundedRect(left, top, width, height, 18)

  graphics.lineStyle(2, THEME.panelEdge, 1)
  graphics.strokeRoundedRect(left + 6, top + 6, width - 12, height - 12, 13)

  graphics.lineStyle(3, borderColor, 0.9)
  graphics.strokeRoundedRect(left, top, width, height, 18)

  return graphics
}

/** Linha de conquistas/missões: quebra em várias linhas em vez de vazar do painel. */
export function addAchievements(
  scene: Phaser.Scene,
  x: number,
  y: number,
  entries: string[],
  wrapWidth = 520,
): Phaser.GameObjects.Text {
  return addText(
    scene,
    x,
    y,
    `🏆 ${entries.join('  ·  ')}`,
    'muted',
    THEME.title,
  ).setWordWrapWidth(wrapWidth)
}
