# Étape 1 : Construction
FROM node:slim AS build

# Copier les fichiers
WORKDIR /build
COPY package.json pnpm-workspace.yaml ./
COPY apps ./apps/

# Installer pnpm et les dépendances
RUN npm install -g pnpm
RUN pnpm install

# Construire l'application
RUN pnpm run build

# Étape 2 : Image finale pour exécuter les deux applications
FROM node:slim AS production

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers nécessaires pour exécuter le serveur
COPY --from=build /build/package.json /build/pnpm-workspace.yaml ./
COPY --from=build /build/apps/client/package.json ./apps/client/
COPY --from=build /build/apps/client/dist ./apps/client/dist/
COPY --from=build /build/apps/server/package.json ./apps/server/
COPY --from=build /build/apps/server/dist ./apps/server/dist/

# Installer les dépendances
RUN npm install -g pnpm
RUN pnpm install --filter=server --prod

# Exposer les ports pour le client et le serveur
EXPOSE 3001

ENV CONFIG_FILE_PATH=/config

# Commande pour démarrer les deux applications
CMD ["pnpm", "run", "start"]
