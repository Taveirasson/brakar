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
