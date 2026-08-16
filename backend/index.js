import express from "express";

const app = express();

// Sem isso, req.body chega undefined: alguém precisa ler o corpo da
// requisição e transformar o texto JSON em objeto JavaScript.
app.use(express.json());

const inscricoes = [
  { id: 1, nome: "Ana Souza", email: "ana@exemplo.com", status: "na_fila" },
  { id: 2, nome: "Bruno Lima", email: "bruno@exemplo.com", status: "na_fila" },
];
let proximoId = 3;

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

app.get("/inscricoes", (req, res) => {
  res.json(inscricoes);
});

// POST é criação. O cliente manda o corpo, o servidor decide se aceita.
app.post("/inscricoes", (req, res) => {
  const { nome, email } = req.body ?? {};

  // 400: o pedido veio errado. A culpa é de quem chamou.
  if (!nome || !email) {
    return res.status(400).json({ erro: "nome e email são obrigatórios" });
  }

  // 409: o pedido está bem formado, mas conflita com o que já existe.
  if (inscricoes.some((i) => i.email === email)) {
    return res.status(409).json({ erro: "esse e-mail já está na lista" });
  }

  const inscricao = { id: proximoId++, nome, email, status: "na_fila" };
  inscricoes.push(inscricao);

  // 201: criado. Devolve o recurso, agora com o id que o servidor deu.
  res.status(201).json(inscricao);
});

app.listen(3001, () => {
  console.log("API ouvindo em http://localhost:3001");
});
