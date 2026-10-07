# Lista de espera

Demo das aulas 4 e 6 do Laboratório de Programação para Internet. Um frontend
e um backend separados, conversando por HTTP, com os dados num banco de verdade
e uma área que só abre com login.

A funcionalidade é a menor possível de propósito. A fila é pública: qualquer um
entra com nome e e-mail, e qualquer um vê quem está nela, só os nomes. A área da
organização exige conta, e é lá que aparecem os e-mails e o status de cada
inscrição. Duas coisas no mesmo sistema, com regras diferentes, que é a forma
que quase todo projeto de vocês vai ter.

## O que tem aqui

```
backend/             API em Node com Express, na porta 3001
  index.js           as rotas: quem responde o quê
  auth.js            a configuração da autenticação, num lugar só
  prisma.js          o cliente do banco, compartilhado pelas rotas e pelo auth
  prisma/schema.prisma   o desenho do banco
  prisma/migrations/     o histórico de mudanças do banco
  requisicoes.http   requisições prontas para testar sem frontend
frontend/            tela em React com Vite, na porta 5173
  src/App.jsx        a fila pública, o login e a área da organização
  src/auth-client.js o cliente da biblioteca de auth
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
npm run test:bdd     # os exemplos de BDD da aula 8 (cucumber-js, Gherkin em pt-BR)
```

Os cenários moram em `backend/features/`: `fila.feature` cobre a fila pública
(entrar, 400, 409, e-mail escondido) e `admin.feature` cobre a área da
organização (401 sem sessão, lista com e-mails, troca de status). Cada execução
sobe a API de verdade contra um banco SQLite temporário e joga ele fora no fim:
o `dev.db` nunca é encostado.

Não existe usuário de fábrica. Crie o seu com o backend rodando:

```bash
curl -X POST localhost:3001/api/auth/sign-up/email \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:5173" \
  -d '{"name":"Seu Nome","email":"voce@exemplo.com","password":"senha-de-teste-123"}'
```

Depois é só entrar pela tela. O `Origin` está aí porque a API recusa pedido de
login vindo de origem que ela não conhece, e o curl não manda esse cabeçalho
sozinho.

## Rodando com Docker

Só precisa de Docker. No `backend/.env`, troque `ORIGEM_DO_FRONTEND` e
`BETTER_AUTH_URL` para `http://localhost:8080` (tela e API passam a ficar no
mesmo endereço). O caminho do banco o compose já define.

```bash
docker compose up --build        # builda as duas imagens e sobe os dois serviços
curl localhost:8080/health       # o nginx repassa para a API
docker compose logs -f backend   # os logs do pino
docker compose down              # desce tudo; o volume "dados" guarda o banco
```

A tela fica em http://localhost:8080. O nginx repassa `/api`, `/inscricoes`,
`/admin` e `/health` para a API.

## As etapas

O repositório foi construído em treze passos, um por commit, cada um com uma
tag. As etapas 1 a 6 são da aula 4, as 7 a 10 são da aula 6, as 11 a 13 são
da aula 8, as 14 a 17 são da aula 11 (em vídeo). Para ver o código como ele
estava em qualquer momento da aula:

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
| `etapa-7` | Better Auth, tabelas de usuário e sessão, cookie httpOnly | Login é uma linha na tabela e um cookie que o JavaScript não lê |
| `etapa-8` | `exigirLogin`, rotas `/admin` e lista pública sem e-mail | Quem decide o que você pode ver é o servidor, não a tela |
| `etapa-9` | Tela de login, `useSession`, área da organização e logout | O frontend pergunta ao servidor quem está logado, não decide sozinho |
| `etapa-10` | Rate limit, recuperação de senha e cookies de produção | O que separa um login que funciona de um login que aguenta |
| `etapa-11` | `index.js` exporta o app; cucumber-js, `test:bdd` e banco temporário por execução | Refatoração para testabilidade: importar sem subir o servidor |
| `etapa-12` | `fila.feature` e os passos: entrar, 400, 409, e-mail escondido | O cenário legível vira teste executável |
| `etapa-13` | `admin.feature` e os passos: 401, lista com e-mails, troca de status | A mesma linguagem cobre regra de autorização |
| `etapa-14` | Validação de entrada com zod e headers com helmet | Input é dado de fora: só entra o que o schema deixa, e o 400 diz o campo errado |
| `etapa-15` | pino-http para log estruturado e handler central de erro | Cada requisição é uma linha com id; o erro inesperado é logado no servidor, não vazado para o cliente |
| `etapa-16` | Dockerfile do backend e do frontend, nginx e docker compose | A imagem leva tudo o que o código precisa e sobe igual em qualquer máquina com Docker |

As dependências de todas as etapas já estão no `package.json` desde o primeiro
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
- **`Model user does not exist in the database`**: a migration rodou mas o
  cliente do Prisma é o antigo. Rode `npm run generate`.
- **Login responde 200 e a tela continua deslogada**: o cookie não está indo.
  Falta `credentials: "include"` no frontend, ou `credentials: true` no CORS do
  backend. Precisa dos dois.
- **`Invalid origin`, com 403 no login**: a origem do frontend não está em
  `trustedOrigins`, no `auth.js`. No curl, é o cabeçalho `Origin` que falta.
- **429 no login**: o rate limit da etapa 10 pegou você. Espere um minuto.

## Para o projeto de vocês

Copiem a forma, não o conteúdo. O que vale levar:

- Duas pastas separadas, cada uma com seu `package.json`.
- `.env` fora do repositório e `.env.example` dentro dele.
- Uma rota de saúde, para saber se o serviço está de pé.
- O status code certo em cada resposta: 200, 201, 400, 401, 403, 404, 409.
- O schema do banco versionado em migration, nunca alterado na mão.
- Autenticação com biblioteca, não escrita à mão.
- A checagem de sessão numa função só, usada por toda rota protegida.
- Cada rota devolvendo só o que aquele usuário pode ver.
