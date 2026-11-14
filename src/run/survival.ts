/** Modo sobrevivência: noites seguidas em labirintos pequenos; vale a pontuação total. */
export interface SurvivalNight {
  night: number
  timeMs: number
  bones: number
  hides: number
}

export interface SurvivalBest {
  score: number
  nights: number
}

const STORAGE_KEY = 'brakar-survival'
const FAST_ESCAPE_MS = 60_000

/** Pontos de uma fuga: base cresce com a noite, mais ossos, moitas e rapidez. */
export function scoreForNight(run: SurvivalNight): number {
  const base = 100 + 25 * (Math.max(1, run.night) - 1)
  const speed =
    Math.max(0, Math.floor((FAST_ESCAPE_MS - run.timeMs) / 1000)) * 2

  return base + Math.max(0, run.bones) * 15 + Math.max(0, run.hides) * 5 + speed
}

export function loadSurvivalBest(
  storage: Pick<Storage, 'getItem'> = localStorage,
): SurvivalBest {
  try {
    const data = JSON.parse(
      storage.getItem(STORAGE_KEY) ?? '{}',
    ) as Partial<SurvivalBest>

    return {
      score: typeof data.score === 'number' && data.score > 0 ? data.score : 0,
      nights:
        typeof data.nights === 'number' && data.nights > 0 ? data.nights : 0,
    }
  } catch {
    return { score: 0, nights: 0 }
  }
}

export interface SurvivalResult {
  best: SurvivalBest
  isNewBest: boolean
}

/** Fim da corrida (ao ser pego): guarda o recorde de pontos e de noites vencidas. */
export function recordSurvival(
  score: number,
  nightsSurvived: number,
  storage: Pick<Storage, 'getItem' | 'setItem'> = localStorage,
): SurvivalResult {
  const previous = loadSurvivalBest(storage)
  const isNewBest = score > previous.score
  const best: SurvivalBest = {
    score: Math.max(previous.score, score),
    nights: Math.max(previous.nights, nightsSurvived),
  }

  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(best))
  } catch {
    // sem armazenamento: vale só nesta sessão
  }

  return { best, isNewBest }
}
