# A imagem leva o Node, as dependências e o código. Roda igual em qualquer
# máquina com Docker.
FROM node:24-slim

WORKDIR /app

# Dependências antes do código: enquanto o package.json não muda, esta camada
# vem do cache e o build é rápido.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# O cliente do Prisma é gerado a partir do schema, dentro da imagem.
RUN npx prisma generate

# Aplica as migrations e só então sobe a API. Se a migration falha, o
# container não sobe.
CMD ["sh", "-c", "npx prisma migrate deploy && node index.js"]
