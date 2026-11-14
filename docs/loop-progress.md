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
9. Conquistas (src/run/achievements.ts): Primeira fuga, Fantasma, Relâmpago, Mestre das moitas, Roedor de ossos, Coruja; salvas e exibidas nas telas de fim. Testado no navegador.
10. Dicas de primeira vez: nas 2 primeiras partidas (noite 1) três avisos em sequência explicam Estouro, Shift, moitas, ossos e lama. Testado no navegador.
11. Aviso do Estouro: '?' amarelo quando ele passa a investigar e '!' vermelho + som agudo quando passa a caçar, seguindo ele por ~1 s. Dá tempo de reagir. Testado no navegador.
12. Labirinto com ciclos (src/maze/mazeBraiding.ts): metade dos becos ganha passagem e há ~0,8 passagens extras por linha; 4 becos restantes em 100 células (antes ~15). Rotas alternativas de fuga. Testado (visão geral no navegador).
13. Cutscene de abertura (IntroScene): 4 cenas com a arte do menu em 'câmera lenta' (zoom/pan e cor por cena), texto digitando, Espaço/Enter/clique avança, ESC pula. Aparece no primeiro INICIAR; botão HISTÓRIA no menu revê. Testado no navegador.
14. Visual: folhas caindo em volta do Pipoca (cores variadas), névoa rasteira à deriva e brilho vermelho/laranja pulsante no Estouro que ilumina chão e árvores (mais forte caçando). Em GameEffects. Testado no navegador.
15. Confete colorido na tela de vitória e fade-in ao entrar no jogo. Testado no navegador.
DESCARTADO pelo usuário: sombras no chão sob Pipoca/Estouro (ficaram ruins; revertido). Não repetir.
16. Farol da saída com halo luminoso: fraco e pulsante trancado; ao destrancar cresce e brilha forte (guia para achar a estrada de longe). Testado no navegador.
17. Menu com vida: arte 'respirando' (zoom lento), olhos do Estouro pulsando em vermelho, faíscas no pavio e título flutuando. Testado no navegador.

NOVO FOCO pedido pelo usuário: (a) paredes/labirinto com mais saídas, (b) visual: efeitos e sprites melhores, (c) história no começo (cutscene). Próximas: efeitos de partículas/sprites melhores (sprites do Pipoca/Estouro, sombras sob os personagens, partículas de coleta, reforçar visual da saída/estrada).

Ideias pendentes (por ordem): itens com efeito, conquistas.
