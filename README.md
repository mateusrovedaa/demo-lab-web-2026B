# Lista de espera

Demo da aula 4 do Laboratório de Programação para Internet. Um frontend e um
backend separados, conversando por HTTP, com os dados num banco de verdade.

A funcionalidade é a menor possível de propósito: entrar numa fila com nome e
e-mail, e ver quem já está nela. É a mesma forma que a primeira feature de
vocês vai ter na aula 5, então serve de molde.

## O que tem aqui

```
backend/             API em Node com Express, na porta 3001
  index.js           as rotas: quem responde o quê
  prisma/schema.prisma   o desenho do banco
  prisma/migrations/     o histórico de mudanças do banco
  requisicoes.http   requisições prontas para testar sem frontend
frontend/            tela em React com Vite, na porta 5173
  src/App.jsx        a lista e o formulário
```

Duas pastas, dois `package.json`, dois processos, duas portas. O que liga os
dois é o contrato: JSON por HTTP. Nada mais.

## Rodando

Precisa de Node 24 ou mais novo. Confira com `node --version`.

```bash
# terminal 1: a API
cd backend
npm install
cp .env.example .env
npm run migrate      # cria o banco e as tabelas
npm run dev          # http://localhost:3001

# terminal 2: a tela
cd frontend
npm install
cp .env.example .env
npm run dev          # http://localhost:5173
```

Comandos úteis do backend:

```bash
npm run studio       # abre o Prisma Studio e mostra as tabelas
npm run generate     # regera o cliente do Prisma a partir do schema
```

## As etapas

O repositório foi construído em seis passos, um por commit, cada um com uma
tag. Para ver o código como ele estava em qualquer momento da aula:

```bash
git checkout etapa-3      # volta para o passo 3
git checkout main         # volta para o final
```

| Tag | O que entra | O que ela ensina |
| --- | --- | --- |
| `etapa-1` | Express no ar, `GET /health` e `GET /inscricoes` com dados em memória | Servidor é um programa que fica ouvindo numa porta e responde requisições |
| `etapa-2` | `POST /inscricoes`, validação, 400, 409, 201 | Verbo, corpo e status code. O status é a resposta do servidor sobre o pedido |
| `etapa-3` | Prisma e SQLite no lugar do array | O dado sobrevive ao restart. Schema, migration e ORM |
| `etapa-4` | Frontend em React buscando a lista com `fetch` | O navegador bloqueia: é o CORS aparecendo |
| `etapa-5` | `cors` no backend e o formulário no frontend | Duas origens diferentes precisam de autorização explícita |
| `etapa-6` | README, scripts e `.env.example` | O que faz o projeto rodar na máquina de outra pessoa |

As dependências das seis etapas já estão no `package.json` desde o primeiro
commit. Instale uma vez e navegue entre as tags sem reinstalar nada.

## Sobre o ORM

O Prisma existe para você não escrever isto:

```js
const linhas = await db.query(
  "SELECT * FROM Inscricao WHERE email = '" + email + "'"
);
```

Esse código tem dois problemas. O primeiro é que qualquer pessoa que digite
`' OR '1'='1` no campo de e-mail lê a tabela inteira: é SQL injection. O
segundo é que o resultado vem como linha de banco, e virar objeto do seu
código é trabalho manual, repetido em cada consulta.

Com ORM a mesma consulta é:

```js
const inscricao = await prisma.inscricao.findUnique({ where: { email } });
```

O valor vai como parâmetro, não concatenado, e o retorno já é objeto. O editor
completa `prisma.inscricao.` com os campos reais do seu schema, porque o
cliente é gerado a partir dele.

O que o ORM não é: mágica. Ele gera SQL, e SQL mal gerado é lento igual. Para
ver o que ele está mandando para o banco:

```js
const prisma = new PrismaClient({ adapter, log: ["query"] });
```

E trocar o SQLite por Postgres é mudar o `provider` no schema, o adapter e a
`DATABASE_URL`. As rotas não mudam. Esse é o ponto do ORM.

## Quando der errado

- **`Access to fetch ... blocked by CORS policy`**: o backend não está liberando
  a origem do frontend. É a etapa 5.
- **`EADDRINUSE`**: já tem alguma coisa na porta 3001. Feche o outro terminal ou
  troque a porta.
- **`Cannot find module './generated/prisma/client.ts'`**: falta rodar
  `npm run generate`. O cliente não vai para o repositório, ele nasce do schema.
- **`Unknown file extension ".ts"`**: seu Node é antigo. O cliente do Prisma 7 é
  gerado em TypeScript, e o Node 24 em diante executa isso direto.
- **npm pedindo `approve-scripts`**: versões novas do npm não rodam script de
  instalação sem autorização. O `package.json` daqui já traz as aprovações.
- **A lista aparece vazia**: confira se o backend está rodando e se o `.env` do
  frontend aponta para a porta certa. A aba Network do navegador responde isso
  em cinco segundos.

## Para o projeto de vocês

Copiem a forma, não o conteúdo. O que vale levar:

- Duas pastas separadas, cada uma com seu `package.json`.
- `.env` fora do repositório e `.env.example` dentro dele.
- Uma rota de saúde, para saber se o serviço está de pé.
- O status code certo em cada resposta: 200, 201, 400, 404, 409.
- O schema do banco versionado em migration, nunca alterado na mão.
