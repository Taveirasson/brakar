/** Itens da loja do Pipoca: pelagens (cor) e rastros (partículas das patas). */
export type TrailTexture = 'dust' | 'leaf' | 'spark' | 'firefly'

export interface TrailStyle {
  texture: TrailTexture
  tint?: number[]
  scale: number
  /** Partículas sobem em vez de ficar no chão. */
  rise?: boolean
}

export interface ShopItem {
  id: string
  kind: 'skin' | 'trail'
  name: string
  price: number
  /** Cor aplicada ao sprite do Pipoca (pelagens). */
  tint?: number
  trail?: TrailStyle
}

export const DEFAULT_SKIN = 'skin-original'
export const DEFAULT_TRAIL = 'trail-dust'

export const SHOP_ITEMS: ShopItem[] = [
  {
    id: DEFAULT_SKIN,
    kind: 'skin',
    name: 'Original',
    price: 0,
    tint: 0xffffff,
  },
  {
    id: 'skin-caramelo',
    kind: 'skin',
    name: 'Caramelo',
    price: 12,
    tint: 0xffb878,
  },
  { id: 'skin-menta', kind: 'skin', name: 'Menta', price: 15, tint: 0x9fe8c0 },
  { id: 'skin-rosa', kind: 'skin', name: 'Rosa', price: 20, tint: 0xffa0c8 },
  {
    id: 'skin-dourado',
    kind: 'skin',
    name: 'Dourado',
    price: 35,
    tint: 0xffe27a,
  },
  {
    id: DEFAULT_TRAIL,
    kind: 'trail',
    name: 'Poeira',
    price: 0,
    trail: { texture: 'dust', scale: 1 },
  },
  {
    id: 'trail-folhas',
    kind: 'trail',
    name: 'Folhas',
    price: 15,
    trail: {
      texture: 'leaf',
      tint: [0x4f8a3a, 0x6aa84f, 0xa8863a],
      scale: 1.4,
    },
  },
  {
    id: 'trail-brasas',
    kind: 'trail',
    name: 'Brasas',
    price: 20,
    trail: {
      texture: 'spark',
      tint: [0xff5a2a, 0xffb43c, 0xff8a2a],
      scale: 1.3,
      rise: true,
    },
  },
  {
    id: 'trail-estrelas',
    kind: 'trail',
    name: 'Estrelas',
    price: 25,
    trail: {
      texture: 'firefly',
      tint: [0xfff2b0, 0xffd36a, 0xffffff],
      scale: 0.9,
      rise: true,
    },
  },
]

export function findItem(id: string): ShopItem | undefined {
  return SHOP_ITEMS.find((item) => item.id === id)
}

export function skinTint(skinId: string): number {
  return findItem(skinId)?.tint ?? 0xffffff
}

export function trailStyle(trailId: string): TrailStyle {
  return (
    findItem(trailId)?.trail ?? (findItem(DEFAULT_TRAIL)?.trail as TrailStyle)
  )
}
