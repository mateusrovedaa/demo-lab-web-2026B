# Dois estágios. O primeiro usa Node para gerar HTML, CSS e JS; o segundo é só
# um nginx servindo esses arquivos, sem Node.
FROM node:24-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .

# VITE_API_URL vazio: a tela chama a API no mesmo endereço dela, e o nginx
# repassa (ver nginx.conf).
ARG VITE_API_URL=
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
