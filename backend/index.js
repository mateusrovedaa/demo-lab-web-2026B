import "dotenv/config";
import express from "express";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "./generated/prisma/client.ts";

// O adapter é o motorista: sabe falar com este banco específico.
// O PrismaClient é o ORM: fala em objetos e deixa o SQL com o adapter.
const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const app = express();
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

// As rotas não mudaram de forma. O que mudou é de onde vêm os dados,
// e que agora eles sobrevivem ao restart do servidor.
app.get("/inscricoes", async (req, res) => {
  const inscricoes = await prisma.inscricao.findMany({
    orderBy: { criadaEm: "desc" },
  });
  res.json(inscricoes);
});

app.post("/inscricoes", async (req, res) => {
  const { nome, email } = req.body ?? {};

  if (!nome || !email) {
    return res.status(400).json({ erro: "nome e email são obrigatórios" });
  }

  const jaExiste = await prisma.inscricao.findUnique({ where: { email } });
  if (jaExiste) {
    return res.status(409).json({ erro: "esse e-mail já está na lista" });
  }

  const inscricao = await prisma.inscricao.create({ data: { nome, email } });
  res.status(201).json(inscricao);
});

app.listen(3001, () => {
  console.log("API ouvindo em http://localhost:3001");
});
