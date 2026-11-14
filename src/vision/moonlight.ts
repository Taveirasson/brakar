/** Iluminação do mundo depois do apagão. */
export interface WorldLighting {
  /** Cor da luz ambiente (afeta árvores, chão e o Estouro). */
  ambientColor: number
  /** Quanto do mundo aparece fora do raio de visão (alfa da máscara). */
  worldVisibility: number
  /** Raio (px) em volta do Pipoca que fica bem visível. */
  visionRadius: number
}

/** Luz da lua, fria, que deixa enxergar em volta do Pipoca. */
export const NIGHT_LIGHTING: WorldLighting = {
  ambientColor: 0x8496c4,
  worldVisibility: 0.76,
  visionRadius: 90,
}
