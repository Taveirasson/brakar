/** Estado dos controles de toque, escrito pelo HUD e lido pelo GameScene. */
export const touchInput = {
  /** Direção do joystick: -1, 0 ou 1 em cada eixo. */
  h: 0,
  v: 0,
  sprint: false,
}

/** Zona morta: abaixo disso (fração do raio) o joystick conta como parado. */
export const JOYSTICK_DEAD_ZONE = 0.3

/** Converte o deslocamento do dedo (já limitado ao raio) em direção digital. */
export function joystickDirection(
  dx: number,
  dy: number,
  radius: number,
): { h: number; v: number } {
  const threshold = radius * JOYSTICK_DEAD_ZONE

  return {
    h: Math.abs(dx) < threshold ? 0 : Math.sign(dx),
    v: Math.abs(dy) < threshold ? 0 : Math.sign(dy),
  }
}

export function resetTouchInput(): void {
  touchInput.h = 0
  touchInput.v = 0
  touchInput.sprint = false
}
