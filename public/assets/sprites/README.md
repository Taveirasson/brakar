# Sprites dos personagens

Spritesheets de frames 32x32 px, fundo transparente. Cada animação é uma linha; os frames vão da esquerda para a direita. A largura é sempre 128 px (4 colunas). Use filtro Nearest e sem compressão. Luz vem do canto superior esquerdo.

Ligados ao jogo em `src/characters/` (jogador = Pipoca, caçador = Estouro).

## pipoca.png (128x128)

Vira-lata preto e branco **visto de cima** (top-down). O jogo usa só `walk-side` e `idle` (sempre na horizontal, espelhados para a esquerda); `walk-down` e `walk-up` ficam na folha mas não são usados. Corpo visível cabe em ~24x16 px no centro do frame.

| Linha | Animação    | Frames | fps sugerido | Observação                                                               |
| ----- | ----------- | ------ | ------------ | ------------------------------------------------------------------------ |
| 0     | `walk-down` | 4      | 8            | de frente                                                                |
| 1     | `walk-up`   | 4      | 8            | de costas                                                                |
| 2     | `walk-side` | 4      | 8            | olhando para a direita (espelhar p/ esquerda)                            |
| 3     | `idle`      | 2      | 3            | horizontal (olhando para a direita), rabo abanando; colunas 2 e 3 vazias |

## estouro.png (128x64)

Criatura de pólvora, papel queimado e faíscas. Corpo cabe em ~22x22 px (faíscas podem sair um pouco).

| Linha | Animação | Frames | fps sugerido | Observação                             |
| ----- | -------- | ------ | ------------ | -------------------------------------- |
| 0     | `move`   | 4      | 10           | crepitando, faíscas mudam a cada frame |
| 1     | `hunt`   | 4      | 14           | mais faíscas e olhos mais brilhantes   |
