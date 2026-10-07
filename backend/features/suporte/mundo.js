// Suporte dos testes BDD: sobe a API de verdade, uma vez por execução,
// contra um banco SQLite temporário. Nenhum mock: o teste atravessa
// Express, Better Auth e Prisma até o disco, e o banco vai fora no fim.
import { AfterAll, Before, BeforeAll } from "@cucumber/cucumber";
import { execSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const backend = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const pasta = mkdtempSync(join(tmpdir(), "lista-espera-teste-"));

// Antes de qualquer import da API: dotenv não sobrescreve variável que já
// existe, então o .env do backend carrega o resto sem encostar no banco.
process.env.DATABASE_URL = `file:${join(pasta, "teste.db")}`;

// Na CI não existe .env. Os testes definem o que precisam, e o .env, quando
// existe, não sobrescreve.
process.env.ORIGEM_DO_FRONTEND ??= "http://localhost:5173";
process.env.BETTER_AUTH_SECRET ??= "segredo-so-dos-testes";
await import("dotenv/config");

let servidor;
let baseUrl;

export function url(caminho) {
  return `${baseUrl}${caminho}`;
}

BeforeAll(async function () {
  execSync("npx prisma migrate deploy", {
    cwd: backend,
    env: process.env,
    stdio: "pipe",
  });
  const { app } = await import("../../index.js");
  const { prisma } = await import("../../prisma.js");
  globalThis.__prisma = prisma;
  await new Promise((resolve) => {
    servidor = app.listen(0, () => {
      baseUrl = `http://localhost:${servidor.address().port}`;
      resolve();
    });
  });
});

// Cada cenário começa com as tabelas vazias: cenário não depende de ordem.
Before(async function () {
  const prisma = globalThis.__prisma;
  await prisma.inscricao.deleteMany();
  await prisma.user.deleteMany();
  await prisma.verification.deleteMany();
});

AfterAll(async function () {
  await new Promise((resolve) => servidor.close(resolve));
  await globalThis.__prisma.$disconnect();
  rmSync(pasta, { recursive: true, force: true });
});
