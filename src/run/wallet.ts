import {
  DEFAULT_SKIN,
  DEFAULT_TRAIL,
  findItem,
  type ShopItem,
} from './shopItems'

/** Ossos guardados, itens comprados e o que o Pipoca está usando. */
export interface Wallet {
  bones: number
  owned: string[]
  skin: string
  trail: string
}

const STORAGE_KEY = 'brakar-wallet'

type ReadStorage = Pick<Storage, 'getItem'>
type WriteStorage = Pick<Storage, 'getItem' | 'setItem'>

export function defaultWallet(): Wallet {
  return {
    bones: 0,
    owned: [DEFAULT_SKIN, DEFAULT_TRAIL],
    skin: DEFAULT_SKIN,
    trail: DEFAULT_TRAIL,
  }
}

export function loadWallet(storage: ReadStorage = localStorage): Wallet {
  const wallet = defaultWallet()

  try {
    const data = JSON.parse(
      storage.getItem(STORAGE_KEY) ?? '{}',
    ) as Partial<Wallet>

    if (typeof data.bones === 'number' && data.bones > 0) {
      wallet.bones = Math.floor(data.bones)
    }

    if (Array.isArray(data.owned)) {
      for (const id of data.owned) {
        if (
          typeof id === 'string' &&
          findItem(id) &&
          !wallet.owned.includes(id)
        ) {
          wallet.owned.push(id)
        }
      }
    }

    if (typeof data.skin === 'string' && wallet.owned.includes(data.skin)) {
      wallet.skin = data.skin
    }

    if (typeof data.trail === 'string' && wallet.owned.includes(data.trail)) {
      wallet.trail = data.trail
    }
  } catch {
    // dado corrompido ou sem armazenamento: carteira vazia
  }

  return wallet
}

function save(wallet: Wallet, storage: Pick<Storage, 'setItem'>): void {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(wallet))
  } catch {
    // sem armazenamento: vale só nesta sessão
  }
}

export function addBones(
  amount: number,
  storage: WriteStorage = localStorage,
): Wallet {
  const wallet = loadWallet(storage)

  wallet.bones += Math.max(0, Math.floor(amount))
  save(wallet, storage)

  return wallet
}

export type PurchaseResult =
  | { ok: true; wallet: Wallet }
  | { ok: false; reason: 'unknown' | 'poor'; missing?: number; wallet: Wallet }

/** Compra (se ainda não tem) e equipa o item. */
export function buyAndEquip(
  itemId: string,
  storage: WriteStorage = localStorage,
): PurchaseResult {
  const wallet = loadWallet(storage)
  const item: ShopItem | undefined = findItem(itemId)

  if (!item) {
    return { ok: false, reason: 'unknown', wallet }
  }

  if (!wallet.owned.includes(item.id)) {
    if (wallet.bones < item.price) {
      return {
        ok: false,
        reason: 'poor',
        missing: item.price - wallet.bones,
        wallet,
      }
    }

    wallet.bones -= item.price
    wallet.owned.push(item.id)
  }

  if (item.kind === 'skin') {
    wallet.skin = item.id
  } else {
    wallet.trail = item.id
  }

  save(wallet, storage)

  return { ok: true, wallet }
}

/** Ossos ganhos numa tentativa: os coletados mais um bônus pela fuga e pela noite. */
export function bonesForRun(
  collected: number,
  escaped: boolean,
  night: number,
): number {
  const bonus = escaped ? 3 + Math.max(0, night - 1) : 0

  return Math.max(0, collected) + bonus
}
