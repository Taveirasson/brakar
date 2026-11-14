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
  currentScore = 0
}

/** Pontos acumulados na corrida de sobrevivência (em memória). */
let currentScore = 0

export function getScore(): number {
  return currentScore
}

export function addScore(points: number): number {
  currentScore += Math.max(0, Math.floor(points))
  return currentScore
}

let openingPending = true

/** A cena do carro tocar só uma vez por corrida: retentativas e noites seguintes entram direto no escuro. */
export function consumeOpening(): boolean {
  const play = openingPending

  openingPending = false

  return play
}

/** Volta ao menu: a próxima corrida terá a abertura de novo. */
export function resetOpening(): void {
  openingPending = true
}

/** Normal: noites seguidas com labirinto aleatório. Diário: o mesmo labirinto para todos no dia. */
export type GameMode = 'normal' | 'daily' | 'survival'

let currentMode: GameMode = 'normal'

export function getGameMode(): GameMode {
  return currentMode
}

export function setGameMode(mode: GameMode): void {
  currentMode = mode
}
