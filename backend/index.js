import "dotenv/config";
import { fileURLToPath } from "node:url";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { z } from "zod";
import { pinoHttp } from "pino-http";
import { toNodeHandler, fromNodeHeaders } from "better-auth/node";
import { auth } from "./auth.js";
import { prisma } from "./prisma.js";
import { logger } from "./logs.js";

const app = express();
export { app };

// OWASP Top 10 2025, A02 (configuração insegura): o helmet liga os cabeçalhos
// de segurança básicos numa linha.
app.use(helmet());

app.use(
  cors({
    origin: process.env.ORIGEM_DO_FRONTEND,
    credentials: true,
  })
);

// Cada requisição vira uma linha de log com id próprio, e ganha req.log:
// o resto do código não precisa carregar o logger na mão.
app.use(
  pinoHttp({
    logger,
    // Silêncio no health check: a sonda de vida não pode encher o log.
    autoLogging: { ignore: (req) => req.url === "/health" },
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

// A regra de entrada em um lugar só, declarada como dado. O if por campo
// ficava disperso entre as rotas, e um e-mail sem forma de e-mail passava.
// O que não está no schema é descartado: campo inventado não é guardado.
const inscricaoSchema = z.object({
  nome: z.string().trim().min(1, "o nome é obrigatório"),
  email: z.email("o e-mail precisa ter forma de e-mail"),
});

const statusSchema = z.object({
  status: z.enum(["na_fila", "chamada", "desistiu"]),
});

const idSchema = z.coerce.number().int().positive("o id precisa ser um número");

// O 400 devolve o que está errado, campo a campo: quem chama a API consegue
// apontar o erro no formulário em vez de adivinhar.
function camposInvalidos(erroZod) {
  return erroZod.issues.map((issue) => ({
    campo: issue.path.join("."),
    mensagem: issue.message,
  }));
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
  const dados = inscricaoSchema.safeParse(req.body);

  if (!dados.success) {
    return res.status(400).json({ erro: "dados inválidos", campos: camposInvalidos(dados.error) });
  }

  const { nome, email } = dados.data;

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
  // O usuário está logado, e ainda assim a entrada dele é validada.
  // Autenticado não é o mesmo que confiável: o cookie não valida a forma.
  const id = idSchema.safeParse(req.params.id);
  if (!id.success) {
    return res.status(400).json({ erro: "dados inválidos", campos: camposInvalidos(id.error) });
  }

  const dados = statusSchema.safeParse(req.body);
  if (!dados.success) {
    return res.status(400).json({ erro: "dados inválidos", campos: camposInvalidos(dados.error) });
  }

  const inscricao = await prisma.inscricao.update({
    where: { id: id.data },
    data: { status: dados.data.status },
  });

  res.json(inscricao);
});

// O handler de erros fica no fim, depois de todas as rotas. O Express 5 manda
// para cá a promessa rejeitada de um handler async, sem try/catch nas rotas.
app.use((erro, req, res, _next) => {
  // Só chega aqui o erro inesperado; 400, 401 e 409 as rotas já responderam.
  // O erro completo vai para o log e o cliente recebe só "erro interno"
  // (OWASP 2025, A10: não expor stack trace).
  req.log.error({ err: erro }, "requisição falhou");
  res.status(500).json({ erro: "erro interno" });
});

// Quando este arquivo é importado pelos testes, o servidor não sobe: os
// testes sobem o app numa porta efêmera, contra um banco temporário.
const executadoDireto = process.argv[1] === fileURLToPath(import.meta.url);
if (executadoDireto) {
  app.listen(3001, () => {
    logger.info("API ouvindo em http://localhost:3001");
  });
}
