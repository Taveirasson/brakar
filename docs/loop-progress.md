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

## FASE 2 — Retenção (usuário autorizou mudar o jogo sem medo; vale para PC e celular)

Ordem planejada (marque ao concluir):
1. [x] Desafio do dia: mesmo labirinto para todos no dia (semente = data), sequência de dias seguidos, melhor tempo do dia, botão no menu, compartilhar com 🔥. src/run/seed.ts, src/run/daily.ts. Testado (mesmo labirinto em dois carregamentos).
2. [x] Meta-progressão: ossos coletados + bônus de fuga (3 + noite-1) viram moeda salva (src/run/wallet.ts); ShopScene com 4 pelagens (tint) e 3 rastros de patas (folhas, brasas, estrelas) com preview; botão LOJA no menu (menu agora: INICIAR, DESAFIO, LOJA, HISTÓRIA/AJUSTES). Testado (compra, equipar, tint e rastro no jogo, banco de ossos).
3. [x] Modificadores de noite (src/run/modifiers.ts): Névoa densa, Lua nova, Estouro veloz, Faro aguçado, Brejo, Sem ossos, Lua cheia. Noite 1 sem; noites 2-3 um; 4+ dois; o Desafio do dia sempre tem um (sorteado pela semente). Aviso ao apagar as luzes, rótulo ⚠ no HUD e bônus de ossos ao escapar. Testado no navegador. (Estouro duplo ficou para o item 8: exige vários caçadores.)
4. [x] Power-ups (src/run/powerups.ts): orbes no chão (3 por noite no 10x10, um de cada tipo): Escudo (absorve uma captura, atordoa o Estouro 2,5 s e protege 3 s), Pata veloz (+30% por 6 s) e Mapa da mata (revela o minimapa). Anel do escudo, rótulos no HUD, pontos coloridos no minimapa. Testado no navegador (coleta dos 3 tipos, escudo absorvendo a captura).
5. [x] Missões do dia (src/run/missions.ts): 3 sorteadas pela data (esconder, ossos, vagalumes, fugas, power-ups, fuga sem ser caçado, noite 3), progresso somado entre tentativas e recompensa em ossos paga uma vez; painel no canto do menu e aviso nas telas de fim. Testado no navegador (menu). Semanais ficaram de fora.
6. [x] Modo sobrevivência (src/run/survival.ts): botão SOBREVIVÊNCIA no menu, labirinto 8x8, noites seguidas sem fim; cada fuga dá pontos (base por noite + ossos + moitas + rapidez), pontos no HUD, derrota mostra pontuação e recorde (pontos e noites). Testado no navegador (vitória, derrota, recorde).
7. [x] Tutorial interativo (src/run/tutorial.ts): na 1ª partida normal, instruções no topo do HUD que avançam quando o jogador faz a ação (andar, correr, pegar vagalume, esconder-se); texto próprio para toque; salvo ao concluir e substitui as dicas antigas. Testado no navegador.
8. [x] Coruja (src/run/owl.ts, GameScene): a partir da noite 2 (não no desafio do dia) pousa num corredor; se o Pipoca passa a < 110 px sem estar escondido, pia (som + aviso), o Estouro que vaga vai investigar o local (HunterBrain.hearNoise) e ela voa e pousa em outro lugar após 14 s. Testado no navegador. Estouro duplo/filhote ficou de fora (exige vários caçadores).
9. [x] Histórico (src/run/history.ts, HistoryScene): top 5 fugas do modo normal (tempo, noite, data), últimos 8 dias do desafio e recorde de sobrevivência; abre ao clicar em "▸ Ver histórico" no canto do menu. Testado no navegador.


## FASE 3 — Abertura (primeiro minuto) — CONCLUÍDA (itens 1-9)

Problema: a partida começa com a fase "litExploration": o jogador atravessa o labirinto inteiro, sem Estouro, sem vagalumes e sem recompensa, até o farol da célula mais distante (`findFarthestCell`), só para abrir o painel "O CARRO JÁ SE FOI" (LockedExitScene). Depois o jogo de verdade começa e a saída é reaproveitada no fim. Resultado: 30-90 s de caminhada sem decisão antes da 1ª ação.

