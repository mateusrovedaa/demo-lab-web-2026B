// O cliente da biblioteca, criado uma vez e importado onde precisar.
// Ele fala com as rotas /api/auth do backend, as mesmas que o curl chamou.
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:3001",

  // Sem isto o navegador não manda o cookie para outra origem, e o servidor
  // atende como se ninguém estivesse logado. É o par do `credentials: true`
  // que está no CORS do backend: os dois lados precisam concordar.
  fetchOptions: { credentials: "include" },
});
