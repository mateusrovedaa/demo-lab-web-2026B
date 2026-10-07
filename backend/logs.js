// O logger do backend. Uma linha JSON por evento, com nível e id da
// requisição, escrita no stdout. No container, `docker compose logs` lê.
import pino from "pino";

export const logger = pino({
  level: process.env.NIVEL_DE_LOG ?? "info",

  // Cookie e Authorization não entram no log: quem lê o log do servidor
  // poderia usar a sessão de qualquer usuário.
  redact: {
    paths: [
      "req.headers.cookie",
      "req.headers.authorization",
      'res.headers["set-cookie"]',
    ],
    censor: "[oculto]",
  },
});
