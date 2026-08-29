// Toda a configuração de autenticação em um arquivo. O que está aqui decide
// como a senha é guardada, quanto tempo a sessão dura e quem pode pedir login.
import "dotenv/config";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma.js";

export const auth = betterAuth({
  // Usuário, sessão e conta ficam no mesmo banco da aplicação, pelo mesmo
  // Prisma. Não existe um segundo banco só de usuários.
  database: prismaAdapter(prisma, { provider: "sqlite" }),

  // Onde a API está. Vai nos links de e-mail e na validação de origem.
  baseURL: process.env.BETTER_AUTH_URL,

  // Só estas origens podem pedir login. Requisição vinda de outro site leva
  // 403 antes de chegar no banco. É a proteção contra CSRF.
  trustedOrigins: [process.env.ORIGEM_DO_FRONTEND],

  // Login por e-mail e senha. A senha é hasheada com scrypt, nunca guardada.
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
});
