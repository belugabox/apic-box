# Étape 1 : Construction
FROM node:slim AS build

# Installer les dépendances de compilation pour better-sqlite3
RUN apt-get update && apt-get install -y python3 make g++ \
    && ln -sf python3 /usr/bin/python \
    && rm -rf /var/lib/apt/lists/*

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

# Installer les dépendances de compilation pour better-sqlite3
RUN apt-get update && apt-get install -y python3 make g++ \
    && ln -sf python3 /usr/bin/python \
    && rm -rf /var/lib/apt/lists/*

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers nécessaires pour exécuter le serveur
COPY --from=build /build/package.json /build/pnpm-workspace.yaml ./
COPY --from=build /build/apps/client/package.json ./apps/client/
COPY --from=build /build/apps/client/dist ./apps/client/dist/
COPY --from=build /build/apps/server/package.json ./apps/server/
COPY --from=build /build/apps/server/dist ./apps/server/dist/

# Installer pnpm et les dépendances de production uniquement
RUN npm install -g pnpm
RUN pnpm install --filter=server --prod

# Exposer les ports
EXPOSE 3001

ENV DATA_FILE_PATH=/data

# Commande pour démarrer l'application
CMD ["pnpm", "run", "-C", "apps/server", "start"]
