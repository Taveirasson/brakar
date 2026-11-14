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
18. Explosão de coleta melhorada (vagalume/osso): 18 faíscas aditivas, anel que se expande e clarão. Testado no navegador.
19. Epílogos por noite (src/run/story.ts): cada fuga revela um pedaço novo da história (faróis, pegadas chamuscadas, coleira, lua vermelha, finais alternados). Testado no navegador.
20. Novo sprite do Estouro (public/assets/sprites/estouro.png, mesmo formato 128x64): bomba preta com pavio e faísca, olhos vermelhos furiosos; linha hunt com dentes e mais brilho. Gerado por script (canvas) no navegador; o antigo está no histórico do git. Combina com a arte do menu. Testado no jogo.
21. Derrota explosiva: ao ser pego o Estouro explode (bola de fogo, 60 faíscas, onda de choque, tremor, clarão) e o Pipoca some; tela de game over após 1 s. Testado no navegador.
22. Pipoca expressivo: treme de medo (rotação aleatória até 5°) quando o Estouro está perto (perigo > 0,55) e dá um pulinho (escala 1,22) ao coletar vagalume/osso. Testado no navegador (ângulo, escala e retorno ao normal).
23. Raios de lua: 9 feixes inclinados azulados (aditivos) que respiram e deslizam pela mata (GameEffects). Testado no navegador (sutil de propósito).
24. Dificuldade (Fácil/Normal/Difícil) em Configurações (src/config/difficulty.ts): fácil 0,85x velocidade e 0,75x visão do Estouro; difícil 1,12x e 1,2x; teto de 97% da velocidade do Pipoca. Salva em localStorage. Testado no navegador.
25. Controles de toque (celular/tablet): joystick virtual à esquerda e botão CORRER à direita, só em dispositivos com toque (HudScene + src/input/touchInput.ts). Testado com contexto de toque no navegador (movimento e parada).
26. Toque: botão de pausa (II) no HUD abaixo do minimapa (não existe ESC no celular) e dica de controles sem SHIFT/M em telas de toque. Testado no navegador.
27. Pausa com botão SOM: LIGADO/DESLIGADO (útil no celular, sem tecla M) e layout de 4 botões. Testado no navegador.
28. Minimapa útil: vagalumes (amarelo-limão), ossos (branco) e moitas (verde) aparecem nas células já visitadas e somem quando coletados. Testado no navegador.
29. Recordes no menu: canto superior esquerdo mostra recorde de noite, melhor fuga, fugas/capturas e conquistas X/6 (só aparece depois da primeira partida). Testado no navegador.
30. Celular/compartilhamento: favicon (🐕, tira o 404 do console), meta description e Open Graph, viewport sem zoom, CSS sem rolagem/seleção durante o jogo e aviso 'Gire o celular' em tela vertical de toque. Testado com emulação de celular.

NOVO FOCO pedido pelo usuário: (a) paredes/labirinto com mais saídas, (b) visual: efeitos e sprites melhores, (c) história no começo (cutscene). Próximas: efeitos de partículas/sprites melhores (sprites do Pipoca/Estouro, sombras sob os personagens, partículas de coleta, reforçar visual da saída/estrada).

Ideias pendentes (por ordem): itens com efeito, conquistas.
