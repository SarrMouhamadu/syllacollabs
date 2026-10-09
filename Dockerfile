FROM node:20-alpine AS builder

WORKDIR /app

# Outils système pour ffmpeg et compilation native
RUN apk add --no-cache ffmpeg python3 make g++

# Copie des définitions de packages
COPY package.json ./
COPY client/package.json ./client/
COPY server/package.json ./server/
COPY server/prisma ./server/prisma/

# Installation des dépendances
RUN npm install
RUN cd client && npm install
RUN cd server && npm install

# Copie du code source complet
COPY client ./client
COPY server ./server

# Compilation du client React et du serveur Express
RUN cd client && npm run build
RUN cd server && npm run build

# Étape finale d'exécution (légère et sécurisée)
FROM node:20-alpine AS runner

WORKDIR /app

# Installation de ffmpeg pour la compression et conversion audio
RUN apk add --no-cache ffmpeg

ENV NODE_ENV=production
ENV PORT=5001

# Copie des artefacts compilés et dépendances nécessaires
COPY --from=builder /app/package.json ./
COPY --from=builder /app/client/dist ./client/dist
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/server/node_modules ./server/node_modules
COPY --from=builder /app/server/package.json ./server/package.json
COPY --from=builder /app/server/prisma ./server/prisma

# Création du dossier d'uploads audio
RUN mkdir -p /app/server/uploads/audio

WORKDIR /app/server

EXPOSE 5001

# Synchronisation de la base PostgreSQL au démarrage puis lancement du serveur
CMD ["sh", "-c", "npx prisma db push --skip-generate && node dist/index.js"]
