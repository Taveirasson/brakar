# Loop de melhorias de jogabilidade

Feito:
1. Recordes (melhor tempo, fugas, capturas) em localStorage; tempo na tela de vitória/derrota; R/Espaço/Enter reinicia.
2. HUD (HudScene): cronômetro, contador de vagalumes e vinheta vermelha pulsante conforme o Estouro se aproxima. Testado no navegador (Edge headless via playwright-core no scratchpad; `window.__game` só em DEV).
3. Noites progressivas (runState + hunterSettingsForNight: +5% de velocidade por noite, teto abaixo do Pipoca), recorde de noite, HUD 'Noite N', vitória leva à próxima noite; derrota/menu/reiniciar voltam à noite 1. Testado no navegador.
4. Corrida com fôlego (Shift, 1,55x, ~2,6 s de fôlego, recupera em ~4,5 s; esgotado só volta a correr com 30%) + barra no HUD. Testado no navegador (165 -> 255 px/s).
5. Esconderijos: moitas redondas nos corredores (6 em 10x10, longe de itens/saída/início), canto da célula a 22 px do centro. Dentro delas (sem correr e com o Estouro a >= 1 célula) o Pipoca fica translúcido, a caçada vira investigação e ele só percebe encostando (16 px). Rótulo ESCONDIDO no HUD. Testado no navegador. (Isca de barulho: descartada pelo usuário.)

Ideias pendentes (por ordem): sons, itens com efeito, conquistas, compartilhar resultado.
