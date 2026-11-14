/** Combo de vagalumes: pegar dois em sequência rápida rende ossos extras. */
export const COMBO_WINDOW_MS = 8000

/** Ossos extras por coletar depois de `previousAt` (null se foi o primeiro). */
export function comboBonus(previousAt: number | null, now: number): number {
  if (previousAt === null) return 0

  return now - previousAt <= COMBO_WINDOW_MS ? 2 : 0
}
