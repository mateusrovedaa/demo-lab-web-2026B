import "dotenv/config";
import express from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./auth.js";
import { prisma } from "./prisma.js";

const app = express();

// `credentials: true` é a novidade da aula. Sem isso o navegador até faz a
// requisição, mas não manda o cookie junto, e o servidor não reconhece ninguém.
// E com credentials não existe `origin: "*"`: precisa ser uma origem nomeada.
app.use(
  cors({
    origin: process.env.ORIGEM_DO_FRONTEND,
    credentials: true,
  })
);

// A biblioteca entra antes do express.json() de propósito: ela lê o corpo da
// requisição do jeito dela, e quem lê primeiro consome o stream.
// Uma linha, e nascem /sign-up/email, /sign-in/email, /sign-out, /get-session.
app.all("/api/auth/*splat", toNodeHandler(auth));

app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

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
