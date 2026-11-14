# Loop de melhorias de jogabilidade

Feito:
1. Recordes (melhor tempo, fugas, capturas) em localStorage; tempo na tela de vitória/derrota; R/Espaço/Enter reinicia.
2. HUD (HudScene): cronômetro, contador de vagalumes e vinheta vermelha pulsante conforme o Estouro se aproxima. Testado no navegador (Edge headless via playwright-core no scratchpad; `window.__game` só em DEV).
3. Noites progressivas (runState + hunterSettingsForNight: +5% de velocidade por noite, teto abaixo do Pipoca), recorde de noite, HUD 'Noite N', vitória leva à próxima noite; derrota/menu/reiniciar voltam à noite 1. Testado no navegador.
4. Corrida com fôlego (Shift, 1,55x, ~2,6 s de fôlego, recupera em ~4,5 s; esgotado só volta a correr com 30%) + barra no HUD. Testado no navegador (165 -> 255 px/s).

Ideias pendentes (por ordem): sons, itens com efeito, isca de barulho, esconderijos, conquistas, compartilhar resultado.
