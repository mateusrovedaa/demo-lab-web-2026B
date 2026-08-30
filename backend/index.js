import "dotenv/config";
import express from "express";
import cors from "cors";
import { toNodeHandler, fromNodeHeaders } from "better-auth/node";
import { auth } from "./auth.js";
import { prisma } from "./prisma.js";

const app = express();

app.use(
  cors({
    origin: process.env.ORIGEM_DO_FRONTEND,
    credentials: true,
  })
);

// A biblioteca entra antes do express.json() de propósito: ela lê o corpo da
// requisição do jeito dela, e quem lê primeiro consome o stream.
app.all("/api/auth/*splat", toNodeHandler(auth));

app.use(express.json());

// Uma função só, usada por toda rota que exige login. A checagem mora aqui,
// não copiada em cada rota.
async function exigirLogin(req, res, next) {
  const sessao = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });

  // 401 é "não sei quem é você". 403 seria "sei, e você não pode".
  if (!sessao) {
    return res.status(401).json({ erro: "precisa estar logado" });
  }

  req.usuario = sessao.user;
  next();
}

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

// Público, e por isso devolve só o nome. Quem está na fila não precisa
// mostrar o e-mail para o mundo inteiro. Esconder no frontend não adianta:
// o que a API devolve, qualquer um lê.
app.get("/inscricoes", async (req, res) => {
  const inscricoes = await prisma.inscricao.findMany({
    orderBy: { criadaEm: "desc" },
    select: { id: true, nome: true, criadaEm: true },
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

// Daqui para baixo, só com sessão válida.
app.get("/admin/inscricoes", exigirLogin, async (req, res) => {
  const inscricoes = await prisma.inscricao.findMany({
    orderBy: { criadaEm: "desc" },
  });
  res.json(inscricoes);
});

app.patch("/admin/inscricoes/:id", exigirLogin, async (req, res) => {
  const { status } = req.body ?? {};

  // O usuário está logado, e ainda assim a entrada dele é validada.
  // Autenticado não é o mesmo que confiável.
  const permitidos = ["na_fila", "chamada", "desistiu"];
  if (!permitidos.includes(status)) {
    return res.status(400).json({ erro: `status deve ser um de: ${permitidos.join(", ")}` });
  }

  const inscricao = await prisma.inscricao.update({
    where: { id: Number(req.params.id) },
    data: { status },
  });

  res.json(inscricao);
});

app.listen(3001, () => {
  console.log("API ouvindo em http://localhost:3001");
});
