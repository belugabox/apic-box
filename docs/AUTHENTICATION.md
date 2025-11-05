# Guide d'authentification - APIC Box

## Problème : "JsonWebTokenError: invalid signature"

### Cause

Les tokens JWT générés avant la mise à jour du code avec `config.ts` utilisaient une clé secrète différente de celle utilisée maintenant pour les vérifier. Ces vieux tokens sont invalides.

### Solution

#### Option 1: Nettoyer le navigateur automatiquement (recommandé)

L'application a été mise à jour pour gérer automatiquement les tokens invalides :

1. Ouvrez l'app
2. Si vous voyez une erreur 401, cliquez sur "login" à nouveau
3. L'application nettoiera les vieux tokens et vous demandera de vous reconnecter

#### Option 2: Nettoyer manuellement localStorage

Si vous continuez à avoir des problèmes :

1. **Ouvrez les DevTools** : `F12` ou `Ctrl+Shift+I` ou `Cmd+Option+I`
2. Allez dans l'onglet **"Application"** (ou "Storage" sur Firefox)
3. Sur la gauche, cliquez sur **"Local Storage"**
4. Sélectionnez l'entrée **localhost:3001** (ou votre domaine)
5. **Supprimez tout** (ou cherchez `accessToken`, `refreshToken`, `user` et supprimez-les)
6. **Rechargez la page** (`F5` ou `Ctrl+R`)
7. Connectez-vous à nouveau avec `admin` / `admin`

### Détails techniques

#### Ce qui s'est passé

```
AVANT (problème):
- Token créé le: Mon login_request → secret1 → token_A
- Token vérifié le: Mon API_call → secret2 → signature invalide ❌

APRÈS (solution):
- Token créé le: Mon login_request → JWT_SECRET constant (config.ts) → token_B
- Token vérifié le: Mon API_call → JWT_SECRET constant (config.ts) → ✅
```

#### Fichiers modifiés

- **`apps/server/src/config.ts`** : Centralized JWT secret constants
- **`apps/server/src/auth/auth.ts`** : Uses config.ts constants for all token operations
- **`apps/client/src/services/auth/auth.ts`** : Added `clearTokens()` function
- **`apps/client/src/services/event/event.ts`** : Better error handling for 401 responses
- **`apps/client/src/pages/Admin.tsx`** : Auto-clear tokens on 401 error
- **`apps/client/src/main.tsx`** : App startup logging

#### Variables d'environnement (optionnel)

Vous pouvez définir des secrets personnalisés via des variables d'environnement :

```bash
# Côté serveur (.env ou variables d'environnement)
JWT_SECRET=your-custom-secret-key
JWT_REFRESH_SECRET=your-custom-refresh-secret-key
```

Si ces variables ne sont pas définies, les secrets par défaut seront utilisés :

- `JWT_SECRET`: `apic-box-secret-key-change-in-production`
- `JWT_REFRESH_SECRET`: `apic-box-refresh-secret-key-change-in-production`

### Vérification que tout fonctionne

1. **Ouvrez les DevTools Console** (`F12` → Console)
2. **Connectez-vous** avec `admin` / `admin`
3. **Vérifiez les logs** :
    - Vous devriez voir `[Auth] Attempting login for: admin`
    - Puis `[Auth] Login successful, storing tokens`
    - Puis les tokens devraient être dans localStorage

4. **Naviguez vers Admin** → Vous devriez voir la liste des événements

### Si ça ne marche toujours pas

1. **Vérifiez que le serveur tourne** :
    - Allez à `http://localhost:3001/api/health` dans votre navigateur
    - Vous devriez voir une réponse JSON

2. **Vérifiez les logs du serveur** :
    - Le serveur devrait afficher la clé secrète JWT au démarrage
    - Et lors d'une vérification de token, vous devriez voir le hash SHA256 du secret

3. **Redémarrez le serveur et le client** :
    - Tuer le serveur (`Ctrl+C`)
    - Vider le cache du navigateur (`Ctrl+Shift+Delete`)
    - Relancer le serveur
    - Recharger la page

4. **Ouvrez une issue** si le problème persiste

---

## Architecture d'authentification

### Flux de connexion

```
1. User clique "Login"
2. Client envoie: POST /api/auth/login { username, password }
3. Server:
   - Valide les credentials contre users.json
   - Hashe le password avec bcrypt
   - Génère access_token (15m) et refresh_token (7d) avec JWT_SECRET
   - Retourne les tokens
4. Client stocke les tokens dans localStorage
5. Client envoie token dans header: Authorization: Bearer <token>
6. Server vérifie le token avec JWT_SECRET
7. Si valide → accès accordé ✅
   Si invalide → 401 Unauthorized ❌
```

### Stockage des secrets

- **Server**: `apps/server/src/config.ts` (constantes exportées)
- **Utilisé par**: `apps/server/src/auth/auth.ts` (signage + verification)
- **Never dans le code client** (jamais en localStorage, cookies, ou accessible en front)

### Tokens

- **Access Token**: Courte durée (15 minutes), utilisée pour chaque requête API
- **Refresh Token**: Longue durée (7 jours), utilisée pour obtenir un nouveau access token
- **Format**: JWT (JSON Web Token) standard

### Utilisateurs par défaut

- **username**: `admin`
- **password**: `admin` (hashé en bcrypt dans config/users.json)

---

## FAQ

**Q: Je vois "Login failed" - que faire?**
A: Vérifiez que le serveur tourne (`npm start` depuis le dossier server). Les credentials par défaut sont `admin`/`admin`.

**Q: Mon token expire après 15 minutes?**
A: C'est normal - un nouveau token devrait être généré automatiquement avec le refresh token (s'il est implémenté).

**Q: Comment changer la durée du token?**
A: Modifiez `apps/server/src/auth/auth.ts`, dans la fonction `generateTokens()`, changez `expiresIn: '15m'`.

**Q: Je veux ajouter un nouvel utilisateur?**
A: Modifiez `apps/server/config/users.json` en hasher le password avec bcrypt.
