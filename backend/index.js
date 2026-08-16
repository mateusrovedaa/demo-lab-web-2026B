import express from "express";

const app = express();

// Um lugar na memória do processo. Some quando o servidor reinicia.
// Na etapa 3 isso vira uma tabela no banco.
const inscricoes = [
  { id: 1, nome: "Ana Souza", email: "ana@exemplo.com", status: "na_fila" },
  { id: 2, nome: "Bruno Lima", email: "bruno@exemplo.com", status: "na_fila" },
];

// Rota de saúde: serve para saber se o servidor está de pé.
app.get("/health", (req, res) => {
  res.json({ ok: true });
});

// GET é leitura. Devolve a lista inteira, em JSON, com status 200.
app.get("/inscricoes", (req, res) => {
  res.json(inscricoes);
});

app.listen(3001, () => {
  console.log("API ouvindo em http://localhost:3001");
});
