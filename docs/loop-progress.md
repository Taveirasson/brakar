# Loop de melhorias de jogabilidade

Feito:
1. Recordes (melhor tempo, fugas, capturas) em localStorage; tempo na tela de vitória/derrota; R/Espaço/Enter reinicia.
2. HUD (HudScene): cronômetro, contador de vagalumes e vinheta vermelha pulsante conforme o Estouro se aproxima. Testado no navegador (Edge headless via playwright-core no scratchpad; `window.__game` só em DEV).
3. Noites progressivas (runState + hunterSettingsForNight: +5% de velocidade por noite, teto abaixo do Pipoca), recorde de noite, HUD 'Noite N', vitória leva à próxima noite; derrota/menu/reiniciar voltam à noite 1. Testado no navegador.
4. Corrida com fôlego (Shift, 1,55x, ~2,6 s de fôlego, recupera em ~4,5 s; esgotado só volta a correr com 30%) + barra no HUD. Testado no navegador (165 -> 255 px/s).
5. Esconderijos: moitas redondas nos corredores (6 em 10x10, longe de itens/saída/início), canto da célula a 22 px do centro. Dentro delas (sem correr e com o Estouro a >= 1 célula) o Pipoca fica translúcido, a caçada vira investigação e ele só percebe encostando (16 px). Rótulo ESCONDIDO no HUD. Testado no navegador. (Isca de barulho: descartada pelo usuário.)
6. Moitas maiores (raio de esconder 14 -> 26, sprite 1,25x). Novidades no labirinto: poças de lama (freiam Pipoca a 70% e Estouro a 45%, aparecem desde a fase clara) e ossos (devolvem o fôlego todo). Testado no navegador.
7. Sons sintetizados com Web Audio (src/audio/sfx.ts, sem arquivos): coleta, farol, farfalhar na moita, captura, vitória, batimento cardíaco conforme o perigo e zumbido da mata; tecla M liga/desliga (salvo). Testado sem erros no navegador (não dá para ouvir em headless).
8. Compartilhar resultado: tecla C (ou clique) nas telas de vitória/derrota copia 'BRAKAR 🐕💣 ... Consegue fazer melhor? <link>'. Testado no navegador (clipboard).

Ideias pendentes (por ordem): itens com efeito, conquistas.
