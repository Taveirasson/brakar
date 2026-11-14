# Brakar v1 — O caçador e a run de noites

Data: 2026-11-07

## Objetivo

Transformar o Brakar em um jogo **completo e jogável para mostrar** (portfólio, amigos, itch.io), usando o processo como **aprendizado** de game dev.

Identidade: **terror com estrutura arcade**. Cada labirinto é uma "noite"; um caçador que reage à luz te persegue no escuro; a run termina quando você é pego, e o recorde de noites sobrevividas fica salvo.

### Critério de "pronto" da v1

- Dá para jogar ~5 noites seguidas, perder, ver o recorde e querer jogar de novo.
- O jogo está publicado no GitHub Pages com o README atualizado.

## Estado atual (ponto de partida)

Loop existente: fase clara → saída trancada → luzes apagam → lanterna (mira no mouse, `F` liga/desliga) → coletar 3 itens (um por quadrante, em becos sem saída) → voltar à saída → vitória. Há minimapa, inércia, pausa, seletor de tamanho do labirinto e deploy no GitHub Pages. `GameScene.ts` tem ~980 linhas.

## Decisões de design

### 1. O caçador

**Surgimento:** quando as luzes se apagam (transição para a fase `searchingItems`), o caçador nasce na célula mais distante do jogador pelo caminho do labirinto naquele instante.

**Máquina de estados:**

| Estado | Comportamento | Transições |
|---|---|---|
| `wandering` | Anda célula a célula escolhendo vizinhos aleatórios, evitando voltar para a célula anterior (exceto em becos sem saída). Velocidade `wanderSpeed`. | Percebeu o jogador → `investigating` |
| `investigating` | Vai até a última posição em que percebeu o jogador. Velocidade `investigateSpeed`. | Percebeu o jogador de novo → `hunting`. Chegou ao destino sem perceber → espera 2 s → `wandering` |
| `hunting` | Persegue a posição atual do jogador pelo caminho do labirinto (BFS recalculado ao mudar de célula alvo). Velocidade `huntSpeed`, maior que a do jogador. | 3 s seguidos sem perceber → `investigating` (destino = última posição percebida) |

**Percepção** (função pura `canPerceivePlayer`):

- Lanterna **ligada**: percebe se a distância ≤ `lightPerceptionRadius` (em células, convertido para pixels) **e** há linha de visão (nenhum segmento de parede entre o caçador e o jogador).
- Lanterna **desligada**: percebe se a distância ≤ 1,5 célula, independentemente de linha de visão.
- Correr/agachar não fazem parte da v1.

**Captura:** contato físico (overlap) entre caçador e jogador encerra a run imediatamente: tremida de câmera + flash vermelho curto (~400 ms) → `GameOverScene`.

**Sinais de proximidade:**

- Passos do caçador com volume proporcional à proximidade.
- Borda da tela pulsando em vermelho enquanto o estado é `hunting`.
- O caçador **não** aparece no minimapa.

**Visual:** forma simples (quadrado/círculo escuro com olhos claros), afetada pela iluminação como o resto do mundo — só é visível quando iluminado pela lanterna ou dentro do raio de visão no escuro do jogador.

### 2. A run de noites

**Fluxo:**

```
Menu ──► Noite N (fase clara → apaga → caçador → itens → saída)
          │ escapou                       │ pego
          ▼                               ▼
   NightClearedScene                GameOverScene
   "Noite N sobrevivida"            "Você não sobreviveu à noite N"
   [Próxima noite] → Noite N+1      Recorde (+ "NOVO RECORDE!")
                                    [Tentar de novo] [Menu]
```

**Tabela de dificuldade** (`src/run/nightSettings.ts`, valores iniciais para ajuste por playtest; `PLAYER_SPEED` atual = 110):

| Noite | Labirinto | wanderSpeed | investigateSpeed | huntSpeed | lightPerceptionRadius (células) |
|---|---|---|---|---|---|
| 1 | 8×8 | 50 | 80 | 120 | 5 |
| 2 | 10×10 | 55 | 85 | 125 | 5 |
| 3 | 12×12 | 60 | 90 | 130 | 6 |
| 4 | 16×16 | 65 | 95 | 135 | 6 |
| 5+ | 20×20 | 70 + 2·(N−5) | 100 + 2·(N−5) | 140 + 2·(N−5) | 7 |

Velocidades com teto em `huntSpeed = 170` para manter o jogo vencível.

**Estado da run** (`src/run/RunState.ts`): noite atual (em memória) e recorde (`localStorage`, chave `brakar-best-night`, leitura/escrita em `try/catch`). O recorde é a maior noite **alcançada**: ao ser pego na noite N, `recordNight(N)` grava N se for maior que o recorde atual. Sair pelo menu de pausa no meio de uma run não grava recorde.

