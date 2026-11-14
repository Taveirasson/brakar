# Marco 1 — Caçador numa noite: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Depois do apagão, um caçador que reage à lanterna persegue o jogador pelo labirinto; se encostar, a run acaba numa tela de derrota.

**Architecture:** A lógica do caçador é pura e testável (busca de caminho, linha de visão, percepção, máquina de estados em `HunterBrain`), sem importar Phaser. Uma classe fina `Hunter` traduz o cérebro em movimento de sprite de centro de célula a centro de célula. `GameScene` cria o caçador no apagão, alimenta-o a cada frame e detecta a captura.

**Tech Stack:** Phaser 4, TypeScript, Vite 8, Vitest (novo).

**Spec:** `docs/superpowers/specs/2026-11-07-brakar-cacador-design.md` (seções 1 "O caçador", Arquitetura, Tratamento de erros, Testes — Marco 1). Marcos 2–4 terão planos próprios.

## Global Constraints

- Textos de interface em português, fonte `monospace`, mesmo estilo de `VictoryScene` (cores `#f4d35e`, `#ffffff`, `#a999b5`; painel `0x171120` com borda `0x9b5de5`).
- Módulos em `src/maze/`, `src/vision/`, `src/hunter/` **não importam Phaser** (precisam rodar no Vitest em ambiente `node`).
- `CELL_SIZE = 64`, `PLAYER_SIZE = 16`, `PLAYER_SPEED = 110` (já existem em `GameScene.ts`).
- Valores do caçador (noite 1): `wanderSpeed 50`, `investigateSpeed 80`, `huntSpeed 120`, `lightPerceptionRadiusCells 5`; percepção no escuro `1.5` célula; perder de vista por `3000 ms` → investigar; esperar `2000 ms` no fim da investigação → vagar.
- O caçador **não** aparece no minimapa.
- Testes ficam ao lado do código: `src/**/*.test.ts`. `npm run build` (que roda `tsc`) precisa continuar passando.
- Formatação: `npm run format` antes de cada commit (Prettier já configurado).

## Decisão não explícita no spec

- **Escalada investigando → caçando:** a spec diz "percebeu de novo". Como a percepção é avaliada a cada frame, a escalada só acontece se o caçador perceber o jogador depois de **600 ms** no estado `investigating` (`INVESTIGATE_CONFIRM_MS = 600`). Isso dá ao jogador uma janela para apagar a lanterna.
- **Captura por distância** (não por física): capturado quando a distância entre centros < `(PLAYER_SIZE + HUNTER_SIZE) / 2` = 17 px. O caçador não colide com paredes; anda só entre centros de células adjacentes abertas.

## Review Focus

1. **Captura e saída no mesmo frame** — o overlap da saída roda no passo de física, antes de `update()`. A captura precisa ter prioridade: `handlePlayerFoundExit` checa `isCaught` antes de `finishGame` (Task 6, verificação manual passo 4).
2. **Reiniciar após a derrota** — "Tentar de novo" precisa gerar uma noite limpa, sem caçador antigo nem fase `defeat` herdada (Task 6, verificação manual passo 5).
3. **Pausar durante a perseguição** — com ESC, o caçador e os timers param; ao voltar, continuam de onde estavam. Timers usam o `delta` de `update()`, então isso vale por construção; e o ESC fica bloqueado depois da captura (Task 6, verificação manual passo 6).
4. **Caçador preso em beco sem saída** — ao vagar, ele precisa voltar pelo único caminho (Task 4, teste `wandering volta do beco sem saída`).
5. **Apagar a lanterna no meio da caçada** — depois de 3 s sem perceber, ele volta a investigar o último ponto em vez de seguir o jogador para sempre (Task 4, testes de timeout de `hunting`; Task 3, teste de percepção no escuro).

---

### Task 1: Vitest + busca de caminho

**Files:**
- Modify: `package.json` (devDependency `vitest`, script `"test": "vitest run"`)
- Modify: `src/maze/MazePathFinder.ts`
- Create: `src/maze/testMaze.ts`
- Test: `src/maze/MazePathFinder.test.ts`

