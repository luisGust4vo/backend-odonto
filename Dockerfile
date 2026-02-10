FROM node:20-alpine

WORKDIR /app

# instala deps primeiro (melhora cache)
COPY package*.json ./
RUN npm ci

# copia o resto
COPY . .

EXPOSE 3000

CMD ["npm", "run", "start:dev"]
