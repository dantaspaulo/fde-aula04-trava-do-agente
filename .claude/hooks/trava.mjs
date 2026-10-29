// Trava do agente para o repo da prática do reembolso (PreToolUse do Claude Code).
//
// Roda ANTES de o agente usar o terminal, ler ou escrever arquivo.
//   saída 0 = libera
//   saída 2 = recusa; o texto do stderr volta para o agente ler e mudar de rumo
//
// Transforma em mecanismo três regras que no AGENTS.md eram só texto:
//   1. dados/banco.json é somente leitura;
//   2. os testes que já existem são o contrato: o agente não edita, não apaga, não sobrescreve
//      (teste NOVO pode, como no Exercício 5);
//   3. a chave do .env não aparece: o agente não lê, não mostra, não escreve e não commita o .env.
//
// Prova: bun .claude/hooks/trava.teste.mjs   (e --mutante, para ver o teste pegar uma trava que libera tudo)
import { existsSync } from "node:fs";
import { isAbsolute, join, relative } from "node:path";

function recusa(motivo, regra) {
  process.stderr.write(
    `RECUSADO (trava): ${motivo}. ${regra} ` +
      "Não procure outro caminho para o mesmo efeito: explique o que queria fazer e peça à pessoa.\n",
  );
  process.exit(2);
}

const REGRA_BANCO = "Regra 2 do AGENTS.md: dados/banco.json é somente leitura; o estado mutável vive em dados/estado.json.";
const REGRA_TESTE = "Os testes são o contrato da prática: faça o código passar, nunca o teste ceder.";
const REGRA_CHAVE = "A chave é de quem usa: o agente não lê, não mostra, não escreve e não commita o .env.";

let entrada;
try {
  const partes = [];
  for await (const parte of process.stdin) partes.push(parte);
  entrada = JSON.parse(Buffer.concat(partes).toString("utf8"));
} catch {
  process.exit(0); // entrada estranha: a trava nunca pode travar a sessão inteira
}

const ferramenta = entrada.tool_name || "Bash";
const dados = entrada.tool_input || {};
const base = entrada.cwd || process.cwd();

// caminho relativo à raiz do projeto, com barras normais
function rel(caminho) {
  const abs = isAbsolute(caminho) ? caminho : join(base, caminho);
  return relative(process.env.CLAUDE_PROJECT_DIR || base, abs).split("\\").join("/");
}
const ehBanco = (r) => /(^|\/)dados\/banco\.json$/.test(r);
const ehTeste = (r) => /(^|\/)test\//.test(r);
const ehEnv = (r) => /(^|\/)\.env$/.test(r);

if (["Write", "Edit", "MultiEdit", "NotebookEdit"].includes(ferramenta)) {
  const alvo = dados.file_path || dados.notebook_path || "";
  const r = rel(alvo);
  if (ehBanco(r)) recusa("escrever em dados/banco.json", REGRA_BANCO);
  if (ehEnv(r)) recusa("escrever no .env", REGRA_CHAVE);
  const abs = isAbsolute(alvo) ? alvo : join(base, alvo);
  if (ehTeste(r) && (ferramenta !== "Write" || existsSync(abs))) {
    recusa(`mudar um teste que já existe (${r})`, REGRA_TESTE);
  }
  process.exit(0);
}

if (ferramenta === "Read") {
  if (ehEnv(rel(dados.file_path || ""))) recusa("ler o .env", REGRA_CHAVE);
  process.exit(0);
}

const cmd = String(dados.command || "");
const MEXE = String.raw`\b(rm|mv|cp|tee|truncate|shred|unlink|dd)\b[^;&|]*`;
if (new RegExp(MEXE + String.raw`banco\.json`).test(cmd) || /(>|\bsed\s+-i|\bperl\s+-[a-z]*i)[^;&|]*banco\.json/.test(cmd)) {
  recusa("comando que apaga, move ou altera dados/banco.json", REGRA_BANCO);
}
if (new RegExp(MEXE + String.raw`(^|[\s'"./])test/`).test(cmd) || /(>|\bsed\s+-i|\bperl\s+-[a-z]*i)[^;&|]*(^|[\s'"./])test\//.test(cmd)) {
  recusa("comando que apaga, move ou altera arquivo da pasta test/", REGRA_TESTE);
}
const tocaEnv = /(^|[\s'"=/])\.env(?![\w.-])/.test(cmd);
if (tocaEnv && /\bgit\s+add\b/.test(cmd)) recusa("pôr o .env num commit", REGRA_CHAVE);
// única leitura liberada: contar se a linha da chave está preenchida, sem imprimir a chave
const soConta = /^\s*grep\s+-c\s+('[^']*'|"[^"]*"|\S+)\s+\.env\s*$/.test(cmd);
if (tocaEnv && !soConta && /\b(cat|less|more|head|tail|grep|egrep|rg|awk|sed|bat|strings|xxd|od|nl|base64|source|open|code|vi|vim|nano)\b|>>?\s*\.env|\.\s+\.env/.test(cmd)) {
  recusa("ler, mostrar ou alterar o .env pelo terminal", REGRA_CHAVE);
}
if (/\b(printenv|echo|printf)\b[^;&|]*LLM_API_KEY|\benv\b\s*\|/.test(cmd)) {
  recusa("mostrar a chave pelo terminal", REGRA_CHAVE);
}
process.exit(0);
