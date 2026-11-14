import { describe, expect, it } from 'vitest'
import { COMBO_WINDOW_MS, comboBonus } from './combo'

describe('comboBonus', () => {
  it('não dá bônus no primeiro vagalume', () => {
    expect(comboBonus(null, 1000)).toBe(0)
  })

  it('dá bônus dentro da janela e não dá depois dela', () => {
    expect(comboBonus(1000, 1000 + COMBO_WINDOW_MS)).toBe(2)
    expect(comboBonus(1000, 1001 + COMBO_WINDOW_MS)).toBe(0)
  })
})
