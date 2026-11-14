import { describe, expect, it } from 'vitest'
import { buildShareText } from './share'

describe('buildShareText', () => {
  it('fuga inclui noite, tempo e link', () => {
    const text = buildShareText(
      { night: 3, timeMs: 83500, escaped: true },
      'https://x.dev/brakar/',
    )

    expect(text).toContain('noite 3')
    expect(text).toContain('1:23.5')
    expect(text).toContain('https://x.dev/brakar/')
    expect(text).toContain('escapei')
  })

  it('derrota usa outro texto', () => {
    expect(
      buildShareText({ night: 2, timeMs: 5000, escaped: false }, 'u'),
    ).toContain('me pegou')
  })
})
