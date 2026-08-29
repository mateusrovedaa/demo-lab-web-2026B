// Toda a configuração de autenticação em um arquivo. O que está aqui decide
// como a senha é guardada, quanto tempo a sessão dura e quem pode pedir login.
import "dotenv/config";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma.js";

const producao = process.env.NODE_ENV === "production";

export const auth = betterAuth({
  // Usuário, sessão e conta ficam no mesmo banco da aplicação, pelo mesmo
  // Prisma. Não existe um segundo banco só de usuários.
  database: prismaAdapter(prisma, { provider: "sqlite" }),

  // Onde a API está. Vai nos links de e-mail e na validação de origem.
  baseURL: process.env.BETTER_AUTH_URL,

  // Só estas origens podem pedir login. Requisição vinda de outro site leva
  // 403 antes de chegar no banco. É a proteção contra CSRF.
  trustedOrigins: [process.env.ORIGEM_DO_FRONTEND],

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,

    // Recuperação de senha. Aqui o link só é impresso no terminal, para dar
    // para ver funcionando sem contratar serviço de e-mail. Em produção esta
    // função chama o Resend, o SendGrid ou o SMTP da instituição.
    sendResetPassword: async ({ user, url }) => {
      console.log(`[e-mail] recuperação de senha de ${user.email}: ${url}`);
    },
  },

  // Sem isto, quem tem tempo testa senha até acertar. Vem ligado sozinho em
  // produção; ligamos aqui para dar para demonstrar em aula.
  rateLimit: {
    enabled: true,
    window: 60,
    max: 100,
    customRules: {
      "/sign-in/email": { window: 60, max: 5 },
    },
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7, // a sessão vence em 7 dias
    updateAge: 60 * 60 * 24, // e se renova a cada dia de uso
  },

  advanced: {
    defaultCookieAttributes: {
      // O cookie só viaja em HTTPS. Em desenvolvimento fica falso porque
      // localhost é HTTP, e um cookie secure simplesmente não seria enviado.
      secure: producao,

      // Em produção, com front e back em domínios diferentes, o cookie só
      // atravessa com "none", e "none" só vale junto de secure.
      sameSite: producao ? "none" : "lax",
    },
  },
});
