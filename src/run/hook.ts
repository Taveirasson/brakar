/** Medição local do "gancho" da abertura (nada sai do navegador). */
export interface HookState {
  /** Quantos segundos (ms) até o 1º vagalume, nas últimas partidas. */
  firstFireflyMs: number[]
  /** Como foi a 1ª partida de todas. */
  firstRun?: { firstFireflyMs: number | null; escaped: boolean | null }
}

const STORAGE_KEY = 'brakar-hook'
const KEEP = 10

type ReadStorage = Pick<Storage, 'getItem'>
type WriteStorage = Pick<Storage, 'getItem' | 'setItem'>

export function loadHook(storage: ReadStorage = localStorage): HookState {
  try {
    const data = JSON.parse(
      storage.getItem(STORAGE_KEY) ?? '{}',
    ) as Partial<HookState>
    const first = data.firstRun

    return {
      firstFireflyMs: Array.isArray(data.firstFireflyMs)
        ? data.firstFireflyMs.filter(
            (v): v is number => typeof v === 'number' && v >= 0,
          )
        : [],
      firstRun:
        first && typeof first === 'object'
          ? {
              firstFireflyMs:
                typeof first.firstFireflyMs === 'number'
                  ? first.firstFireflyMs
                  : null,
              escaped:
                typeof first.escaped === 'boolean' ? first.escaped : null,
            }
          : undefined,
    }
  } catch {
    return { firstFireflyMs: [] }
  }
}

function save(state: HookState, storage: Pick<Storage, 'setItem'>): void {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // sem armazenamento: a medição só vale nesta sessão
  }
}

/** Chamado ao começar a noite: devolve true se esta é a 1ª partida de todas. */
export function noteRunStart(storage: WriteStorage = localStorage): boolean {
  const state = loadHook(storage)

  if (state.firstRun) return false

  state.firstRun = { firstFireflyMs: null, escaped: null }
  save(state, storage)

  return true
}

export function noteFirstFirefly(
  ms: number,
  isFirstRun: boolean,
  storage: WriteStorage = localStorage,
): void {
  const state = loadHook(storage)

  state.firstFireflyMs = [...state.firstFireflyMs, Math.round(ms)].slice(-KEEP)

  if (isFirstRun && state.firstRun) {
    state.firstRun.firstFireflyMs = Math.round(ms)
  }

  save(state, storage)
}

export function noteFirstRunEnd(
  escaped: boolean,
  storage: WriteStorage = localStorage,
): void {
  const state = loadHook(storage)

  if (state.firstRun) {
    state.firstRun.escaped = escaped
    save(state, storage)
  }
}

/** Média (ms) do tempo até o 1º vagalume; null sem dados. */
export function averageFirstFirefly(state: HookState): number | null {
  const list = state.firstFireflyMs

  return list.length === 0
    ? null
    : Math.round(list.reduce((sum, v) => sum + v, 0) / list.length)
}
