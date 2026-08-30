import Phaser from 'phaser'
import './style.css'
import { GameScene } from './scenes/GameScene'
import { MenuScene } from './scenes/MenuScene'
import { PauseScene } from './scenes/PauseScene'
import { VictoryScene } from './scenes/VictoryScene'
import { LockedExitScene } from './scenes/LockedExitScene'
import { NotificationScene } from './scenes/NotificationScene'

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

  scene: [
    MenuScene,
    GameScene,
    PauseScene,
    LockedExitScene,
    NotificationScene,
    VictoryScene,
  ],
}

new Phaser.Game(config)
