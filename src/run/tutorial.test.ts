import { describe, expect, it } from 'vitest'
import { Tutorial, isTutorialDone, markTutorialDone } from './tutorial'

describe('tutorial', () => {
  it('avança conforme as ações, em qualquer ordem', () => {
    const tutorial = new Tutorial()

    expect(tutorial.current()?.event).toBe('moved')
    tutorial.report('sprinted')
    expect(tutorial.current()?.event).toBe('moved')
    tutorial.report('moved')
    expect(tutorial.current()?.event).toBe('firefly')
    tutorial.report('firefly')
    expect(tutorial.current()?.event).toBe('hid')
    tutorial.report('hid')
    expect(tutorial.finished).toBe(true)
  })

  it('lembra quando foi concluído', () => {
    let value: string | null = null
    const storage = {
      getItem: () => value,
      setItem: (_k: string, v: string) => {
        value = v
      },
    }

    expect(isTutorialDone(storage)).toBe(false)
    markTutorialDone(storage)
    expect(isTutorialDone(storage)).toBe(true)
  })
})
