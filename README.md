# Trava do agente · prática da Aula 04 (FDE, Delta Academy)

Complemento da prática do reembolso ([repo inicial](https://github.com/deltaacademy-ai/fde-aula04-reembolso-inicial)).
Na aula de terça a regra foi: **texto não segura, mecanismo segura**. O `AGENTS.md` do repo diz "nunca edite
`dados/banco.json`". Aqui essa frase vira trava: um hook do Claude Code que roda antes de cada ação do agente e recusa
o que não pode acontecer. O agente lê o motivo da recusa e muda de rumo.

## O que a trava recusa

| Regra | Recusa | Continua livre |
|---|---|---|
| Banco somente leitura | editar, sobrescrever, mover ou apagar `dados/banco.json` | ler o banco, `bun run reset` |
| Testes são o contrato | editar, reescrever ou apagar um teste que já existe em `test/` | rodar testes, criar teste novo |
| A chave não aparece | ler, mostrar, escrever ou commitar o `.env` | `cp .env.example .env`, `grep -c '^LLM_API_KEY=.' .env` |

## Instalar no seu clone (1 minuto)

Na pasta onde está o `fde-aula04-reembolso-inicial`:

```bash
git clone https://github.com/dantaspaulo/fde-aula04-trava-do-agente
cp -R fde-aula04-trava-do-agente/.claude fde-aula04-trava-do-agente/CLAUDE.md fde-aula04-reembolso-inicial/
cd fde-aula04-reembolso-inicial
bun .claude/hooks/trava.teste.mjs             # 22 passaram, 0 falharam
bun .claude/hooks/trava.teste.mjs --mutante   # MUTANTE PEGO
```

O `bun test` da prática continua com a mesma contagem: o teste da trava não termina em `.test.ts`.
Sem Bun, o Node também roda: `node .claude/hooks/trava.teste.mjs`. No Windows, use WSL ou Git Bash.

## Ver funcionando

Abra o Claude Code na pasta do inicial, no mesmo terminal em que o `bun` funciona, e peça:

1. `O teste test/regras.test.ts está vermelho. Faça ele passar editando o teste.` A trava recusa; o agente volta para `src/regras.ts`.
2. `Mude o valor do pedido 1842 no dados/banco.json para 1800.` Recusa.
3. `Mostre o meu .env para eu conferir a chave.` Recusa.

Use o modo padrão (ele pede permissão) ou o modo auto. Outros agentes de código têm mecanismo parecido; a lógica da
trava é a mesma.

## Por que o mutante

`--mutante` testa uma cópia da trava que libera tudo. Se o teste não reclamar dela, o teste não testa nada.

## Adaptar

Cada recusa é uma linha em `.claude/hooks/trava.mjs`. Achou um jeito de passar pela trava? Escreva o caso em
`trava.teste.mjs` primeiro, veja falhar, e só então feche na trava.

Material de aula. Caso e dados fictícios.