**Interfaces:**
- Produces:
  - `export interface CellPosition { row: number; column: number }` (em `MazePathFinder.ts`; `MazeCell` já satisfaz)
  - `export function getOpenNeighbors(maze: MazeCell[][], cell: CellPosition): MazeCell[]` — vizinhos sem parede entre eles, na ordem top, right, bottom, left
  - `export function findPath(maze: MazeCell[][], from: CellPosition, to: CellPosition): MazeCell[]` — inclui `from` e `to`; `[from]` se forem iguais; `[]` se inalcançável
  - `export function buildMaze(rows: number, columns: number, openings: Array<[[number, number], [number, number]]>): MazeCell[][]` (em `testMaze.ts`) — todas as paredes fechadas, abre as paredes entre cada par adjacente listado
  - `export const SERPENTINE_MAZE: MazeCell[][]` (em `testMaze.ts`) — 3×3 com o caminho único `(0,0)→(0,1)→(0,2)→(1,2)→(1,1)→(1,0)→(2,0)→(2,1)→(2,2)`

- [ ] **Step 1: Instalar o Vitest**

Run: `npm install -D vitest` e adicione `"test": "vitest run"` em `scripts`.
Run: `npx vitest --version` → imprime uma versão. Se o npm reclamar de peer dependency com Vite 8, instale a versão mais recente do Vitest que declare suporte a Vite 8 (não use `--force`).

- [ ] **Step 2: Criar `src/maze/testMaze.ts`** com `buildMaze` e `SERPENTINE_MAZE` conforme a interface acima. Use `visited: true` em todas as células.

- [ ] **Step 3: Escrever os testes que falham**

```ts
// src/maze/MazePathFinder.test.ts
import { describe, expect, it } from 'vitest'
import { findPath, getOpenNeighbors } from './MazePathFinder'
import { SERPENTINE_MAZE } from './testMaze'

const toPairs = (cells: { row: number; column: number }[]) =>
  cells.map((c) => [c.row, c.column])

describe('getOpenNeighbors', () => {
  it('retorna só vizinhos sem parede', () => {
    expect(toPairs(getOpenNeighbors(SERPENTINE_MAZE, { row: 0, column: 0 }))).toEqual([[0, 1]])
    expect(toPairs(getOpenNeighbors(SERPENTINE_MAZE, { row: 1, column: 1 }))).toEqual([[1, 2], [1, 0]])
  })
})

describe('findPath', () => {
  it('percorre o labirinto inteiro do início ao fim', () => {
    expect(toPairs(findPath(SERPENTINE_MAZE, { row: 0, column: 0 }, { row: 2, column: 2 }))).toEqual([
      [0, 0], [0, 1], [0, 2], [1, 2], [1, 1], [1, 0], [2, 0], [2, 1], [2, 2],
    ])
  })

  it('respeita paredes em vez de ir direto', () => {
    expect(toPairs(findPath(SERPENTINE_MAZE, { row: 0, column: 0 }, { row: 1, column: 0 }))).toEqual([
      [0, 0], [0, 1], [0, 2], [1, 2], [1, 1], [1, 0],
    ])
  })

  it('origem igual ao destino retorna só a origem', () => {
    expect(toPairs(findPath(SERPENTINE_MAZE, { row: 1, column: 1 }, { row: 1, column: 1 }))).toEqual([[1, 1]])
  })
})
```

- [ ] **Step 4: Rodar e ver falhar**

Run: `npm test` → FAIL (`getOpenNeighbors`/`findPath` não exportados).

- [ ] **Step 5: Implementar** `getOpenNeighbors` e `findPath` (BFS guardando o predecessor de cada célula e reconstruindo o caminho a partir de `to`). Reescreva o laço de vizinhos de `findFarthestCell` para usar `getOpenNeighbors` — o comportamento dele não muda.

- [ ] **Step 6: Rodar e ver passar**

Run: `npm test` → PASS. Run: `npm run build` → sem erros.

- [ ] **Step 7: Commit**

```bash
npm run format
git add package.json package-lock.json src/maze
git commit -m "feat: adiciona busca de caminho no labirinto e configura vitest"
```

