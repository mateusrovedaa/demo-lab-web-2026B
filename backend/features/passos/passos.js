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

When("peço a lista da organização sem estar logado", async function () {
  await guardarResposta(this, await api("/admin/inscricoes"));
});

Given("que sou da organização", async function () {
  // O cadastro já abre sessão: o cookie vem no próprio sign-up, sem login separado.
  const resposta = await api("/api/auth/sign-up/email", {
    metodo: "POST",
    corpo: { name: "Organização", email: "org@exemplo.com", password: "senha-de-teste-123" },
  });
  assert.ok(resposta.ok, `cadastro da organização falhou com ${resposta.status}`);
  this.cookie = resposta.headers.getSetCookie()[0].split(";")[0];
});

When("peço a lista da organização", async function () {
  await guardarResposta(this, await api("/admin/inscricoes", { cookie: this.cookie }));
});

When("marco a inscrição de {string} como {string}", async function (email, status) {
  const lista = await (await api("/admin/inscricoes", { cookie: this.cookie })).json();
  const inscricao = lista.find((i) => i.email === email);
  assert.ok(inscricao, `esperava ${email} na lista da organização`);
  await guardarResposta(
    this,
    await api(`/admin/inscricoes/${inscricao.id}`, {
      metodo: "PATCH",
      corpo: { status },
      cookie: this.cookie,
    }),
  );
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

Then("a lista da organização deve conter o e-mail {string}", function (email) {
  assert.ok(this.corpo.some((i) => i.email === email), `esperava ${email} na lista`);
});

Then("a resposta deve dizer {string}", function (trecho) {
  assert.ok(JSON.stringify(this.corpo).includes(trecho), `resposta não diz ${trecho}`);
});
