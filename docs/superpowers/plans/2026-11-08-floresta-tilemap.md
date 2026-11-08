# Floresta em tilemap — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Trocar as paredes finas do labirinto por uma mata em tilemap de pixel art (árvores, trilha, clareira), sem mudar as regras do jogo.

**Architecture:** Um módulo puro `MazeLayout` vira a única fonte de verdade sobre escala: deriva do `MazeCell[][]` existente uma grade de tiles `(3n+1)²`, converte célula ↔ pixel e gera os segmentos para o raycast. Um módulo puro `forestTileset` mapeia cada tile para um frame do tileset. O `GameScene` monta um tilemap do Phaser (camada de chão + camada de árvores com colisão) a partir disso; gerador, BFS, percepção e cérebro do caçador continuam trabalhando com células lógicas.

**Tech Stack:** Phaser 4.2, TypeScript, Vite 8 (`base: '/brakar/'`), Vitest 5.

**Spec:** `docs/superpowers/specs/2026-11-08-floresta-tilemap-design.md`

## Global Constraints

- `TILE_SIZE = 32`; `CELL_PITCH = 96` (corredor de 2 tiles + árvore de 1); centro da célula = `96·col + 64`, `96·row + 64`; mundo = `(3n + 1) · 32` px.
- `MOVEMENT_SCALE = 1.5` definido uma vez em `MazeLayout.ts`; aplicado a `PLAYER_SPEED` (110 → 165), drag do jogador (500 → 750), `FLASHLIGHT_RADIUS` (200 → 300) e às três velocidades padrão do caçador (50/80/120 → 75/120/180).
- **Não mudam:** `PLAYER_SIZE = 16`, `HUNTER_SIZE = 18`, `PLAYER_DARK_VISION_RADIUS = 28`, zoom da câmera 4, `lightPerceptionRadiusCells`, `DARK_PERCEPTION_CELLS` (estes passam a ser multiplicados por `CELL_PITCH`).
- Módulos em `src/maze/`, `src/vision/`, `src/hunter/` (exceto `Hunter.ts`) **não importam Phaser**.
- Tileset em `public/assets/tiles/forest.png`, carregado com caminho relativo `assets/tiles/forest.png` (funciona com `base: '/brakar/'`).
- Variação de tile só por hash determinístico de `(row, column)` — nunca `Math.random`.
- Testes ao lado do código (`src/**/*.test.ts`); `npm test` e `npm run build` passando; `npm run format` antes de cada commit.
- Textos e comentários em português, como no resto do código.

## Decisões não explícitas na spec

- **Tamanho do mundo vem de `mazeSize`:** hoje `WORLD_WIDTH/HEIGHT` são campos inicializados com `mazeSize = 10` e nunca recalculados, então labirintos 16/20 ficam com limites e máscara de 640 px. Passam a ser calculados em `create()` com `worldSize(this.mazeSize)`.
- **Fora da grade conta como árvore** em `wallSegmentsFromGrid`: como o anel externo é sempre árvore, não há segmentos na borda do mundo (os raios nunca chegam lá).
- **`cellAt` é `floor(p / 96)` limitado a `[0, n−1]`:** o tile de árvore/abertura à esquerda/acima do interior pertence à própria célula, então um ponto na abertura entre duas células cai na célula de baixo/direita da parede.
- **Layout do tileset:** faixa horizontal de 13 frames de 32×32 (416×32 px), ordem fixa definida em `forestTileset.ts` (Task 3).
- **Cores de fallback** (sem tileset): árvore `0x1e3b22`, arbusto `0x284a2a`, trilha `0x4a3a28`, trilha com detalhe `0x55432d`, clareira `0x6b8f4a`.
- **Cores do minimapa:** fundo `0x07110a`, chão visitado `0x5c4a35`, paredes `0x8fbf7a`; jogador `0xf4d35e` e saída `0x55ff88` continuam.

## Review Focus

1. **Tamanhos de labirinto 8, 16 e 20** — mundo, limites da física, máscara de visão e minimapa precisam acompanhar `mazeSize` (Task 2 teste `worldSize`; Task 4 verificação manual passo 6).
2. **Ponto na abertura entre duas células** — `getPlayerCell`, surgimento do caçador e minimapa usam `cellAt`; um ponto no tile de abertura tem que cair numa célula vizinha válida, não fora do labirinto (Task 2 teste `cellAt na abertura`).
3. **Tileset ausente** — renomear `forest.png` não pode quebrar o jogo; texturas de cor sólida assumem (Task 4 verificação manual passo 5).
4. **Caçador alcançando o jogador encostado na árvore** — a correção de `4860157` com corredor de 64 px (Task 4 verificação manual passo 4; testes do `HunterBrain` continuam passando).
5. **Reiniciar a noite** ("Tentar de novo" / menu → jogar) — o tilemap e a textura de fallback são recriados sem erro de chave duplicada (Task 4 verificação manual passo 7).