**Passagem de dados:** `scene.start(SCENE_KEYS.game, { night })`; `GameScene.init(data)` lê a noite e busca a configuração em `getNightSettings(night)`.

**Mudanças nas telas:**

- `VictoryScene` → renomeada/reaproveitada como `NightClearedScene` com botão **Próxima noite**.
- `GameOverScene` nova.
- `MenuScene`: **Jogar** sempre inicia na noite 1; mostra o recorde; remove o botão de configuração.
- `ConfigurationScene` e `src/config/mazeSettings.ts` são removidos.
- HUD: texto "NOITE N" discreto em um canto da tela.

### 3. Som

Mínimo da v1: passos do caçador (volume por distância), batida grave em loop durante `hunting`, clique ao ligar/desligar a lanterna, som de susto na captura, zumbido ambiente após o apagão.

Arquivos CC0 (freesound.org, Kenney) em `public/audio/`, com origem listada em `CREDITS.md`. O código carrega as chaves de áudio e tolera arquivo ausente (o jogo funciona sem som). O Lucas escolhe os sons.

## Arquitetura

Novos módulos:

| Arquivo | Responsabilidade | Depende de |
|---|---|---|
| `src/maze/MazePathFinder.ts` (estendido) | `findPath(maze, from, to): MazeCell[]` via BFS | `MazeGenerator` (tipos) |
| `src/vision/lineOfSight.ts` | Raycast contra segmentos de parede (extraído de `GameScene.castVisibilityRay`) e `hasLineOfSight(a, b, walls)` | `Phaser.Geom` |
| `src/hunter/hunterPerception.ts` | `canPerceivePlayer(input): boolean` — função pura | `lineOfSight` |
| `src/hunter/HunterBrain.ts` | Máquina de estados pura: recebe `(dt, percepção, posição)` e devolve estado + célula alvo | `MazePathFinder` |
| `src/hunter/Hunter.ts` | Sprite/física do Phaser; move o corpo em direção à célula alvo do `HunterBrain`; toca os passos | `HunterBrain`, Phaser |
| `src/run/nightSettings.ts` | `getNightSettings(night)` | — |
| `src/run/RunState.ts` | Noite atual, `getBestNight()`, `recordNight(n)` | `localStorage` |
| `src/scenes/GameOverScene.ts` | Tela de derrota | `RunState` |

`GameScene` passa a: ler a noite em `init`, criar o `Hunter` no apagão, chamar `hunter.update()` no loop, configurar o overlap de captura e disparar a derrota. Fora a extração do raycast, o restante do `GameScene` (minimapa, itens, notificações) não é refatorado nesta v1.

**Separação para testes:** `HunterBrain`, `hunterPerception`, `findPath`, `nightSettings` e `RunState` não dependem de cenas do Phaser e são testáveis isoladamente.

## Tratamento de erros e casos de borda

- Jogador pausa (ESC) durante a perseguição: a cena inteira pausa, inclusive o caçador e os timers.
- Caçador e jogador na mesma célula no surgimento: impossível por construção (nasce na célula mais distante).
- Captura e chegada à saída no mesmo frame: a captura tem prioridade se a fase ainda não for `victory`; uma vez em `victory`, a captura é ignorada.
- `localStorage` indisponível: recorde cai para 0 e o jogo segue normalmente.
- Áudio ausente ou bloqueado pelo navegador: o jogo segue sem som.

## Testes

Adicionar **Vitest** (dev dependency) e script `npm test`. Testes unitários para:

- `findPath`: caminho em labirinto pequeno fixo; origem = destino; caminho respeita paredes.
- `canPerceivePlayer`: luz ligada dentro/fora do raio; parede bloqueando; luz desligada perto/longe.
- `HunterBrain`: `wandering → investigating → hunting`, timeout de 3 s, espera de 2 s ao fim da investigação.
- `getNightSettings`: valores das noites 1–5, crescimento após 5, teto de velocidade.
- `RunState`: recorde só aumenta; `localStorage` que lança exceção.

A sensação de tensão é validada por playtest manual ao fim de cada marco.

## Marcos

1. **Caçador numa noite** — BFS, linha de visão extraída, percepção, `HunterBrain`, `Hunter`, captura e `GameOverScene` simples.
2. **Run de noites** — `nightSettings`, `RunState`, `NightClearedScene`, recorde no menu e na derrota, HUD, remoção de `ConfigurationScene`/`mazeSettings`.
3. **Som e polimento** — áudio, borda vermelha, susto, ajuste da tabela por playtest.
4. **Publicação** — deploy no GitHub Pages, README atualizado, `CREDITS.md`.

## Fora do escopo da v1

- Melhorias entre noites (escolha de 1 de 3 upgrades).
- Correr, agachar, bateria da lanterna.
- Múltiplos caçadores.
- Refatoração completa do `GameScene` (minimapa, itens).
