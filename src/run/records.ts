/** Recordes e contadores guardados no navegador (tolera localStorage indisponível). */
export interface Records {
  bestTimeMs: number | null
  escapes: number
  caught: number
  /** Maior noite alcançada numa run. */
  bestNight: number
}

const STORAGE_KEY = 'brakar-records'

export const EMPTY_RECORDS: Records = {
  bestTimeMs: null,
  escapes: 0,
  caught: 0,
  bestNight: 1,
}

function toCount(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
    ? Math.floor(value)
    : 0
}

export function loadRecords(storage: Pick<Storage, 'getItem'> = localStorage) {
  try {
    const raw = storage.getItem(STORAGE_KEY)
    const data = raw ? (JSON.parse(raw) as Partial<Records>) : {}
    const best = data.bestTimeMs

    return {
      bestTimeMs:
        typeof best === 'number' && Number.isFinite(best) && best > 0
          ? best
          : null,
      escapes: toCount(data.escapes),
      caught: toCount(data.caught),
      bestNight: Math.max(1, toCount(data.bestNight)),
    } satisfies Records
  } catch {
    return { ...EMPTY_RECORDS }
  }
}

function save(records: Records, storage: Pick<Storage, 'setItem'>): void {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(records))
  } catch {
    // sem armazenamento: o jogo segue, só não guarda o recorde
  }
}

export interface EscapeResult {
  records: Records
  isNewBest: boolean
}

export function recordEscape(
  timeMs: number,
  night: number,
  storage: Pick<Storage, 'getItem' | 'setItem'> = localStorage,
): EscapeResult {
  const current = loadRecords(storage)
  const isNewBest = current.bestTimeMs === null || timeMs < current.bestTimeMs
  const records: Records = {
    bestTimeMs: isNewBest ? timeMs : current.bestTimeMs,
    escapes: current.escapes + 1,
    caught: current.caught,
    bestNight: Math.max(current.bestNight, night),
  }

  save(records, storage)

  return { records, isNewBest }
}

export function recordCaught(
  night: number,
  storage: Pick<Storage, 'getItem' | 'setItem'> = localStorage,
): Records {
  const current = loadRecords(storage)
  const records: Records = {
    ...current,
    caught: current.caught + 1,
    bestNight: Math.max(current.bestNight, night),
  }

  save(records, storage)

  return records
}

/** 83500 -> "1:23.5" */
export function formatTime(ms: number): string {
  const tenths = Math.floor(ms / 100)
  const minutes = Math.floor(tenths / 600)
  const seconds = Math.floor((tenths % 600) / 10)

  return `${minutes}:${String(seconds).padStart(2, '0')}.${tenths % 10}`
}