---

### Task 1: Prova — tilemap com luz e máscara no Phaser 4 (descartável)

Responde: uma `TilemapLayer` com `setLighting(true)` é iluminada pela lanterna e recortada pela máscara de `camera.filters`? **Nada desta task é commitado.**

**Files:**
- Modify (temporário): `src/scenes/GameScene.ts`

- [ ] **Step 1: Adicionar um tilemap mínimo no fim de `createWorld()`**

Gere uma textura `spike-tiles` de 64×32 (dois quadrados: verde `0x1e3b22`, marrom `0x4a3a28`) com `make.graphics` + `generateTexture`; `this.make.tilemap({ width: 10, height: 10, tileWidth: 32, tileHeight: 32 })`, `addTilesetImage('spike-tiles')`, `createBlankLayer('spike', tileset)`, preencha alternando os índices 0/1 com `putTileAt`, `setDepth(-8)`, `setLighting(true)`.

- [ ] **Step 2: Verificar no navegador**

Run: `npm run dev`, abra o jogo, avance até o apagão.
Esperado: a área de 320×320 no canto superior esquerdo fica escura fora da lanterna, é iluminada dentro do cone e é recortada pela máscara como o chão atual.

- [ ] **Step 3: Registrar o resultado e descartar**

Run: `git checkout -- src/scenes/GameScene.ts`
Anote no topo da Task 4 deste arquivo: **"Prova: tilemap OK"** ou **"Prova: tilemap falhou → usar Image por tile"**. Se falhou, na Task 4 cada tile vira um `this.add.image(x, y, 'forest', frame).setLighting(true)` e a colisão vira um `physics.add.staticGroup()` com um corpo de 32×32 por tile de árvore; o resto da Task 4 é igual.

---

### Task 2: `MazeLayout` — escala, grade e conversão célula ↔ pixel

**Files:**
- Create: `src/maze/MazeLayout.ts`
- Test: `src/maze/MazeLayout.test.ts`

**Interfaces:**
- Consumes: `MazeCell` (`MazeGenerator.ts`), `CellPosition` (`MazePathFinder.ts`), `Point` (`vision/lineOfSight.ts`), `buildMaze` / `SERPENTINE_MAZE` (`testMaze.ts`).
- Produces:
  - `export const TILE_SIZE = 32`, `export const CELL_PITCH = 96`, `export const MOVEMENT_SCALE = 1.5`
  - `export type TileType = 'tree' | 'path'`
  - `export function buildTileGrid(maze: MazeCell[][]): TileType[][]` — indexada `[row][column]`, `(3n+1)` linhas × `(3m+1)` colunas
  - `export function cellCenter(cell: CellPosition): Point`
  - `export function cellAt(point: Point, mazeSize: number): CellPosition`
  - `export function worldSize(mazeSize: number): number`

- [ ] **Step 1: Escrever os testes**

