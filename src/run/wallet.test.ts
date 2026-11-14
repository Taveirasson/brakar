import { describe, expect, it } from 'vitest'
import { addBones, bonesForRun, buyAndEquip, loadWallet } from './wallet'

function fakeStorage() {
  let value: string | null = null

  return {
    getItem: () => value,
    setItem: (_k: string, v: string) => {
      value = v
    },
  }
}

describe('wallet', () => {
  it('começa com o básico equipado e zero ossos', () => {
    const wallet = loadWallet(fakeStorage())

    expect(wallet.bones).toBe(0)
    expect(wallet.skin).toBe('skin-original')
    expect(wallet.trail).toBe('trail-dust')
  })

  it('acumula ossos', () => {
    const storage = fakeStorage()

    addBones(5, storage)

    expect(addBones(3, storage).bones).toBe(8)
  })

  it('compra, desconta e equipa; item já comprado só equipa', () => {
    const storage = fakeStorage()

    addBones(20, storage)

    const bought = buyAndEquip('skin-caramelo', storage)

    expect(bought.ok).toBe(true)
    expect(loadWallet(storage).bones).toBe(8)
    expect(loadWallet(storage).skin).toBe('skin-caramelo')

    buyAndEquip('skin-original', storage)
    buyAndEquip('skin-caramelo', storage)

    expect(loadWallet(storage).bones).toBe(8)
    expect(loadWallet(storage).skin).toBe('skin-caramelo')
  })

  it('sem ossos suficientes não compra e informa quanto falta', () => {
    const storage = fakeStorage()

    addBones(5, storage)

    const result = buyAndEquip('skin-rosa', storage)

    expect(result.ok).toBe(false)
    expect(!result.ok && result.missing).toBe(15)
    expect(loadWallet(storage).owned).not.toContain('skin-rosa')
  })

  it('id desconhecido e dado corrompido não quebram', () => {
    expect(buyAndEquip('nao-existe', fakeStorage()).ok).toBe(false)
    expect(loadWallet({ getItem: () => '{lixo' }).bones).toBe(0)
  })

  it('bônus por fuga cresce com a noite', () => {
    expect(bonesForRun(2, false, 3)).toBe(2)
    expect(bonesForRun(2, true, 1)).toBe(5)
    expect(bonesForRun(2, true, 3)).toBe(7)
  })
})