---

### Task 2: Linha de visão extraída do GameScene

**Files:**
- Create: `src/vision/lineOfSight.ts`
- Modify: `src/scenes/GameScene.ts` (`castVisibilityRay`, ~linhas 685–727)
- Test: `src/vision/lineOfSight.test.ts`

**Interfaces:**
- Produces:
  - `export interface Point { x: number; y: number }`
  - `export interface Segment { x1: number; y1: number; x2: number; y2: number }` (`Phaser.Geom.Line` satisfaz estruturalmente, então `this.wallSegments` pode ser passado direto)
  - `export function castRay(origin: Point, angle: number, maxDistance: number, walls: readonly Segment[]): Point` — ponto de parede mais próximo ao longo do raio, ou o ponto em `maxDistance`
  - `export function hasLineOfSight(from: Point, to: Point, walls: readonly Segment[]): boolean` — `false` se o segmento `from→to` cruza qualquer parede

- [ ] **Step 1: Escrever os testes que falham**

```ts
// src/vision/lineOfSight.test.ts
import { describe, expect, it } from 'vitest'
import { castRay, hasLineOfSight } from './lineOfSight'

const wall = { x1: 50, y1: 0, x2: 50, y2: 100 }

describe('castRay', () => {
  it('para na parede', () => {
    const hit = castRay({ x: 0, y: 50 }, 0, 200, [wall])
    expect(hit.x).toBeCloseTo(50)
    expect(hit.y).toBeCloseTo(50)
  })
  it('vai até o alcance máximo sem parede', () => {
    const hit = castRay({ x: 0, y: 50 }, 0, 200, [])
    expect(hit.x).toBeCloseTo(200)
    expect(hit.y).toBeCloseTo(50)
  })
  it('usa a parede mais próxima', () => {
    const near = { x1: 30, y1: 0, x2: 30, y2: 100 }
    expect(castRay({ x: 0, y: 50 }, 0, 200, [wall, near]).x).toBeCloseTo(30)
  })
})

describe('hasLineOfSight', () => {
  it('bloqueado por parede no meio', () => {
    expect(hasLineOfSight({ x: 0, y: 50 }, { x: 100, y: 50 }, [wall])).toBe(false)
  })
  it('livre antes da parede', () => {
    expect(hasLineOfSight({ x: 0, y: 50 }, { x: 40, y: 50 }, [wall])).toBe(true)
  })
  it('segmentos paralelos não bloqueiam', () => {
    expect(hasLineOfSight({ x: 60, y: 0 }, { x: 60, y: 100 }, [wall])).toBe(true)
  })
})
```

- [ ] **Step 2: Rodar e ver falhar** — `npm test` → FAIL (módulo não existe).

- [ ] **Step 3: Implementar `src/vision/lineOfSight.ts`** com interseção paramétrica de segmentos (`t` e `u` em `[0, 1]`; denominador 0 = paralelos, sem interseção). Sem importar Phaser.

- [ ] **Step 4: Rodar e ver passar** — `npm test` → PASS.

- [ ] **Step 5: Fazer `GameScene.castVisibilityRay(angle)` delegar** para `castRay({ x: player.x, y: player.y }, angle, FLASHLIGHT_RADIUS, this.wallSegments)`, devolvendo `new Phaser.Math.Vector2(hit.x, hit.y)`. Apague o corpo antigo.

- [ ] **Step 6: Verificar sem regressão**

Run: `npm run build` → sem erros. Run: `npm run dev`, jogue até o apagão: o cone da lanterna continua parando nas paredes como antes.

- [ ] **Step 7: Commit**

```bash
npm run format
git add src/vision src/scenes/GameScene.ts
git commit -m "refactor: extrai raycast da lanterna para modulo de linha de visao"
```

---

### Task 3: Configuração e percepção do caçador

**Files:**
- Create: `src/hunter/hunterSettings.ts`
- Create: `src/hunter/hunterPerception.ts`
- Test: `src/hunter/hunterPerception.test.ts`

