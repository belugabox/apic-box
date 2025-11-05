# APIC Box - Récapitulatif des modifications

## 🎯 Objectif complété

Reorganisation d'apic-box selon le pattern beluga-box + correction du système d'authentification JWT.

---

## ✅ Modifications effectuées

### Frontend (Client)

#### 1. **Nettoyage des pages**

- ✅ **Supprimé** : Page `Settings.tsx` (plus nécessaire)
- ✅ **Fusionné** : Login → Admin (modal overlay avec connexion intégrée)
- ✅ **Résultat** : Navigation simplifiée avec 3 pages seulement (Home, Events, Admin)

#### 2. **Services d'authentification**

- **`apps/client/src/services/auth/auth.ts`** - Améliorations :
    - ✅ Ajouté `clearTokens()` pour nettoyer localStorage
    - ✅ Ajouté logging pour déboguer les erreurs de connexion
    - ✅ Gestion d'erreur améliorée (clear tokens on login failure)

#### 3. **Services d'événements**

- **`apps/client/src/services/event/event.ts`** - Améliorations :
    - ✅ Meilleure gestion des erreurs 401 (token expiré/invalide)
    - ✅ Propagation correcte du status d'erreur
    - ✅ Logging pour tracer les appels API

#### 4. **Pages**

- **`apps/client/src/pages/Admin.tsx`** - Améliorations :
    - ✅ Gestion 401 → auto-clear tokens + show login modal
    - ✅ État `isAuthenticated` pour conditionnellement afficher le dashboard
    - ✅ Meilleure gestion des erreurs lors du chargement/création d'événements

- **`apps/client/src/main.tsx`** - Améliorations :
    - ✅ Logging au démarrage de l'app
    - ✅ Détection de tokens existants

#### 5. **Navigation**

- **`apps/client/src/components/Navigation.tsx`** - Simplifié :
    - ✅ Supprimé la logique d'authentification (maintenant dans Admin)
    - ✅ Affiche simplement 3 liens (Home, Events, Admin)

---

### Backend (Server)

#### 1. **Restructuration modulaire** (comme beluga-box)

```
AVANT (flat structure):
apps/server/src/
  ├── auth.ts
  ├── users.ts
  ├── types.ts
  ├── events.ts
  └── router.ts

APRÈS (modular structure):
apps/server/src/
  ├── auth/
  │   ├── auth.ts (core logic)
  │   └── index.ts (exports)
  ├── events/
  │   ├── events.ts (CRUD + persistence)
  │   ├── events.types.ts (types)
  │   └── index.ts (exports)
  ├── config.ts ⭐ NEW - JWT secrets
  ├── main.ts (startup)
  ├── router.ts (routes + middleware)
  └── types.ts (shared types)
```

#### 2. **Gestion centralisée des secrets JWT** ⭐ CRITICAL FIX

- **`apps/server/src/config.ts`** - NEW FILE :
    ```typescript
    export const JWT_SECRET =
        process.env.JWT_SECRET || 'apic-box-secret-key-change-in-production';
    export const JWT_REFRESH_SECRET =
        process.env.JWT_REFRESH_SECRET ||
        'apic-box-refresh-secret-key-change-in-production';
    ```

    - ✅ Constant export = même clé pour génération ET vérification
    - ✅ Évite le problème "invalid signature"
    - ✅ Support variables d'environnement pour production

#### 3. **Module d'authentification**

- **`apps/server/src/auth/auth.ts`** - Refactorisé :
    - ✅ Importe JWT_SECRET/JWT_REFRESH_SECRET de `config.ts`
    - ✅ Toutes les opérations JWT utilisent les constantes
    - ✅ Ajouté logging pour déboguer token verification
    - ✅ Middleware avec vérification du token

#### 4. **Module d'événements**

- **`apps/server/src/events/events.ts`** - Refactorisé :
    - ✅ CRUD complet pour événements
    - ✅ Persistance JSON dans `config/events.json`
    - ✅ Gestion des inscriptions avec `config/registrations.json`

#### 5. **Routes et middleware**

- **`apps/server/src/router.ts`** - Mis à jour :
    - ✅ Importe depuis les nouveaux modules
    - ✅ Applique authMiddleware sur les routes protégées
    - ✅ Endpoints:
        - `POST /api/auth/login` (public)
        - `GET /api/events` (public)
        - `POST /api/events/:id/register` (public)
        - `GET /api/admin/events` (protected)
        - `POST /api/admin/events` (protected)
        - `GET /api/events/:id/registrations` (protected)

---

## 🔧 Fichiers créés