O que a pesquisa indica (blogs de design, anedótico, sem estudo formal; fontes no fim):
- O 1º minuto decide: a maior parte do abandono acontece na 1ª run; abertura sem interação derruba retenção.
- Ensine pouco no começo (movimento + objetivo), o resto aparece depois.
- Laços curtos e recompensas em várias escalas: micro (segundos), da noite (minutos), do dia (missões/sequência). Já temos as duas últimas; falta a micro no começo.
- Deixe interromper e reiniciar sem custo (celular): recomeçar tem de ser instantâneo.
- Recompensa variável com moderação: escolhas por run (roguelike) dão vontade de "mais uma".

Ideia central: o carro vai embora do PONTO DE PARTIDA (o Pipoca cai/fica para trás) e a noite começa já. A saída (estrada) continua na célula mais distante e só acende com os vagalumes, como já é hoje.

Ordem planejada (marque ao concluir; cada item testado no navegador e commitado):
1. [x] (feito: cena de 3,2 s com o carro saindo do início, qualquer tecla/toque pula; LockedExitScene removida; tempo não conta na abertura; testado) Abertura instantânea: remover a caminhada iluminada. Cena curta (~3-4 s, qualquer tecla/toque pula): carro sai do ponto inicial com os faróis, luzes apagam, o objetivo aparece num banner no HUD ("Junte 3 vagalumes"). No lugar do painel modal LockedExitScene. Tempo até a 1ª ação < 5 s. Cuidar: modo diário (semente), sobrevivência, tutorial e `handlePlayerFoundExit`.
2. [x] (feito: findNearStartCell em MazeItemPlacement; o vagalume mais próximo fica a 3-5 passos, usa o random da partida; sem osso extra; testado em 4 partidas) Primeira recompensa em ~10 s: o 1º vagalume sempre nasce perto do início (2-3 células, usando o `random` da partida para o diário continuar igual para todos) e um osso no caminho. Poeira de brilho/rastro leve apontando para ele.
3. [x] (feito: hunterGraceMs, 12 s na noite 1 e 8 s nas outras; aviso "O ESTOURO ACORDOU!" com som; testado) Período de graça do Estouro: ele só aparece depois de ~8 s (noite 1: ~12 s), com aviso sonoro e '?' distante antes de começar a vagar. Dá tempo de aprender sem punição e cria tensão.
4. [x] (feito: seta no HUD para o vagalume mais próximo e, com a saída aberta, para a estrada em dourado; some após 2 fugas totais; testado) Bússola de vagalume: seta discreta na borda da tela apontando para o vagalume mais próximo ainda não pego, some depois que o jogador já fez 2 fugas ou ao usar o Mapa da mata. Menos vagueio sem rumo.
5. [x] (feito: popups +1 e +1 osso no mundo, combo de 2 vagalumes em 8 s = +2 ossos, bolinhas de progresso no HUD; testado) Micro-recompensas: popups "+1", sequência de coletas rápidas (combo de vagalumes em <8 s dá bônus de ossos), som/brilho crescente, barra de progresso do objetivo no HUD.
6. [x] (feito: consumeOpening/resetOpening em runState; a cena do carro só toca na 1ª noite vinda do menu; retentativa e noites seguintes entram direto no escuro, fade 250 ms e aviso "NOITE N"; testado) Reinício instantâneo: tentar de novo pula qualquer cena/painel e entra direto no escuro (sem abertura do carro); mostrar "Noite N" em ~1 s. Botão de pausa/retomar sem custo no celular.
7. [x] (feito: src/run/boons.ts + BoonScene; 7 bênçãos, 1 de 3 antes de cada noite 2+ no normal/sobrevivência, valem até o fim da corrida, não no desafio do dia; testado) Escolha de bênção a cada noite (roguelike): antes da noite 2+, escolher 1 de 3 efeitos pequenos (ex.: +fôlego, Estouro lento nos primeiros 20 s, vagalumes brilham mais, 1 escudo inicial). Dá motivo para "mais uma noite".
8. [x] (feito: ordem andar -> vagalume (seta) -> correr -> moita; termina sozinho ao pegar os 3 vagalumes; dicas antigas só 1 partida e sem o aviso do Estouro; testado) Ajustar o tutorial à nova abertura (movimento + objetivo primeiro; correr/moita só depois do 1º vagalume) e encurtar dicas.
9. [x] (feito: src/run/hook.ts; tempo até o 1º vagalume e resultado da 1ª partida, na tela HISTÓRICO; testado) Medir o gancho localmente (sem rede): tempo até o 1º vagalume e fugas na 1ª partida, mostrados no HISTÓRICO, para comparar antes/depois.

