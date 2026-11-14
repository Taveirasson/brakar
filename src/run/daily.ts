/** Desafio do dia: mesmo labirinto para todos no dia, com sequência de dias seguidos. */
export interface DailyState {
  /** Último dia (AAAA-MM-DD) em que o desafio foi concluído. */
  lastCompleted: string | null
  /** Dias seguidos concluídos, contando até lastCompleted. */
  streak: number
  /** Melhor tempo (ms) por dia; guarda só os últimos dias. */
  best: Record<string, number>
}

const STORAGE_KEY = 'brakar-daily'
const KEEP_DAYS = 30

export const EMPTY_DAILY: DailyState = {
  lastCompleted: null,
  streak: 0,
  best: {},
}

/** Data local no formato AAAA-MM-DD. */
export function dateKey(date: Date = new Date()): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${date.getFullYear()}-${month}-${day}`
}

export function previousDateKey(key: string): string {
  const [year, month, day] = key.split('-').map(Number)

  return dateKey(new Date(year, month - 1, day - 1))
}

export function loadDaily(
  storage: Pick<Storage, 'getItem'> = localStorage,
): DailyState {
  try {
    const data = JSON.parse(
      storage.getItem(STORAGE_KEY) ?? '{}',
    ) as Partial<DailyState>
    const best: Record<string, number> = {}

    for (const [key, value] of Object.entries(data.best ?? {})) {
      if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
        best[key] = value
      }
    }

    return {
      lastCompleted:
        typeof data.lastCompleted === 'string' ? data.lastCompleted : null,
      streak:
        typeof data.streak === 'number' && data.streak > 0
          ? Math.floor(data.streak)
          : 0,
      best,
    }
  } catch {
    return { ...EMPTY_DAILY, best: {} }
  }
}

/** Sequência que ainda vale hoje: zera se o último dia concluído foi antes de ontem. */
export function activeStreak(state: DailyState, today: string): number {
  if (state.lastCompleted === today) return state.streak
  if (state.lastCompleted === previousDateKey(today)) return state.streak

  return 0
}

export interface DailyResult {
  state: DailyState
  isNewBest: boolean
  streak: number
  firstToday: boolean
}

export function recordDailyEscape(
  timeMs: number,
  today: string = dateKey(),
  storage: Pick<Storage, 'getItem' | 'setItem'> = localStorage,
): DailyResult {
  const current = loadDaily(storage)
  const firstToday = current.lastCompleted !== today
  const streak = firstToday ? activeStreak(current, today) + 1 : current.streak
  const previousBest = current.best[today]
  const isNewBest = previousBest === undefined || timeMs < previousBest

  const best = { ...current.best, [today]: isNewBest ? timeMs : previousBest }

  for (const key of Object.keys(best).sort().slice(0, -KEEP_DAYS)) {
    delete best[key]
  }

  const state: DailyState = { lastCompleted: today, streak, best }

  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // sem armazenamento: o jogador vê o resultado, só não fica salvo
  }

  return { state, isNewBest, streak, firstToday }
}