**Interfaces:**
- Consumes: `Point`, `Segment`, `hasLineOfSight` (Task 2)
- Produces:
  - `export interface HunterSettings { wanderSpeed: number; investigateSpeed: number; huntSpeed: number; lightPerceptionRadiusCells: number }`
  - `export const DEFAULT_HUNTER_SETTINGS: HunterSettings` = `{ wanderSpeed: 50, investigateSpeed: 80, huntSpeed: 120, lightPerceptionRadiusCells: 5 }`
  - `export const DARK_PERCEPTION_CELLS = 1.5`, `export const HUNTER_SIZE = 18`
  - `export interface PerceptionInput { hunter: Point; player: Point; flashlightOn: boolean; lightRadius: number; darkRadius: number; walls: readonly Segment[] }` (raios em pixels)
  - `export function canPerceivePlayer(input: PerceptionInput): boolean`
  - `export function isCaught(hunter: Point, player: Point, catchDistance: number): boolean` — distância `<` `catchDistance`

- [ ] **Step 1: Escrever os testes que falham**

```ts
// src/hunter/hunterPerception.test.ts
import { describe, expect, it } from 'vitest'
import { canPerceivePlayer, isCaught } from './hunterPerception'

const base = { hunter: { x: 0, y: 0 }, lightRadius: 320, darkRadius: 96, walls: [] }
const wall = { x1: 100, y1: -50, x2: 100, y2: 50 }

describe('canPerceivePlayer', () => {
  it('lanterna ligada dentro do raio', () => {
    expect(canPerceivePlayer({ ...base, player: { x: 256, y: 0 }, flashlightOn: true })).toBe(true)
  })
  it('lanterna ligada fora do raio', () => {
    expect(canPerceivePlayer({ ...base, player: { x: 384, y: 0 }, flashlightOn: true })).toBe(false)
  })
  it('lanterna ligada com parede no meio', () => {
    expect(canPerceivePlayer({ ...base, player: { x: 256, y: 0 }, flashlightOn: true, walls: [wall] })).toBe(false)
  })
  it('lanterna desligada bem perto', () => {
    expect(canPerceivePlayer({ ...base, player: { x: 64, y: 0 }, flashlightOn: false })).toBe(true)
  })
  it('lanterna desligada a duas células', () => {
    expect(canPerceivePlayer({ ...base, player: { x: 128, y: 0 }, flashlightOn: false })).toBe(false)
  })
  it('lanterna desligada perto ignora parede', () => {
    const closeWall = { x1: 40, y1: -50, x2: 40, y2: 50 }
    expect(canPerceivePlayer({ ...base, player: { x: 64, y: 0 }, flashlightOn: false, walls: [closeWall] })).toBe(true)
  })
})

describe('isCaught', () => {
  it('captura abaixo da distância', () => {
    expect(isCaught({ x: 0, y: 0 }, { x: 16, y: 0 }, 17)).toBe(true)
  })
  it('não captura na distância exata', () => {
    expect(isCaught({ x: 0, y: 0 }, { x: 17, y: 0 }, 17)).toBe(false)
  })
})
```

- [ ] **Step 2: Rodar e ver falhar** — `npm test` → FAIL.

- [ ] **Step 3: Implementar** `hunterSettings.ts` e `hunterPerception.ts` conforme as interfaces. Lanterna ligada: `distância <= lightRadius && hasLineOfSight`. Desligada: `distância <= darkRadius`.

- [ ] **Step 4: Rodar e ver passar** — `npm test` → PASS.

- [ ] **Step 5: Commit**

```bash
npm run format
git add src/hunter
git commit -m "feat: adiciona regras de percepcao e captura do cacador"
```

---

### Task 4: Máquina de estados do caçador (`HunterBrain`)

**Files:**
- Create: `src/hunter/HunterBrain.ts`
- Test: `src/hunter/HunterBrain.test.ts`

