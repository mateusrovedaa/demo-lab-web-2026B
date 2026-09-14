// Os passos traduzem as frases em português para requisições HTTP de verdade.
// Nada aqui conhece Express ou Prisma: só o contrato JSON por HTTP.
import assert from "node:assert";
import { Given, When, Then } from "@cucumber/cucumber";
import { url } from "../suporte/mundo.js";

const ORIGEM = process.env.ORIGEM_DO_FRONTEND;

async function api(caminho, { metodo = "GET", corpo, cookie } = {}) {
  return fetch(url(caminho), {
    method: metodo,
    headers: {
      ...(corpo ? { "Content-Type": "application/json" } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
      Origin: ORIGEM,
    },
    ...(corpo ? { body: JSON.stringify(corpo) } : {}),
  });
}

async function guardarResposta(mundo, resposta) {
  mundo.resposta = resposta;
  const texto = await resposta.text();
  try {
    mundo.corpo = JSON.parse(texto);
  } catch {
    mundo.corpo = texto;
  }
}

Given("que a fila está vazia", async function () {
  // Garantido pelo Before de cada cenário; o passo existe para a frase ler bem.
});

When("entro na fila com nome {string} e e-mail {string}", async function (nome, email) {
  await guardarResposta(this, await api("/inscricoes", { metodo: "POST", corpo: { nome, email } }));
});

When("tento entrar na fila só com nome {string}", async function (nome) {
  await guardarResposta(this, await api("/inscricoes", { metodo: "POST", corpo: { nome } }));
});

When("peço a lista pública", async function () {
  await guardarResposta(this, await api("/inscricoes"));
});

Then("o status da resposta deve ser {int}", function (esperado) {
  assert.equal(this.resposta.status, esperado);
});

Then("a lista pública deve conter {string}", async function (nome) {
  const lista = await (await api("/inscricoes")).json();
  assert.ok(lista.some((i) => i.nome === nome), `esperava ${nome} na lista pública`);
});

Then("a lista pública não deve expor {string}", async function (email) {
  const texto = await (await api("/inscricoes")).text();
  assert.ok(!texto.includes(email), "a lista pública vazou o e-mail");
});

Then("a resposta deve dizer {string}", function (trecho) {
  assert.ok(JSON.stringify(this.corpo).includes(trecho), `resposta não diz ${trecho}`);
});
