import Phaser from 'phaser'
import './style.css'
import './ui/theme.css'
import { GameScene } from './scenes/GameScene'
import { MenuScene } from './scenes/MenuScene'
import { PauseScene } from './scenes/PauseScene'
import { VictoryScene } from './scenes/VictoryScene'
import { GameOverScene } from './scenes/GameOverScene'
import { LockedExitScene } from './scenes/LockedExitScene'
import { NotificationScene } from './scenes/NotificationScene'
import { ConfigurationScene } from './scenes/ConfigurationScene'

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
    GameOverScene,
    ConfigurationScene,
  ],

  dom: {
    createContainer: true,
  },
}

// O Phaser desenha o texto uma vez: espera a fonte do tema carregar (no máximo
// 1,5 s, para não travar sem internet) antes de criar o jogo.
const fontReady = document.fonts
  .load('20px "Pixelify Sans"')
  .catch(() => undefined)
const fontTimeout = new Promise((resolve) => setTimeout(resolve, 1500))

Promise.race([fontReady, fontTimeout]).then(() => {
  new Phaser.Game(config)
})