**Interfaces:**
- Consumes: `CellPosition`, `getOpenNeighbors`, `findPath` (Task 1); `SERPENTINE_MAZE` nos testes
- Produces:
  - `export type HunterState = 'wandering' | 'investigating' | 'hunting'`
  - `export const INVESTIGATE_CONFIRM_MS = 600`, `LOSE_TRACK_MS = 3000`, `INVESTIGATE_WAIT_MS = 2000`
  - `export interface HunterBrainInput { deltaMs: number; hunterCell: CellPosition; playerCell: CellPosition; perceivesPlayer: boolean }`
  - `export class HunterBrain`
    - `constructor(maze: MazeCell[][], random: () => number = Math.random)`
    - `get state(): HunterState` — começa em `'wandering'`
    - `update(input: HunterBrainInput): void` — avança timers e transições
    - `nextCell(hunterCell: CellPosition): CellPosition` — chamado quando o caçador chega ao centro de uma célula; devolve uma célula adjacente aberta, ou a própria `hunterCell` se já está no destino

**Regras de transição** (ver Global Constraints para os tempos):
- `wandering` + percebe → `investigating`, alvo = `playerCell`, zera o tempo no estado.
- `investigating` + percebe e tempo no estado `>= INVESTIGATE_CONFIRM_MS` → `hunting`. Percebe antes disso → só atualiza o alvo.
- `investigating`, `hunterCell` = alvo, sem perceber → acumula espera; `>= INVESTIGATE_WAIT_MS` → `wandering`.
- `hunting` + percebe → alvo = `playerCell`, zera o tempo perdido. Sem perceber → acumula; `>= LOSE_TRACK_MS` → `investigating` com o alvo = última posição percebida.
- `nextCell` em `investigating`/`hunting`: `findPath(maze, hunterCell, alvo)[1] ?? hunterCell`.
- `nextCell` em `wandering`: vizinho aberto aleatório (via `random`), excluindo a célula de onde veio, a não ser que seja o único vizinho. A célula de onde veio = o `hunterCell` da chamada anterior de `nextCell`.

- [ ] **Step 1: Escrever os testes que falham**

Helper nos testes: `const tick = (brain, ms, perceives, hunterCell = {row:0,column:0}, playerCell = {row:2,column:2}) => brain.update({ deltaMs: ms, hunterCell, playerCell, perceivesPlayer: perceives })`.

```ts
describe('HunterBrain', () => {
  it('começa vagando')                                   // state === 'wandering'
  it('vagando que percebe passa a investigar')           // tick(16, true) → 'investigating'
  it('investigando não escala antes de 600 ms')           // tick(16,true); tick(500,false); tick(16,true) → 'investigating'
  it('investigando escala a caçando depois de 600 ms')     // tick(16,true); tick(600,false); tick(16,true) → 'hunting'
  it('caçando continua até 2999 ms sem perceber')          // chega a hunting; tick(2999,false) → 'hunting'
  it('caçando volta a investigar aos 3000 ms')            // chega a hunting; tick(3000,false) → 'investigating'
  it('perceber de novo zera o tempo perdido')             // hunting; tick(2000,false); tick(16,true); tick(2000,false) → 'hunting'
  it('investigando espera 2000 ms no alvo e volta a vagar') // investigating com alvo (2,2); tick(2000,false,{row:2,column:2}) → 'wandering'
  it('investigando fora do alvo não volta a vagar')         // investigating com alvo (2,2); tick(5000,false,{row:0,column:0}) → 'investigating'
  it('caçando segue o caminho do labirinto')               // chega a hunting passando playerCell (1,0) em todos os ticks; nextCell({row:0,column:0}) → {row:0,column:1}
  it('no alvo devolve a própria célula')                  // tick(16,true,{row:0,column:0},{row:1,column:1}) → investigating com alvo (1,1); nextCell({row:1,column:1}) → {row:1,column:1}
  it('wandering não volta para trás')                     // random = () => 0; nextCell((0,0)) → (0,1); nextCell((0,1)) → (0,2)
  it('wandering volta do beco sem saída')                 // nextCell((0,1)); nextCell((0,0)) → (0,1)
})
```

Cada `it` deve ter as asserções `expect(...)` descritas no comentário, com os valores exatos acima (compare só `row`/`column` das células). "Chega a hunting" = `tick(16,true); tick(600,false); tick(16,true)`. Os timers incluem o `deltaMs` do próprio tick antes de comparar com os limites.

