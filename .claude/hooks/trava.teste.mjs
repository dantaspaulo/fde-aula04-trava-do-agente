// Teste da trava. Rode na raiz do repo da prática, depois de copiar a pasta .claude para lá:
//   bun .claude/hooks/trava.teste.mjs             -> todos os casos precisam passar
//   bun .claude/hooks/trava.teste.mjs --mutante   -> testa uma cópia da trava que libera tudo; o teste PRECISA reclamar
// O nome não termina em .test.*: assim o `bun test` da prática continua contando só os testes do Hugo.
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const aqui = dirname(fileURLToPath(import.meta.url));
const raiz = process.cwd();
const mutante = process.argv.includes("--mutante");

if (!existsSync(join(raiz, "test", "regras.test.ts")) || !existsSync(join(raiz, "dados", "banco.json"))) {
  console.error("Rode na raiz do repo da prática (onde estão test/ e dados/), depois de copiar a pasta .claude para lá.");
  process.exit(1);
}

let trava = join(aqui, "trava.mjs");
if (mutante) {
  const pasta = mkdtempSync(join(tmpdir(), "trava-mutante-"));
  const copia = join(pasta, "trava.mjs");
  writeFileSync(copia, readFileSync(trava, "utf8").replaceAll("process.exit(2)", "process.exit(0)"));
  trava = copia;
}

const L = 0, R = 2;
const casos = [
  // o que o agente precisa conseguir fazer na prática
  [L, "rodar os testes", "Bash", { command: "bun test" }],
  [L, "recriar o estado", "Bash", { command: "bun run reset" }],
  [L, "ler o banco", "Bash", { command: "cat dados/banco.json" }],
  [L, "rodar um teste específico", "Bash", { command: "bun test test/regras.test.ts" }],
  [L, "editar o código do exercício", "Edit", { file_path: "src/regras.ts" }],
  [L, "escrever um teste NOVO (Exercício 5)", "Write", { file_path: "test/c13-guarda.test.ts" }],
  [L, "acrescentar o c13 no eval", "Edit", { file_path: "evals/casos.json" }],
  [L, "criar o .env a partir do exemplo", "Bash", { command: "cp .env.example .env" }],
  [L, "contar se a chave está preenchida", "Bash", { command: "grep -c '^LLM_API_KEY=.' .env" }],
  [L, "ler o .env.example", "Read", { file_path: ".env.example" }],
  // o que a trava precisa recusar
  [R, "editar o banco", "Edit", { file_path: "dados/banco.json" }],
  [R, "alterar o banco com sed", "Bash", { command: "sed -i '' 's/180/1800/' dados/banco.json" }],
  [R, "sobrescrever o banco", "Bash", { command: "echo '{}' > dados/banco.json" }],
  [R, "apagar o banco", "Bash", { command: "rm dados/banco.json" }],
  [R, "editar um teste que existe", "Edit", { file_path: "test/regras.test.ts" }],
  [R, "reescrever um teste que existe", "Write", { file_path: "test/guarda.test.ts" }],
  [R, "apagar um teste", "Bash", { command: "rm test/guarda.test.ts" }],
  [R, "ler o .env", "Read", { file_path: ".env" }],
  [R, "mostrar o .env no terminal", "Bash", { command: "cat .env" }],
  [R, "mostrar a chave", "Bash", { command: "printenv LLM_API_KEY" }],
  [R, "commitar o .env", "Bash", { command: "git add -f .env" }],
  [R, "escrever no .env", "Write", { file_path: ".env" }],
];

let falhas = 0;
for (const [esperado, nome, tool_name, tool_input] of casos) {
  const r = spawnSync(process.execPath, [trava], {
    input: JSON.stringify({ tool_name, tool_input, cwd: raiz }),
    env: { ...process.env, CLAUDE_PROJECT_DIR: raiz },
    encoding: "utf8",
  });
  const ok = r.status === esperado;
  if (!ok) falhas++;
  if (!mutante || !ok) {
    console.log(`${ok ? "ok   " : "FALHA"} ${esperado === R ? "recusa" : "libera"}: ${nome}` + (ok ? "" : ` (saída ${r.status})`));
  }
}

if (mutante) {
  if (falhas > 0) {
    console.log(`\nMUTANTE PEGO: com a trava liberando tudo, ${falhas} casos falharam. O teste sabe reconhecer uma trava cega.`);
    process.exit(0);
  }
  console.log("\nMUTANTE VIVO: o teste não percebeu a trava cega. O teste não testa nada.");
  process.exit(1);
}
console.log(`\n${casos.length - falhas} passaram, ${falhas} falharam`);
process.exit(falhas ? 1 : 0);
