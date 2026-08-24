import Phaser from 'phaser'
import './style.css'
import { GameScene } from './scenes/GameScene'
import { MenuScene } from './scenes/MenuScene'
import { PauseScene } from './scenes/PauseScene'

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.WEBGL,
  parent: 'game',

  width: 960,
  height: 540,
  backgroundColor: '#09070f',

  pixelArt: true,
  antialias: false,

  physics: {
    default: 'arcade',
    arcade: {
      gravity: {
        x: 0,
        y: 0,
      },
      debug: false,
    },
  },

  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },

  scene: [MenuScene, GameScene, PauseScene],
}

new Phaser.Game(config)