- [ ] **Step 2: Rodar e ver falhar** — `npm test` → FAIL.

- [ ] **Step 3: Implementar `HunterBrain`** conforme as regras acima. Sem Phaser.

- [ ] **Step 4: Rodar e ver passar** — `npm test` → PASS (todos os testes das Tasks 1–4).

- [ ] **Step 5: Commit**

```bash
npm run format
git add src/hunter
git commit -m "feat: adiciona maquina de estados do cacador"
```

---

### Task 5: Caçador no jogo (surgimento e movimento)

**Files:**
- Create: `src/hunter/Hunter.ts`
- Modify: `src/scenes/GameScene.ts` (`create`, `update`, `beginItemSearch`)

**Interfaces:**
- Consumes: `HunterBrain`, `HunterState` (Task 4); `HunterSettings`, `HUNTER_SIZE`, `DEFAULT_HUNTER_SETTINGS`, `DARK_PERCEPTION_CELLS`, `canPerceivePlayer` (Task 3); `findFarthestCell`, `CellPosition` (Task 1)
- Produces:
  - `export class Hunter`
    - `constructor(scene: Phaser.Scene, maze: MazeCell[][], startCell: CellPosition, settings: HunterSettings, cellSize: number)`
    - `get position(): Point`
    - `get state(): HunterState`
    - `update(deltaMs: number, playerCell: CellPosition, perceivesPlayer: boolean): void`
    - `destroy(): void`

**Comportamento do `Hunter`:**
- Visual: textura gerada uma vez (chave `'hunter'`): quadrado `HUNTER_SIZE` cor `0x1a0f1f` com dois pontos `0xf2f2f2` de 3 px como olhos. `setLighting(true)`, `setDepth(9)`. Não é corpo de física.
- Guarda `currentCell` (último centro alcançado) e `targetCell` (próximo centro). A cada `update`: chama `brain.update({ deltaMs, hunterCell: currentCell, playerCell, perceivesPlayer })`; move o sprite em direção ao centro de `targetCell` a `velocidade(state) * deltaMs / 1000`; ao alcançar (ou ultrapassar), encaixa no centro, `currentCell = targetCell`, `targetCell = brain.nextCell(currentCell)`.
- Velocidade por estado: `wandering → wanderSpeed`, `investigating → investigateSpeed`, `hunting → huntSpeed`.

**Mudanças no `GameScene`:**
- Campo `private hunter?: Hunter`. Em `create()`: `this.hunter = undefined` junto com os outros resets.
- `update(_time: number, delta: number)`: se `this.hunter` existe e a fase é `searchingItems` ou `returningToExit`, calcula `perceivesPlayer` com `canPerceivePlayer({ hunter: hunter.position, player, flashlightOn: this.flashlightEnabled, lightRadius: settings.lightPerceptionRadiusCells * CELL_SIZE, darkRadius: DARK_PERCEPTION_CELLS * CELL_SIZE, walls: this.wallSegments })` e chama `this.hunter.update(delta, this.getPlayerCell(), perceivesPlayer)`.
- `beginItemSearch()`: depois de `spawnRequiredItems()`, chama `spawnHunter()`, que cria o `Hunter` na célula de `findFarthestCell(this.maze, playerCell.row, playerCell.column).cell`, com `DEFAULT_HUNTER_SETTINGS`.
- Minimapa: nada muda (o caçador não é desenhado).

- [ ] **Step 1: Implementar `Hunter.ts`** conforme acima.

- [ ] **Step 2: Integrar no `GameScene`** conforme acima.

- [ ] **Step 3: Verificar build e testes**

Run: `npm run build` → sem erros. Run: `npm test` → PASS.

- [ ] **Step 4: Playtest manual** (`npm run dev`, labirinto 10 no menu de configuração)

Confirme cada item:
1. Antes do apagão não há caçador.
2. Depois de "BUSCAR ITENS", o caçador aparece longe e só fica visível quando a lanterna o ilumina.
3. Ele anda pelos corredores sem atravessar paredes.
4. Com a lanterna ligada e linha de visão, ele vem na sua direção e acelera. Apagando a lanterna e se afastando, ele desacelera depois de uns 3 s.
5. Ele não aparece no minimapa.

