import { formatTime } from './records'

export interface ShareInput {
  night: number
  timeMs: number
  escaped: boolean
}

/** Texto curto para colar no chat/redes, com o link do jogo. */
export function buildShareText(input: ShareInput, url: string): string {
  const result = input.escaped
    ? `escapei do Estouro na noite ${input.night} em ${formatTime(input.timeMs)}`
    : `o Estouro me pegou na noite ${input.night} (${formatTime(input.timeMs)})`

  return `BRAKAR 🐕💣 ${result}. Consegue fazer melhor? ${url}`
}

/** Copia para a área de transferência; devolve se conseguiu. */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    try {
      const area = document.createElement('textarea')

      area.value = text
      area.style.position = 'fixed'
      area.style.opacity = '0'
      document.body.appendChild(area)
      area.select()

      const ok = document.execCommand('copy')

      area.remove()

      return ok
    } catch {
      return false
    }
  }
}
