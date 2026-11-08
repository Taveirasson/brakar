# Brakar — Floresta em tilemap (Spec 1 de 2 da identidade visual)

Data: 2026-11-08

## Objetivo

Dar ao Brakar a identidade visual de **uma mata à noite**, trocando as paredes finas por árvores num tilemap de pixel art, **sem mudar as regras do jogo** (lanterna, caçador, itens, saída, minimapa).

Esta é a primeira de duas specs. A Spec 2 (personagens) virá depois; as decisões já tomadas para ela estão registradas abaixo para não se perderem.

### Critério de "pronto"

- O labirinto é desenhado como trilhas de terra entre árvores, com variação visual estável.
- Lanterna, sombras, colisão, caçador, itens, saída e minimapa funcionam como antes.
- O equilíbrio de perseguição é o mesmo (velocidades e distâncias escaladas proporcionalmente).
- Todos os testes existentes continuam passando, mais os novos desta spec.

## Contexto: a nova identidade (decidida no brainstorming)

- **Premissa:** numa noite de festa junina, o vira-lata **Pipoca** se assusta com os fogos, foge do passeio da família e se perde na mata. Um balão junino cai aceso e dá origem ao **Estouro**.
- **Protagonista:** Pipoca, vira-lata preto e branco (corpo preto; peito, focinho e ponta do rabo brancos). Tom: contraste fofo num mundo sombrio.
- **Caçador:** o Estouro, criatura de pólvora, papel queimado e faíscas; estala enquanto anda; atraído pela luz.
- **Itens:** 3 vagalumes por noite.
- **Saída:** clareira na beira da estrada com o farol do carro da família piscando ao longe; ao chegar, o carro já seguiu → próxima noite.
- **Arte:** Pipoca e Estouro em pixel art 32×32 (skill `pixel-art-sprites-32`); vagalumes, faíscas e brilhos com partículas do Phaser.

**Nesta spec entra apenas o cenário** (árvores, trilha, clareira). Pipoca, Estouro, vagalumes, farol do carro e textos da história são da Spec 2. Até lá, jogador, caçador, itens e marcador da saída continuam com as formas provisórias atuais.

## Decisões de design

### 1. Escala

- Tile de **32 px**.
- Cada célula lógica do labirinto ocupa **3 tiles** no eixo: corredor de **2 tiles (64 px)** + árvore de **1 tile (32 px)**. Passo da célula = **96 px** (antes: 64 px).
- Mundo de um labirinto `n × n` = `(3n + 1) × (3n + 1)` tiles.
- Para manter o equilíbrio, todas as constantes de movimento em pixels são multiplicadas por **1,5** num único ponto de configuração:
  - `PLAYER_SPEED` (110 → 165), drag do jogador (500 → 750);
  - `wanderSpeed`, `investigateSpeed`, `huntSpeed` do caçador;
  - `FLASHLIGHT_RADIUS` (200 → 300), para a lanterna continuar alcançando o mesmo número de células.
- Distâncias já medidas em células (`lightPerceptionRadiusCells`, `DARK_PERCEPTION_CELLS`) escalam sozinhas ao usar o passo de 96 px.
- Tamanhos de corpo (`PLAYER_SIZE = 16`, `HUNTER_SIZE = 18`), `PLAYER_DARK_VISION_RADIUS` e o zoom da câmera (4) **não mudam**.

### 2. Grade de tiles

Derivada do `MazeCell[][]` existente (o gerador não muda). Para a célula `(row, col)`, com origem em tiles `(3·row, 3·col)`:

- Tiles de canto (`3·row`, `3·col`) e as bordas externas do mundo: sempre **árvore**.
- Os 2 tiles da borda superior da célula: árvore se `walls.top`, senão trilha. Mesma regra para a borda esquerda com `walls.left`. Bordas direita/inferior são as bordas superior/esquerda da célula vizinha (ou a borda externa do mundo).
- Interior 2×2 da célula: sempre **trilha**.

Tipo de tile: `'tree' | 'path'`. O interior 2×2 da célula de saída é desenhado com o tile de **clareira** (continua sendo `'path'` para colisão).

### 3. Visual e assets

Tileset único `public/assets/tiles/forest.png`, tiles de 32×32, gerado com a skill `pixel-art-sprites-32`:

| Tile | Variações | Camada |
|---|---|---|
| Copa de árvore (vista de cima) | 3–4 | árvores (com colisão) |
| Arbusto denso | 1–2 | árvores (com colisão) |
| Trilha de terra | 2–3 | chão |
| Terra com tufo de grama/folhas | 2 | chão |
| Clareira (grama clara) | 1–2 | chão (célula de saída) |

