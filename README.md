# Brakar

Jogo 2D top-down para a web, feito com Phaser e TypeScript. O jogador começa na primeira célula de um labirinto gerado aleatoriamente e precisa encontrar a saída, posicionada na célula mais distante do início pelo caminho real do labirinto.

## Funcionalidades atuais

- Movimento em oito direções com as setas ou `WASD`.
- Velocidade diagonal normalizada.
- Câmera centralizada e seguindo o jogador.
- Labirinto diferente a cada recarregamento.
- Paredes com colisão usando Arcade Physics.
- Saída posicionada automaticamente na célula mais distante do início.
- Detecção de vitória quando o jogador alcança a saída.

## Tecnologias

- [Phaser](https://phaser.io/): motor de jogo 2D.
- TypeScript: código JavaScript com tipagem.
- Vite: servidor de desenvolvimento e ferramenta de build.
- Arcade Physics: movimentação e colisões.

## Requisitos

Antes de começar, instale:

- Node.js.
- npm, normalmente instalado junto com o Node.js.

Para confirmar a instalação, execute:

```bash
node --version
npm --version
```

## Como instalar

Abra o terminal na pasta do projeto e instale as dependências:

```bash
npm install
```

Esse comando lê o `package.json` e instala Phaser, TypeScript, Vite e as outras dependências do projeto.

## Como rodar durante o desenvolvimento

Execute:

```bash
npm run dev
```

O Vite mostrará um endereço local semelhante a:

```text
http://localhost:5173
```

Abra esse endereço no navegador. Alterações nos arquivos são atualizadas automaticamente durante o desenvolvimento.

Para encerrar o servidor, pressione `Ctrl + C` no terminal.

## Como gerar a versão de produção

Execute:

```bash
npm run build
```

O TypeScript será verificado e o Vite criará os arquivos otimizados na pasta `dist`.

Para testar essa versão localmente:

```bash
npm run preview
```

## Formatação do código

Para formatar os arquivos com Prettier:

```bash
npm run format
```

Para apenas verificar a formatação:

```bash
npm run format:check
```
