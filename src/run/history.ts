import { dateKey } from './daily'

/** Melhores fugas do modo normal (ranking local, só no navegador). */
export interface HistoryEntry {
  timeMs: number
  night: number
  /** Dia (AAAA-MM-DD) em que aconteceu. */
  date: string
}

const STORAGE_KEY = 'brakar-history'
export const HISTORY_SIZE = 5

type ReadStorage = Pick<Storage, 'getItem'>
type WriteStorage = Pick<Storage, 'getItem' | 'setItem'>

export function loadHistory(
  storage: ReadStorage = localStorage,
): HistoryEntry[] {
  try {
    const data: unknown = JSON.parse(storage.getItem(STORAGE_KEY) ?? '[]')

    if (!Array.isArray(data)) return []

    return data
      .filter(
        (e): e is HistoryEntry =>
          !!e &&
          typeof e.timeMs === 'number' &&
          e.timeMs > 0 &&
          typeof e.night === 'number' &&
          typeof e.date === 'string',
      )
      .sort((a, b) => a.timeMs - b.timeMs)
      .slice(0, HISTORY_SIZE)
  } catch {
    return []
  }
}

/** Insere a fuga no ranking e devolve a posição (1 = melhor) ou null se ficou de fora. */
export function recordHistory(
  timeMs: number,
  night: number,
  storage: WriteStorage = localStorage,
  date: string = dateKey(),
): number | null {
  const entry: HistoryEntry = { timeMs, night, date }
  const list = [...loadHistory(storage), entry]
    .sort((a, b) => a.timeMs - b.timeMs)
    .slice(0, HISTORY_SIZE)
  const index = list.indexOf(entry)

  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(list))
  } catch {
    // sem armazenamento: vale só nesta sessão
  }

  return index === -1 ? null : index + 1
}

/** Dias do desafio, do mais recente para o mais antigo. */
export function dailyHistory(
  best: Record<string, number>,
  limit = 8,
): { date: string; timeMs: number }[] {
  return Object.entries(best)
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, limit)
    .map(([date, timeMs]) => ({ date, timeMs }))
}

/** AAAA-MM-DD -> DD/MM */
export function shortDate(date: string): string {
  const [, month, day] = date.split('-')

  return `${day}/${month}`
}
