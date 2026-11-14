/** Noite atual da run (em memória): sobe a cada fuga e volta a 1 ao ser pego. */
let currentNight = 1

export function getNight(): number {
  return currentNight
}

export function nextNight(): number {
  currentNight += 1
  return currentNight
}

export function resetNight(): void {
  currentNight = 1
}

/** Normal: noites seguidas com labirinto aleatório. Diário: o mesmo labirinto para todos no dia. */
export type GameMode = 'normal' | 'daily'

let currentMode: GameMode = 'normal'

export function getGameMode(): GameMode {
  return currentMode
}

export function setGameMode(mode: GameMode): void {
  currentMode = mode
}