- A variação de cada tile é escolhida por `pickTileVariant(row, column, variantCount)`: hash determinístico da coordenada (sem `Math.random`). Mesma noite → mesmo visual; nada muda entre frames.
- Ambas as camadas usam `setLighting(true)`. As árvores bloqueiam a luz via segmentos do raycast; o efeito de cone e a máscara de visão permanecem iguais.
- Minimapa: só as cores mudam (tons de verde-escuro e terra); a lógica por células continua.

## Arquitetura

### Novo módulo: `src/maze/MazeLayout.ts`

Única fonte de verdade sobre escala e conversão célula ↔ pixel. Funções puras:

| Função | Responsabilidade |
|---|---|
| `TILE_SIZE`, `CELL_PITCH` | Constantes (32 e 96). |
| `buildTileGrid(maze): TileType[][]` | Grade `(3n+1)²` segundo a seção 2. |
| `cellCenter(cell): Point` | Centro em px da célula (`96·col + 64`, `96·row + 64`). |
| `cellAt(point): CellPosition` | Célula lógica que contém o ponto (limitada ao labirinto). |
| `worldSize(mazeSize): number` | Lado do mundo em px (`(3n+1)·32`). |
| `wallSegmentsFromGrid(grid): Segment[]` | Bordas entre tiles `tree` e `path` (e borda do mundo), com segmentos colineares adjacentes unidos. |
| `pickTileVariant(row, column, count): number` | Variação determinística em `[0, count)`. |

### Mudanças em módulos existentes

| Arquivo | Mudança |
|---|---|
| `GameScene.ts` | `createMazeWalls`, `createCellWalls`, `createWall`, `drawFloorDetails` e o chão liso são substituídos por `createForest()`: monta o tilemap do Phaser a partir de `buildTileGrid` (camada de chão + camada de árvores com colisão), registra o collider jogador × árvores e preenche `wallSegments` com `wallSegmentsFromGrid`. Todos os usos de `CELL_SIZE` passam por `MazeLayout`. Carrega o tileset no `preload`. |
| `Hunter.ts` | Recebe as funções de layout (`cellCenter`) em vez de `cellSize`. |
| `hunterSettings.ts` | Velocidades padrão × 1,5. |
| Minimapa (no `GameScene`) | Só cores. |

### Não mudam

`MazeGenerator`, `MazePathFinder`, `hunterPerception`, `HunterBrain`, `MazeItemPlacement`, `lineOfSight` (continua recebendo segmentos), cenas de menu/pausa/vitória/derrota.

## Riscos

**Tilemap + iluminação + máscara no Phaser 4.2.** A máscara de visão usa `camera.filters.internal.addMask` (API do Phaser 4). **A primeira tarefa do plano é uma prova rápida:** um tilemap mínimo com `setLighting(true)` sob a luz e a máscara atuais. Se não funcionar, a alternativa é renderizar a mesma grade com `Image` estáticas por tile (mesma grade, mesmos segmentos, mesma colisão via `staticGroup` de blocos por tile ou por fileira unida); só o desenho muda.

## Tratamento de erros e casos de borda

- **Tileset ausente ou com erro de carregamento:** o jogo gera texturas de cor sólida no código (verde-escuro para árvore, marrom para trilha, verde-claro para clareira) e segue normalmente.
- **Caçador × jogador encostado na árvore:** o caçador anda pelo centro da célula; com corredor de 64 px a situação é parecida com a de hoje (59 px), mas a correção do commit `4860157` precisa ser revalidada (teste + playtest).
- **Quinas e inércia:** se o jogador enroscar nas quinas das árvores, a hitbox pode passar a circular (`setCircle`). Ajuste por playtest, não requisito.
- **Desempenho:** 20×20 → 61×61 tiles (~3.700), tranquilo para tilemap. A união de segmentos colineares mantém baixo o custo dos 181 raios por frame.

## Testes

Vitest, unitários:

- `buildTileGrid`: labirinto 2×2 fixo gera a grade 7×7 esperada; bordas externas e cantos sempre `tree`; parede ausente vira `path`; interior das células sempre `path`.
- `cellCenter` / `cellAt`: ida e volta para todas as células de um labirinto pequeno; pontos nas bordas da célula e sobre uma árvore caem na célula certa; pontos fora do mundo são limitados.
- `wallSegmentsFromGrid`: bloco de árvore isolado → 4 segmentos; fileira de árvores → segmentos unidos (não um por tile).
- `pickTileVariant`: determinístico e dentro de `[0, count)`.
- Testes existentes (BFS, percepção, `HunterBrain`, linha de visão) continuam passando.

Playtest manual: lanterna e sombras nas árvores, colisão nas quinas, caçador alcançando o jogador encostado na árvore, minimapa, itens nos becos e clareira na saída.

## Fora do escopo

- Pipoca, Estouro, vagalumes, farol do carro e textos da história (Spec 2).
- Mudanças na geração do labirinto ou nas regras de jogo.
- Som da floresta.
- Copas de árvore que se sobrepõem à trilha (camadas de profundidade/oclusão).