```ts
describe('buildTileGrid', () => {
  // 2×2 com aberturas (0,0)-(0,1) e (0,1)-(1,1)
  const maze = buildMaze(2, 2, [[[0, 0], [0, 1]], [[0, 1], [1, 1]]])
  const T = 'tree', P = 'path'

  it('gera a grade 7×7 esperada', () => {
    expect(buildTileGrid(maze)).toEqual([
      [T, T, T, T, T, T, T],
      [T, P, P, P, P, P, T],
      [T, P, P, P, P, P, T],
      [T, T, T, T, P, P, T],
      [T, P, P, T, P, P, T],
      [T, P, P, T, P, P, T],
      [T, T, T, T, T, T, T],
    ])
  })

  it('cantos e borda externa são sempre árvore', () => {
    const grid = buildTileGrid(SERPENTINE_MAZE)
    expect(grid).toHaveLength(10)
    for (let i = 0; i < 10; i++) {
      expect([grid[0][i], grid[9][i], grid[i][0], grid[i][9]]).toEqual([T, T, T, T])
    }
    for (const r of [0, 3, 6, 9]) for (const c of [0, 3, 6, 9]) expect(grid[r][c]).toBe(T)
  })
})

describe('cellCenter / cellAt', () => {
  it('centro da célula', () => {
    expect(cellCenter({ row: 0, column: 0 })).toEqual({ x: 64, y: 64 })
    expect(cellCenter({ row: 2, column: 1 })).toEqual({ x: 160, y: 256 })
  })

  it('ida e volta em todas as células de 3×3', () => {
    for (let row = 0; row < 3; row++)
      for (let column = 0; column < 3; column++)
        expect(cellAt(cellCenter({ row, column }), 3)).toEqual({ row, column })
  })

  it('cellAt na abertura e nas bordas da célula', () => {
    expect(cellAt({ x: 96, y: 64 }, 3)).toEqual({ row: 0, column: 1 }) // tile de abertura entre (0,0) e (0,1)
    expect(cellAt({ x: 95.9, y: 64 }, 3)).toEqual({ row: 0, column: 0 })
    expect(cellAt({ x: 10, y: 10 }, 3)).toEqual({ row: 0, column: 0 }) // sobre árvore do canto
  })

  it('cellAt limita pontos fora do mundo', () => {
    expect(cellAt({ x: -50, y: 9999 }, 3)).toEqual({ row: 2, column: 0 })
  })
})

describe('worldSize', () => {
  it('(3n + 1) · 32', () => {
    expect(worldSize(8)).toBe(800)
    expect(worldSize(10)).toBe(992)
    expect(worldSize(20)).toBe(1952)
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/maze/MazeLayout.test.ts`
Expected: FAIL — `Failed to resolve import "./MazeLayout"`.

- [ ] **Step 3: Implementar `src/maze/MazeLayout.ts`**

`buildTileGrid`: comece com tudo `'tree'`; para cada célula com origem `(3·row, 3·col)`, marque o interior `(3r+1..3r+2, 3c+1..3c+2)` como `'path'`; se `!walls.top`, marque `(3r, 3c+1..3c+2)`; se `!walls.left`, marque `(3r+1..3r+2, 3c)`. As bordas direita/inferior saem da célula vizinha ou ficam árvore na borda do mundo.

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run src/maze/MazeLayout.test.ts`
Expected: PASS (todos os testes do arquivo).

- [ ] **Step 5: Commit**

```bash
npm run format
git add src/maze/MazeLayout.ts src/maze/MazeLayout.test.ts
git commit -m "feat: adiciona layout da floresta em tiles"
```

---

### Task 3: Segmentos de colisão da luz e mapeamento do tileset

**Files:**
- Modify: `src/maze/MazeLayout.ts`
- Create: `src/maze/forestTileset.ts`
- Test: `src/maze/MazeLayout.test.ts`, `src/maze/forestTileset.test.ts`

**Interfaces:**
- Consumes: `TileType`, `TILE_SIZE` (Task 2); `Segment` (`vision/lineOfSight.ts`).
- Produces:
  - `export function wallSegmentsFromGrid(grid: TileType[][]): Segment[]` (em `MazeLayout.ts`) — em px
  - `export function pickTileVariant(row: number, column: number, count: number): number` (em `forestTileset.ts`)
  - `export const FOREST_TEXTURE = 'forest'`, `export const FOREST_FRAME_COUNT = 13`
  - `export const FOREST_FRAMES = { tree: [0, 1, 2, 3, 4, 5], path: [6, 7, 8, 9, 10], clearing: [11, 12] }` — frames 0–3 copas, 4–5 arbustos, 6–8 trilha, 9–10 trilha com tufo, 11–12 clareira
  - `export function tileFrameFor(type: TileType, row: number, column: number, isClearing: boolean): number`
  - `export const FALLBACK_FRAME_COLORS: number[]` — 13 cores, na ordem dos frames, com os valores de "Cores de fallback" das Decisões

- [ ] **Step 1: Escrever os testes de `wallSegmentsFromGrid`** (em `MazeLayout.test.ts`)

```ts
const P = 'path', T = 'tree'
const len = (s: Segment) => Math.hypot(s.x2 - s.x1, s.y2 - s.y1)

it('árvore isolada no meio de uma clareira murada', () => {
  const segments = wallSegmentsFromGrid([
    [T, T, T, T, T],
    [T, P, P, P, T],
    [T, P, T, P, T],
    [T, P, P, P, T],
    [T, T, T, T, T],
  ])
  // horizontais y=32,64,96,128 e depois verticais x=32,64,96,128
  expect(segments.map(len)).toEqual([96, 32, 32, 96, 96, 32, 32, 96])
  expect(segments[1]).toEqual({ x1: 64, y1: 64, x2: 96, y2: 64 })
})