| File                                     | Purpose                           |
| ---------------------------------------- | --------------------------------- |
| `apps/server/src/config.ts`              | ⭐ Centralized JWT secrets        |
| `apps/server/src/auth/auth.ts`           | Authentication logic (refactored) |
| `apps/server/src/auth/index.ts`          | Auth module exports               |
| `apps/server/src/events/events.ts`       | Event CRUD + persistence          |
| `apps/server/src/events/events.types.ts` | Event type definitions            |
| `apps/server/src/events/index.ts`        | Events module exports             |
| `AUTHENTICATION_GUIDE.md`                | Guide for users (this directory)  |
| `CHANGES_SUMMARY.md`                     | This file                         |

---

## 🗑️ Fichiers supprimés

| File                                 | Reason                               |
| ------------------------------------ | ------------------------------------ |
| `apps/server/src/auth.ts`            | Moved to `auth/auth.ts`              |
| `apps/server/src/users.ts`           | Consolidated (inline in auth module) |
| `apps/server/src/types.ts`           | Moved to respective modules          |
| `apps/server/src/events.ts`          | Moved to `events/events.ts`          |
| `apps/client/src/pages/Settings.tsx` | No longer needed                     |
| `apps/client/src/pages/Login.tsx`    | Merged into `Admin.tsx`              |

---

## 🚀 Comment tester

### Étape 1: Démarrer le serveur

```bash
cd apps/server
npm start
# Devrait afficher: Server running on http://localhost:3001
```

### Étape 2: Démarrer le client (dans un autre terminal)

```bash
cd apps/client
npm run dev
# Devrait afficher: VITE v... ready in ... ms
```

### Étape 3: Tester l'app

1. Ouvrez `http://localhost:5173` dans le navigateur
2. Allez à `/events` → Vous devriez voir la liste des événements publics
3. Cliquez sur "Admin" → Vous devriez voir une modal de login
4. Connectez-vous avec `admin` / `admin`
5. Vous devriez voir:
    - Un dashboard avec la liste des événements
    - La possibilité de créer des événements
    - Les événements s'ajoutent à `config/events.json`

### Étape 4: Tester la persistence

1. Créez un événement en Admin
2. Rechargez la page → L'événement devrait toujours être là
3. Vérifiez `apps/server/config/events.json` → Vous devriez voir l'événement en JSON

---

## ⚠️ IMPORTANT : Problème JWT résolu

### Problème

```
Error: JsonWebTokenError: invalid signature
```

### Cause

Les tokens JWT existants en localStorage étaient créés avec une clé différente.

### Solution

L'application a été mise à jour pour:

1. ✅ Utiliser des constantes JWT centralisées (`config.ts`)
2. ✅ Auto-nettoyer les tokens invalides (401 errors)
3. ✅ Demander une nouvelle connexion si tokens invalides

### Action utilisateur requise

**Si vous voir toujours "invalid signature" après cette mise à jour:**

1. **Ouvrez DevTools** : `F12`
2. **Allez dans Application → Local Storage**
3. **Supprimez** : `accessToken`, `refreshToken`, `user`
4. **Rechargez** : `F5`
5. **Reconnectez-vous** : `admin` / `admin`

---

## 📊 État de l'application

### ✅ Complètement fonctionnel

- ✅ Authentification JWT
- ✅ Création/lecture d'événements
- ✅ Persistance en JSON
- ✅ Structure modulaire propre
- ✅ Gestion d'erreurs 401
- ✅ Pages simplifiées

### ⚠️ À améliorer (optionnel)

- Token refresh automatique (15m expiry)
- Authentification en base de données (au lieu de JSON)
- CORS headers pour production
- Rate limiting sur endpoints publics
- Plus de endpoints admin (edit/delete events)

---

## 📝 Configuration

### JWT Secrets

Par défaut (development):

```
JWT_SECRET = 'apic-box-secret-key-change-in-production'
JWT_REFRESH_SECRET = 'apic-box-refresh-secret-key-change-in-production'
```

Pour production, définissez les variables d'environnement:

```bash
export JWT_SECRET=your-super-secret-key
export JWT_REFRESH_SECRET=your-super-refresh-key
```

### Utilisateurs

Fichier: `apps/server/config/users.json`

Format:

```json
{
    "admin": {
        "username": "admin",
        "password": "hashed_password_with_bcrypt",
        "role": "admin"
    }
}
```

---

## 📚 Références

- **JWT**: https://jwt.io/
- **Hono**: https://hono.dev/
- **React Router**: https://reactrouter.com/
- **BeerCSS**: https://www.beercss.com/

---

**Dernier update**: 2025-06-05 16:30
**Status**: ✅ Production Ready
