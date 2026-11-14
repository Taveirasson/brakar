import { createSeededRandom, hashString } from './seed'
import { dateKey } from './daily'

/** Missões do dia: 3 sorteadas pela data, progresso somado entre as tentativas. */
export interface MissionStats {
  escaped: boolean
  night: number
  timeMs: number
  hides: number
  bones: number
  timesHunted: number
  fireflies: number
  powerUps: number
}

export interface MissionTemplate {
  id: string
  title: string
  target: number
  reward: number
  /** Quanto esta tentativa soma ao progresso. */
  gain: (stats: MissionStats) => number
}

export const MISSIONS: MissionTemplate[] = [
  {
    id: 'hide',
    title: 'Esconda-se',
    target: 3,
    reward: 4,
    gain: (s) => s.hides,
  },
  {
    id: 'bones',
    title: 'Colete ossos',
    target: 4,
    reward: 4,
    gain: (s) => s.bones,
  },
  {
    id: 'fireflies',
    title: 'Pegue vagalumes',
    target: 10,
    reward: 5,
    gain: (s) => s.fireflies,
  },
  {
    id: 'escape',
    title: 'Fuja do Estouro',
    target: 2,
    reward: 6,
    gain: (s) => (s.escaped ? 1 : 0),
  },
  {
    id: 'powerups',
    title: 'Use power-ups',
    target: 2,
    reward: 4,
    gain: (s) => s.powerUps,
  },
  {
    id: 'ghost',
    title: 'Fuga invisível',
    target: 1,
    reward: 7,
    gain: (s) => (s.escaped && s.timesHunted === 0 ? 1 : 0),
  },
  {
    id: 'night',
    title: 'Chegue à noite 3',
    target: 1,
    reward: 6,
    gain: (s) => (s.night >= 3 ? 1 : 0),
  },
]

export interface MissionState {
  /** Dia (AAAA-MM-DD) a que o progresso pertence. */
  day: string
  progress: Record<string, number>
  /** Missões cuja recompensa já foi paga. */
  claimed: string[]
}

const STORAGE_KEY = 'brakar-missions'
const PER_DAY = 3

type ReadStorage = Pick<Storage, 'getItem'>
type WriteStorage = Pick<Storage, 'getItem' | 'setItem'>

/** As 3 missões do dia: sempre as mesmas para a mesma data. */
export function missionsForDay(day: string): MissionTemplate[] {
  const random = createSeededRandom(hashString(`missions-${day}`))
  const pool = [...MISSIONS]
  const picked: MissionTemplate[] = []

  while (picked.length < PER_DAY && pool.length > 0) {
    picked.push(pool.splice(Math.floor(random() * pool.length), 1)[0])
  }

  return picked
}

export function loadMissions(
  day: string = dateKey(),
  storage: ReadStorage = localStorage,
): MissionState {
  const fresh: MissionState = { day, progress: {}, claimed: [] }

  try {
    const data = JSON.parse(
      storage.getItem(STORAGE_KEY) ?? '{}',
    ) as Partial<MissionState>

    if (data.day !== day) {
      return fresh
    }

    const progress: Record<string, number> = {}

    for (const [id, value] of Object.entries(data.progress ?? {})) {
      if (typeof value === 'number' && value > 0) {
        progress[id] = Math.floor(value)
      }
    }

    return {
      day,
      progress,
      claimed: Array.isArray(data.claimed)
        ? data.claimed.filter((id): id is string => typeof id === 'string')
        : [],
    }
  } catch {
    return fresh
  }
}

export interface MissionStatus {
  mission: MissionTemplate
  progress: number
  done: boolean
}

export function missionStatuses(state: MissionState): MissionStatus[] {
  return missionsForDay(state.day).map((mission) => {
    const progress = Math.min(mission.target, state.progress[mission.id] ?? 0)

    return { mission, progress, done: progress >= mission.target }
  })
}

export interface MissionUpdate {
  state: MissionState
  /** Missões concluídas só nesta tentativa. */
  completed: MissionTemplate[]
  /** Ossos de recompensa a creditar. */
  reward: number
}

/** Soma o resultado da tentativa ao progresso do dia e paga as missões concluídas. */
export function recordMissions(
  stats: MissionStats,
  day: string = dateKey(),
  storage: WriteStorage = localStorage,
): MissionUpdate {
  const state = loadMissions(day, storage)
  const completed: MissionTemplate[] = []

  for (const mission of missionsForDay(day)) {
    if (state.claimed.includes(mission.id)) continue

    const total = (state.progress[mission.id] ?? 0) + mission.gain(stats)

    state.progress[mission.id] = Math.min(mission.target, total)

    if (total >= mission.target) {
      state.claimed.push(mission.id)
      completed.push(mission)
    }
  }

  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // sem armazenamento: o jogador vê o resultado, só não fica salvo
  }

  return {
    state,
    completed,
    reward: completed.reduce((sum, mission) => sum + mission.reward, 0),
  }
}