(Nesta task, encostar no caçador ainda não faz nada.)

- [ ] **Step 5: Commit**

```bash
npm run format
git add src/hunter/Hunter.ts src/scenes/GameScene.ts
git commit -m "feat: adiciona cacador que persegue o jogador apos o apagao"
```

---

### Task 6: Captura e tela de derrota

**Files:**
- Create: `src/scenes/GameOverScene.ts`
- Modify: `src/config/index.ts` (fase `'defeat'` em `GamePhase`)
- Modify: `src/config/sceneKeys.ts` (`gameOver: 'GameOverScene'`)
- Modify: `src/main.ts` (registrar `GameOverScene`)
- Modify: `src/scenes/GameScene.ts` (`update`, `handlePlayerFoundExit`, `pauseGame`, novo `catchPlayer`)

**Interfaces:**
- Consumes: `isCaught`, `HUNTER_SIZE` (Task 3); `Hunter.position` (Task 5)
- Produces: `GameOverScene` recebe `{ night: number }` via `scene.run(SCENE_KEYS.gameOver, { night: 1 })` e lê em `init(data)`.

**Comportamento:**
- `CATCH_DISTANCE = (PLAYER_SIZE + HUNTER_SIZE) / 2` em `GameScene`. Helper `private isPlayerCaught(): boolean` → `false` sem caçador; senão `isCaught(hunter.position, player, CATCH_DISTANCE)`.
- Em `update`, depois de atualizar o caçador: se `isPlayerCaught()`, chama `catchPlayer()`.
- `handlePlayerFoundExit`: no ramo `returningToExit`, se `isPlayerCaught()` chama `catchPlayer()` e retorna **antes** de `finishGame()`.
- `catchPlayer()`: ignora se a fase é `defeat` ou `victory`. Senão: fase `'defeat'`, para o jogador, `physics.pause()`, `cameras.main.shake(400, 0.01)` e `cameras.main.flash(400, 180, 20, 30)`; depois de 400 ms, `scene.pause()` e `scene.run(SCENE_KEYS.gameOver, { night: 1 })`.
- `pauseGame`: também retorna cedo se a fase é `'defeat'`.
- `GameOverScene`: mesmo layout de `VictoryScene`. Textos: título `VOCÊ FOI PEGO` (cor `#ff5d73`), subtítulo `Você não sobreviveu à noite ${night}.`; botões `TENTAR DE NOVO` (para `game` e inicia `game`) e `VOLTAR AO MENU` (para `game` e inicia `menu`).

- [ ] **Step 1: Implementar** `GameOverScene`, as chaves, o registro e as mudanças no `GameScene`.

- [ ] **Step 2: Verificar build e testes** — `npm run build` → sem erros; `npm test` → PASS.

- [ ] **Step 3: Playtest — captura.** Deixe o caçador encostar: a câmera treme, pisca vermelho e aparece "VOCÊ FOI PEGO / Você não sobreviveu à noite 1."

- [ ] **Step 4: Playtest — empate na saída (Review Focus 1).** Para testar: temporariamente coloque `DEFAULT_HUNTER_SETTINGS.huntSpeed` bem alto, colete os itens e corra para a saída com o caçador colado. Se os dois encostam no mesmo frame, a tela é de derrota, nunca de vitória. Desfaça a mudança.

- [ ] **Step 5: Playtest — reiniciar (Review Focus 2).** Em "TENTAR DE NOVO": labirinto novo, fase clara, sem caçador até o apagão, itens 0/3. Repita pelo "VOLTAR AO MENU" → "Jogar".

- [ ] **Step 6: Playtest — pausa (Review Focus 3).** ESC durante uma perseguição: o caçador congela; ao continuar, ele retoma. ESC durante o flash da captura não abre a pausa.

- [ ] **Step 7: Commit**

```bash
npm run format
git add src/scenes src/config src/main.ts
git commit -m "feat: adiciona captura pelo cacador e tela de derrota"
```