it('corredor gera segmentos unidos, não um por tile', () => {
  const segments = wallSegmentsFromGrid([
    [T, T, T, T, T, T],
    [T, P, P, P, P, T],
    [T, T, T, T, T, T],
  ])
  expect(segments.map(len)).toEqual([128, 128, 32, 32])
})

it('grade só de árvore não gera segmentos', () => {
  expect(wallSegmentsFromGrid([[T, T], [T, T]])).toEqual([])
})
```

- [ ] **Step 2: Escrever os testes de `forestTileset.test.ts`**

```ts
it('pickTileVariant é determinístico e fica no intervalo', () => {
  for (let r = 0; r < 30; r++)
    for (let c = 0; c < 30; c++) {
      const v = pickTileVariant(r, c, 4)
      expect(v).toBe(pickTileVariant(r, c, 4))
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(4)
    }
})

it('pickTileVariant varia ao longo da grade', () => {
  const seen = new Set<number>()
  for (let c = 0; c < 30; c++) seen.add(pickTileVariant(5, c, 4))
  expect(seen.size).toBeGreaterThan(1)
})

it('tileFrameFor escolhe o grupo certo', () => {
  expect(FOREST_FRAMES.tree).toContain(tileFrameFor('tree', 3, 7, false))
  expect(FOREST_FRAMES.path).toContain(tileFrameFor('path', 3, 7, false))
  expect(FOREST_FRAMES.clearing).toContain(tileFrameFor('path', 3, 7, true))
})

