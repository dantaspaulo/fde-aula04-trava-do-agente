# CLAUDE.md

@AGENTS.md

## Três "nunca", com trava

Estas regras não dependem de você lembrar: o hook `.claude/hooks/trava.mjs` recusa antes de a ação acontecer.

1. Nunca altere `dados/banco.json`. Ele é somente leitura; o estado mutável vive em `dados/estado.json`.
2. Nunca edite, apague ou sobrescreva um teste que já existe em `test/`. Faça o código passar. Teste novo pode.
3. Nunca leia, mostre, escreva ou commite o `.env`. A chave é da pessoa.

Se a trava recusar: pare, explique o que queria fazer e pergunte. Não procure outro caminho para o mesmo efeito.

## Antes de dizer que terminou

Rode `bun test` e `bunx tsc --noEmit` e mostre o placar dos dois.
