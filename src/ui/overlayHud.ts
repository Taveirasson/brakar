import Phaser from 'phaser'
import { SCENE_KEYS } from '../config/sceneKeys'

/** Mostra ou esconde o HUD e os avisos (telas por cima do jogo não devem ter texto do jogo atravessando). */
export function setGameHudVisible(scene: Phaser.Scene, visible: boolean): void {
  for (const key of [SCENE_KEYS.hud, SCENE_KEYS.notifications]) {
    if (scene.scene.manager.keys[key]) {
      scene.scene.setVisible(visible, key)
    }
  }
}
