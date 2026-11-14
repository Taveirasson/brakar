import Phaser from 'phaser'
import { SCENE_KEYS } from '../config/sceneKeys'
import { trailEmitterConfig, TRAIL_TEXTURE_KEYS } from '../effects/trail'
import {
  PIPOCA_ANIMATIONS,
  PIPOCA_TEXTURE,
} from '../characters/characterAnimationRules'
import {
  ensureAnimations,
  loadCharacterSprites,
} from '../characters/characterAnimations'
import {
  createFireflyTexture,
  FIREFLY_TEXTURE,
} from '../characters/forestProps'
import { sfx } from '../audio/sfx'
import {
  SHOP_ITEMS,
  skinTint,
  trailStyle,
  type ShopItem,
} from '../run/shopItems'
import { buyAndEquip, loadWallet, type Wallet } from '../run/wallet'
import { createTextButton } from '../ui/createTextButton'
import { addBackdrop, addPanel, addText, FONT_FAMILY, THEME } from '../ui/theme'

const COLUMN_X = { skin: 500, trail: 750 }
const FIRST_ROW_Y = 128
const ROW_GAP = 54
const BUTTON_WIDTH = 230

/** Loja do Pipoca: gaste os ossos guardados em pelagens e rastros. */
export class ShopScene extends Phaser.Scene {
  private wallet!: Wallet
  private balance!: Phaser.GameObjects.Text
  private message!: Phaser.GameObjects.Text
  private preview?: Phaser.GameObjects.Sprite
  private trailPreview?: Phaser.GameObjects.Particles.ParticleEmitter
  private buttons = new Map<string, Phaser.GameObjects.Container>()

  constructor() {
    super(SCENE_KEYS.shop)
  }

  preload(): void {
    loadCharacterSprites(this)
  }

  create(): void {
    const centerX = this.scale.width / 2

    this.wallet = loadWallet()
    this.buttons.clear()

    addBackdrop(this, 1)
    addPanel(this, centerX, 270, 900, 500)
    addText(this, centerX, 52, 'LOJA DO PIPOCA', 'heading')

    this.balance = this.add
      .text(centerX, 90, '', {
        fontFamily: FONT_FAMILY,
        fontSize: '20px',
        color: THEME.title,
      })
      .setOrigin(0.5)

    addText(this, COLUMN_X.skin, 118, 'PELAGEM', 'muted')
    addText(this, COLUMN_X.trail, 118, 'RASTRO', 'muted')

    this.createPreview()

    for (const kind of ['skin', 'trail'] as const) {
      SHOP_ITEMS.filter((item) => item.kind === kind).forEach((item, index) => {
        this.createItemButton(
          item,
          COLUMN_X[kind],
          FIRST_ROW_Y + 24 + index * ROW_GAP,
        )
      })
    }

    this.message = this.add
      .text(215, 410, 'Ossos vêm das fugas: cada osso coletado conta.', {
        fontFamily: FONT_FAMILY,
        fontSize: '15px',
        color: THEME.muted,
        align: 'center',
        wordWrap: { width: 300 },
      })
      .setOrigin(0.5)

    createTextButton({
      scene: this,
      x: centerX,
      y: 474,
      label: 'VOLTAR',
      onClick: () => this.scene.start(SCENE_KEYS.menu),
    })

    this.input.keyboard?.on('keydown-ESC', () =>
      this.scene.start(SCENE_KEYS.menu),
    )
    this.refresh()
    this.cameras.main.fadeIn(300, 5, 10, 7)
  }

  private createPreview(): void {
    createFireflyTexture(this)
    this.makeTrailTextures()

    this.add
      .circle(215, 250, 110, 0x1a2a1f, 0.9)
      .setStrokeStyle(3, 0xe8c766, 0.6)

    if (ensureAnimations(this, PIPOCA_TEXTURE, PIPOCA_ANIMATIONS)) {
      this.preview = this.add.sprite(215, 250, PIPOCA_TEXTURE).setScale(5)
      this.preview.play('pipoca-idle')
      this.tweens.add({
        targets: this.preview,
        y: 244,
        duration: 900,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      })
    }
  }

  /** Texturas dos rastros que só existem durante o jogo (poeira e faísca). */
  private makeTrailTextures(): void {
    const dots: Array<[string, number, number]> = [
      ['dust', 6, 0x8a7356],
      ['spark', 4, 0xffb43c],
    ]

    for (const [key, size, color] of dots) {
      if (this.textures.exists(key)) continue

      const graphics = this.make.graphics({ x: 0, y: 0 })

      graphics.fillStyle(color, 0.5)
      graphics.fillCircle(size / 2, size / 2, size / 2)
      graphics.fillStyle(color, 1)
      graphics.fillCircle(size / 2, size / 2, size / 4)
      graphics.generateTexture(key, size, size)
      graphics.destroy()
    }

    if (!this.textures.exists('leaf')) {
      const graphics = this.make.graphics({ x: 0, y: 0 })

      graphics.fillStyle(0xffffff, 1)
      graphics.fillEllipse(4, 2.5, 7, 4)
      graphics.generateTexture('leaf', 8, 5)
      graphics.destroy()
    }
  }

  private createItemButton(item: ShopItem, x: number, y: number): void {
    const button = createTextButton({
      scene: this,
      x,
      y,
      label: this.labelFor(item),
      width: BUTTON_WIDTH,
      fontSize: 18,
      onClick: () => this.choose(item),
    })

    this.buttons.set(item.id, button)
  }

  private labelFor(item: ShopItem): string {
    const equipped =
      this.wallet.skin === item.id || this.wallet.trail === item.id

    if (equipped) return `✓ ${item.name}`
    if (this.wallet.owned.includes(item.id)) return item.name

    return `${item.name}  ·  ${item.price} ossos`
  }

  private choose(item: ShopItem): void {
    const result = buyAndEquip(item.id)

    this.wallet = result.wallet

    if (!result.ok) {
      sfx.rustle()
      this.message.setColor(THEME.danger)
      this.message.setText(`Faltam ${result.missing} ossos para ${item.name}.`)
    } else {
      sfx.pickup()
      this.message.setColor('#9fe870')
      this.message.setText(`${item.name} equipado!`)
    }

    this.refresh()
  }

  /** Atualiza saldo, rótulos dos botões e o preview (pelagem e rastro). */
  private refresh(): void {
    this.balance.setText(`Seus ossos: ${this.wallet.bones}`)

    for (const item of SHOP_ITEMS) {
      const text = this.buttons.get(item.id)?.list[1] as
        Phaser.GameObjects.Text | undefined

      text?.setText(this.labelFor(item))
    }

    this.preview?.setTint(skinTint(this.wallet.skin))

    this.trailPreview?.destroy()

    const style = trailStyle(this.wallet.trail)
    const key = TRAIL_TEXTURE_KEYS[style.texture]

    this.trailPreview = this.add.particles(
      215,
      this.preview ? 285 : 270,
      this.textures.exists(key) ? key : FIREFLY_TEXTURE,
      {
        ...trailEmitterConfig(style),
        x: { min: -26, max: 26 },
      },
    )
    this.trailPreview.setDepth(-1)
  }
}
