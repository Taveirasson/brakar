import Phaser from 'phaser'
import { sceneButtons } from './createTextButton'

/** Botões criados por createTextButton expõem estas funções via setData. */
export function focusButton(
  button: Phaser.GameObjects.Container,
  on: boolean,
): void {
  const focus = button.getData('focus') as ((on: boolean) => void) | undefined

  focus?.(on)
}

/**
 * Navegação por teclado: setas/WASD movem o foco, Enter/Espaço ativam e ESC volta (se houver).
 * Sem foco ainda, Enter ativa o primeiro botão; o destaque só aparece depois da primeira tecla.
 */
export function enableKeyboardMenu(
  scene: Phaser.Scene,
  options: {
    /** Botão ativado pelo Enter quando ainda não há foco (padrão: o primeiro). */
    primary?: Phaser.GameObjects.Container
    onBack?: () => void
  } = {},
): void {
  const { primary, onBack } = options
  const keyboard = scene.input.keyboard
  // ordem visual: de cima para baixo e, na mesma linha, da esquerda para a direita
  const buttons = sceneButtons(scene).sort((a, b) => a.y - b.y || a.x - b.x)

  if (!keyboard || buttons.length === 0) {
    return
  }

  let index = -1

  const move = (step: number): void => {
    // primeira tecla: o foco vai direto para o botão principal
    if (index < 0 && primary) {
      index = Math.max(0, buttons.indexOf(primary))
      focusButton(buttons[index], true)

      return
    }

    if (index >= 0) focusButton(buttons[index], false)

    index =
      index < 0
        ? step > 0
          ? 0
          : buttons.length - 1
        : (index + step + buttons.length) % buttons.length
    focusButton(buttons[index], true)
  }

  const activate = (): void => {
    const target = index >= 0 ? buttons[index] : (primary ?? buttons[0])
    const onClick = target.getData('activate') as (() => void) | undefined

    onClick?.()
  }

  for (const key of ['DOWN', 'RIGHT', 'S', 'D']) {
    keyboard.on(`keydown-${key}`, () => move(1))
  }

  for (const key of ['UP', 'LEFT', 'W', 'A']) {
    keyboard.on(`keydown-${key}`, () => move(-1))
  }

  keyboard.on('keydown-ENTER', activate)
  keyboard.on('keydown-SPACE', activate)

  if (onBack) {
    keyboard.on('keydown-ESC', onBack)
  }
}
