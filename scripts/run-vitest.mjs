// No Windows, se o terminal abrir em "c:\" (drive minúsculo), o vitest carrega o
// próprio módulo duas vezes (c:\ e C:\) e todos os testes falham com
// "Cannot read properties of undefined (reading 'config')". Este script corrige a
// letra do drive do diretório atual antes de chamar o vitest.
import { spawnSync } from 'node:child_process'

const cwd = process.cwd().replace(/^[a-z]:/, (drive) => drive.toUpperCase())

const result = spawnSync('npx', ['vitest', ...process.argv.slice(2)], {
  cwd,
  stdio: 'inherit',
  shell: true,
})

process.exit(result.status ?? 1)