it('há uma cor de fallback por frame', () => {
  expect(FALLBACK_FRAME_COLORS).toHaveLength(FOREST_FRAME_COUNT)
})
```

- [ ] **Step 3: Rodar e ver falhar**

Run: `npx vitest run src/maze`
Expected: FAIL — `wallSegmentsFromGrid` não exportado e `./forestTileset` não resolvido.

- [ ] **Step 4: Implementar**

`wallSegmentsFromGrid`: para cada fronteira horizontal `y = r·32` (r de 0 a altura), percorra as colunas marcando onde o tile acima ≠ tile abaixo (fora da grade = `'tree'`) e emita um segmento por sequência contínua de colunas marcadas; idem para as fronteiras verticais `x = c·32`. Ordem: todos os horizontais (de cima para baixo), depois todos os verticais.

`pickTileVariant`: hash inteiro de `(row, column)` (por exemplo `((row * 73856093) ^ (column * 19349663)) >>> 0`) módulo `count`.

`tileFrameFor`: `isClearing` → `FOREST_FRAMES.clearing`; senão o grupo de `type`; índice via `pickTileVariant`.

- [ ] **Step 5: Rodar e ver passar**

Run: `npm test`
Expected: PASS — inclusive os testes antigos de BFS, percepção, `HunterBrain` e linha de visão.

- [ ] **Step 6: Commit**

```bash
npm run format
git add src/maze/MazeLayout.ts src/maze/MazeLayout.test.ts src/maze/forestTileset.ts src/maze/forestTileset.test.ts
git commit -m "feat: adiciona segmentos de luz e mapeamento do tileset da floresta"
```

---

### Task 4: Floresta no jogo

> Resultado da prova (Task 1): _preencher_

**Files:**
- Modify: `src/scenes/GameScene.ts`
- Modify: `src/hunter/Hunter.ts`
- Modify: `src/hunter/hunterSettings.ts`

**Interfaces:**
- Consumes: tudo de `MazeLayout.ts` (Tasks 2–3) e `forestTileset.ts` (Task 3).
- Produces: `Hunter` com o construtor `new Hunter(scene, maze, startCell, settings)` (sem `cellSize`; usa `cellCenter` de `MazeLayout`).

- [ ] **Step 1: Escala e caçador**

- `hunterSettings.ts`: `DEFAULT_HUNTER_SETTINGS` com `wanderSpeed: 50 * MOVEMENT_SCALE`, `investigateSpeed: 80 * MOVEMENT_SCALE`, `huntSpeed: 120 * MOVEMENT_SCALE`.
- `Hunter.ts`: remova o parâmetro `cellSize` e o método privado `cellCenter`; use `cellCenter` de `MazeLayout`.
- `GameScene.ts`: remova `CELL_SIZE` e `WALL_THICKNESS`; `PLAYER_SPEED = 110 * MOVEMENT_SCALE`; `setDrag(500 * MOVEMENT_SCALE, 500 * MOVEMENT_SCALE)`; `FLASHLIGHT_RADIUS = 200 * MOVEMENT_SCALE`; raios de percepção com `* CELL_PITCH`; `getCellCenter` delega a `cellCenter`; `getPlayerCell` usa `cellAt(player, this.mazeSize)`; `WORLD_WIDTH/HEIGHT` deixam de ser campos inicializados e passam a ser `worldSize(this.mazeSize)`, calculado em `create()` logo após ler `mazeSize`.

- [ ] **Step 2: Tileset (asset)**

Use a skill `pixel-art-sprites-32` para gerar os 13 tiles de 32×32, **vistos de cima**, paleta noturna fria (são vistos sob a luz quente da lanterna): 0–3 copas de árvore redondas em tons de verde-escuro e tamanhos diferentes, preenchendo o tile; 4–5 arbusto denso; 6–8 trilha de terra batida; 9–10 terra com tufo de grama/folhas secas; 11–12 grama clara de clareira. As copas e os arbustos devem cobrir o tile inteiro (eles são a parede). Monte a faixa 416×32 na ordem dos frames e salve em `public/assets/tiles/forest.png`. Abra a imagem e confira se os tiles de trilha e de clareira se repetem sem emenda visível.

- [ ] **Step 3: Montar a floresta no `GameScene`**

- `preload()`: `this.load.spritesheet(FOREST_TEXTURE, 'assets/tiles/forest.png', { frameWidth: 32, frameHeight: 32 })`.
- `ensureForestTexture()`: se `!this.textures.exists(FOREST_TEXTURE)` (falha no carregamento), gere uma textura 416×32 pintando cada frame com `FALLBACK_FRAME_COLORS[i]` e registre os 13 frames com `texture.add(i, 0, i * 32, 0, 32, 32)`.
- `createForest()` substitui `createWorld` (chão), `drawFloorDetails`, `createMazeWalls`, `createCellWalls`, `createWall` e `createWallsSegment`:
  - `grid = buildTileGrid(this.maze)`; tilemap em branco do tamanho da grade; `addTilesetImage(FOREST_TEXTURE)`;
  - camada `ground` (depth −10) com `tileFrameFor('path', …)` em **todas** as posições, `isClearing` quando o tile está no interior 2×2 da célula de saída (`this.exitInformation.cell`);
  - camada `trees` (depth −9) com `tileFrameFor('tree', …)` só onde `grid[r][c] === 'tree'`, `setCollisionByExclusion([-1])`;
  - ambas com `setLighting(true)`;
  - `this.wallSegments = wallSegmentsFromGrid(grid)` convertidos para `Phaser.Geom.Line` (ou mude o tipo do campo para `Segment[]`, já que `castRay` e `canPerceivePlayer` recebem `Segment`).
- `configureCollisions()`: collider do jogador com a camada `trees` em vez do `staticGroup` `walls`.
- Minimapa: troque `MINIMAP_BACKGROUND_COLOR`, `MINIMAP_FLOOR_COLOR`, `MINIMAP_WALL_COLOR` pelos valores das Decisões.

- [ ] **Step 4: Testes e build**

Run: `npm test && npm run build`
Expected: todos os testes passam; `tsc` sem erros; build gera `dist/` com `assets/tiles/forest.png`.

- [ ] **Step 5: Playtest manual** (`npm run dev`)

1. Fase clara: trilhas de terra entre árvores, sem tremer; a clareira aparece na saída.
2. Após o apagão: a lanterna ilumina as copas e a trilha; as árvores fazem sombra (o cone não atravessa).
3. Colisão: o jogador não entra nas árvores; contornar quinas com inércia não prende o jogador (se prender, troque o corpo por `setCircle(7, 1, 1)` e anote).
4. Caçador: vaga, investiga e caça pelas trilhas; alcança o jogador **encostado numa árvore** dentro da célula e no corredor de abertura.
5. Renomeie temporariamente `public/assets/tiles/forest.png` → o jogo roda com cores sólidas; desfaça.
6. No menu de configuração, jogue com 8, 16 e 20: o jogador alcança a borda direita/inferior; a máscara cobre o mundo todo; o minimapa acompanha.
7. Seja pego → "Tentar de novo"; vença → jogue de novo: nenhum erro no console.

- [ ] **Step 6: Commit**

```bash
npm run format
git add src/scenes/GameScene.ts src/hunter/Hunter.ts src/hunter/hunterSettings.ts public/assets/tiles/forest.png
git commit -m "feat: troca as paredes do labirinto por uma floresta em tilemap"
```
