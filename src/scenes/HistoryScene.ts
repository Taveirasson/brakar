import Phaser from 'phaser'
import { SCENE_KEYS } from '../config/sceneKeys'
import { loadDaily } from '../run/daily'
import { dailyHistory, loadHistory, shortDate } from '../run/history'
import { formatTime } from '../run/records'
import { loadSurvivalBest } from '../run/survival'
import { averageFirstFirefly, loadHook } from '../run/hook'
import { createTextButton } from '../ui/createTextButton'
import { addBackdrop, addPanel, addText, THEME } from '../ui/theme'

const LEFT_X = 330
const RIGHT_X = 770

/** Placar local: melhores fugas, últimos desafios do dia e recorde de sobrevivência. */
export class HistoryScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.history)
  }

  create(): void {
    const centerX = this.scale.width / 2

    addBackdrop(this, 1)
    addPanel(this, centerX, 270, 900, 500)
    addText(this, centerX, 52, 'HISTÓRICO', 'heading')

    addText(this, LEFT_X, 112, 'MELHORES FUGAS', 'muted', THEME.title)
    const best = loadHistory()

    this.addList(
      LEFT_X,
      best.map(
        (e, i) =>
          `${i + 1}º  ${formatTime(e.timeMs)}  ·  noite ${e.night}  ·  ${shortDate(e.date)}`,
      ),
      'Ainda sem fugas.',
    )

    addText(this, RIGHT_X, 112, 'DESAFIO DO DIA', 'muted', THEME.title)
    const days = dailyHistory(loadDaily().best)

    this.addList(
      RIGHT_X,
      days.map((d) => `${shortDate(d.date)}  ·  ${formatTime(d.timeMs)}`),
      'Nenhum desafio concluído.',
    )

    const survival = loadSurvivalBest()

    addText(
      this,
      centerX,
      350,
      survival.score > 0
        ? `Sobrevivência: ${survival.score} pontos  ·  ${survival.nights} ${survival.nights === 1 ? 'noite' : 'noites'}`
        : 'Sobrevivência: ainda sem corrida',
      'body',
    )

    const hook = loadHook()
    const average = averageFirstFirefly(hook)
    const first = hook.firstRun

    addText(
      this,
      centerX,
      395,
      [
        average === null
          ? 'Gancho: ainda sem dados'
          : `1º vagalume em ${(average / 1000).toFixed(1)} s (média das últimas ${hook.firstFireflyMs.length} partidas)`,
        first
          ? `1ª partida: vagalume em ${first.firstFireflyMs === null ? '—' : (first.firstFireflyMs / 1000).toFixed(1) + ' s'} · ${first.escaped === null ? 'sem fim' : first.escaped ? 'escapou' : 'foi pego'}`
          : '',
      ].filter(Boolean),
      'muted',
    )

    createTextButton({
      scene: this,
      x: centerX,
      y: 492,
      label: 'VOLTAR',
      onClick: () => this.scene.start(SCENE_KEYS.menu),
    })
    this.input.keyboard?.on('keydown-ESC', () =>
      this.scene.start(SCENE_KEYS.menu),
    )
    this.cameras.main.fadeIn(300, 5, 10, 7)
  }

  private addList(x: number, lines: string[], empty: string): void {
    if (lines.length === 0) {
      addText(this, x, 160, empty, 'muted')

      return
    }

    lines.forEach((line, index) => {
      addText(this, x, 152 + index * 30, line, 'body')
    })
  }
}
