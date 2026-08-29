// O cliente do banco agora mora aqui porque duas coisas precisam dele:
// as rotas da aplicação e o Better Auth. Um cliente só, uma conexão só.
import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "./generated/prisma/client.ts";

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL });

export const prisma = new PrismaClient({ adapter });
