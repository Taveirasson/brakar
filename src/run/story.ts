/** Texto de história entre as noites: cada fuga revela um pedaço a mais. */
export interface Epilogue {
  headline: string
  detail: string
}

const EPILOGUES: Epilogue[] = [
  {
    headline: 'O Pipoca chegou à beira da estrada.',
    detail: 'Mas o carro já tinha seguido... e a mata continua.',
  },
  {
    headline: 'Ao longe, os faróis do carro piscaram duas vezes.',
    detail: 'A família está procurando. O Estouro também ouviu.',
  },
  {
    headline: 'Na lama havia pegadas redondas e chamuscadas.',
    detail: 'O Estouro não está só caçando: ele guarda alguma coisa.',
  },
  {
    headline: 'Entre as folhas, um laço de coleira brilhou.',
    detail: 'Outros cães já passaram por aqui. Nenhum voltou para casa.',
  },
  {
    headline: 'A lua ficou vermelha por um instante.',
    detail: 'O pavio do Estouro está mais curto. Falta pouco.',
  },
]

const FINAL_EPILOGUES: Epilogue[] = [
  {
    headline: 'A mata já conhece o cheiro do Pipoca.',
    detail: 'E o Estouro, o barulho das suas patas.',
  },
  {
    headline: 'Mais uma noite, mais um pedaço de estrada.',
    detail: 'Ninguém na história do Brakar foi tão longe.',
  },
]

/** Epílogo da fuga na noite dada (1 em diante); depois do último, alterna os finais. */
export function epilogueForNight(night: number): Epilogue {
  const index = Math.max(1, Math.floor(night)) - 1

  if (index < EPILOGUES.length) {
    return EPILOGUES[index]
  }

  return FINAL_EPILOGUES[(index - EPILOGUES.length) % FINAL_EPILOGUES.length]
}
