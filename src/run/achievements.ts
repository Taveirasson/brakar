/** Conquistas: desbloqueadas no fim de cada tentativa e guardadas no navegador. */
export interface RunStats {
  escaped: boolean
  night: number
  timeMs: number
  /** Vezes que o Pipoca se escondeu numa moita. */
  hides: number
  bones: number
  /** Vezes que o Estouro passou a caçar o Pipoca. */
  timesHunted: number
}

export interface Achievement {
  id: string
  title: string
  description: string
  earned: (stats: RunStats) => boolean
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first-escape',
    title: 'Primeira fuga',
    description: 'Escape do Estouro pela primeira vez',
    earned: (s) => s.escaped,
  },
  {
    id: 'ghost',
    title: 'Fantasma',
    description: 'Escape sem o Estouro nunca te caçar',
    earned: (s) => s.escaped && s.timesHunted === 0,
  },
  {
    id: 'lightning',
    title: 'Relâmpago',
    description: 'Escape em menos de 90 segundos',
    earned: (s) => s.escaped && s.timeMs < 90_000,
  },
  {
    id: 'bushman',
    title: 'Mestre das moitas',
    description: 'Esconda-se 3 vezes numa noite',
    earned: (s) => s.hides >= 3,
  },
  {
    id: 'bone-collector',
    title: 'Roedor de ossos',
    description: 'Pegue 3 ossos numa noite',
    earned: (s) => s.bones >= 3,
  },
  {
    id: 'night-owl',
    title: 'Coruja',
    description: 'Chegue à noite 3',
    earned: (s) => s.night >= 3,
  },
]

const STORAGE_KEY = 'brakar-achievements'

export function loadEarned(
  storage: Pick<Storage, 'getItem'> = localStorage,
): string[] {
  try {
    const data: unknown = JSON.parse(storage.getItem(STORAGE_KEY) ?? '[]')

    return Array.isArray(data)
      ? data.filter((id): id is string => typeof id === 'string')
      : []
  } catch {
    return []
  }
}

/** Confere as conquistas, guarda as novas e devolve só as recém-desbloqueadas. */
export function unlockAchievements(
  stats: RunStats,
  storage: Pick<Storage, 'getItem' | 'setItem'> = localStorage,
): Achievement[] {
  const already = loadEarned(storage)
  const fresh = ACHIEVEMENTS.filter(
    (a) => !already.includes(a.id) && a.earned(stats),
  )

  if (fresh.length > 0) {
    try {
      storage.setItem(
        STORAGE_KEY,
        JSON.stringify([...already, ...fresh.map((a) => a.id)]),
      )
    } catch {
      // sem armazenamento: o jogador vê a conquista, só não fica salva
    }
  }

  return fresh
}