Fontes da pesquisa: wayline.io (tutorial UX, retenção em roguelikes), game-wisdom.com (onboarding, 'frictionless hook'), finalboss.io (hook rate), gdevelop.io/blog/casual-game-loops, gameanalytics.com (appointment mechanics), gamedesignbites (retenção em baixa atenção). Todas são blogs de praticantes; números específicos citados lá não foram verificados.

## FASE 4 — Polimento de UX/UI (auditoria por captura de tela em 1100x650 e celular 844x390; o jogo é 960x540 e escala FIT)

Problemas achados na auditoria (screenshots em PC e celular deitado):
- Aviso de notificação: o texto vaza para fora da caixa e cobre o HUD (bolinhas/dica de controles); o rótulo do tutorial (y=70) briga com o aviso.
- Telas por cima do jogo (pausa, vitória, derrota) deixam o HUD e o texto do tutorial aparecendo por trás/por cima do painel.
- Menu: linha HISTÓRIA/AJUSTES mais larga que a coluna de botões e desalinhada; painel de recordes com 6 linhas; "Ver histórico" não parece botão; missões do dia sobre o pavio da bomba, sem fundo.
- Histórico: colunas calculadas para 1100 de largura (jogo é 960), então ficam assimétricas.
- Vitória/derrota: linhas de estatística coladas, troféus quase encostando no botão; texto longo sem quebra.
- Configurações: botões de larguras diferentes; Bênçãos: descrição colada no botão e a última encosta na borda do painel; Loja: "Seus ossos" colado nos rótulos.
- Celular: textos pequenos demais (escala 0,72), botões baixos para o toque, abertura sem dica de toque.

Ordem planejada (marque ao concluir; cada item conferido por captura e commitado):
1. [x] (feito, conferido por captura) Notificações: caixa se ajusta ao texto (quebra de linha, largura máx.), posição que não cobre o HUD; tutorial vai para a parte de baixo.
2. [x] (feito: ui/overlayHud.ts; conferido por captura) Esconder o HUD e as notificações enquanto pausa/vitória/derrota/bênção estão abertas; restaurar ao voltar.
3. [x] (feito: linha inferior alinhada, recordes em 2-4 linhas + botão HISTÓRICO, missões em painel; títulos das missões encurtados; conferido por captura) Menu: linha inferior alinhada à coluna, recordes compactos (4 linhas), "Ver histórico" como botão pequeno, missões com fundo translúcido sem cobrir a bomba.
4. [x] (feito, conferido por captura) Histórico: colunas centradas em 960, espaçamento e alinhamento das listas.
5. [x] (feito: painel 440, conquistas com quebra de linha via addAchievements; conferido por captura) Vitória/derrota: ritmo vertical (estatísticas, conquistas com quebra de linha, botões), painel com folga.
6. [x] (feito, conferido por captura) Configurações, Bênçãos e Loja: larguras iguais, espaçamentos e margens.
7. [x] (feito: isTouchDevice, textos +1-2 px no toque, dicas de toque nas telas de fim, botão PULAR na história; conferido por captura) Celular: fontes mínimas maiores, botões mais altos em tela de toque, dica de toque na história e nas telas.
8. [ ] Teclado no menu: setas + Enter navegam pelos botões (foco visível), ESC volta nas subtelas.
9. [ ] Nova rodada de captura (PC e celular) para conferir tudo e corrigir o que sobrou.
