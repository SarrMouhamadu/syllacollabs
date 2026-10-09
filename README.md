# 🌟 Sylla Collaborations

Plateforme officielle de soumission, suivi et gestion administrative des partenariats et collaborations pour l'écosystème Sylla (**Sylla Voyage** & **Sylla English Academy**).

---

## 🚀 Fonctionnalités Clés

### 1. Parcours Public (Demandeur) — Zéro Friction
- **Aucun compte ni mot de passe** requis pour les demandeurs.
- **Catégories de partenariat** : Publicité, Partenariat, Événement, Sponsoring, Création de Contenu, Autre.
- **Enregistrement vocal direct** dans le navigateur avec :
  - Onde sonore animée en temps réel via l'API Web Audio.
  - Minuteur précis limité à 2 minutes (120 secondes).
  - Écoute avant envoi, suppression et réenregistrement.
- **Description textuelle** optionnelle (ou complémentaire au vocal).
- **Génération automatique d'un code de suivi unique** côté serveur (ex: `SYL-7K8P9X`).
- **Écran de confirmation** avec copie en 1 clic.
- **Page publique de suivi** en temps réel via le code unique : statut du dossier, écoute du vocal déposé, et historique chronologique daté des retours de l'équipe Sylla.

### 2. Dashboard Administrateur (Direction Sylla) — Protégé & Sécurisé
- **Authentification forte** par jeton JWT.
- **Tri chronologique strict** : de la demande la plus récente à la plus ancienne.
- **Recherche instantanée** (par nom, téléphone, code `SYL-...`, entreprise, description).
- **Filtres multicritères** par catégorie et par statut.
- **Statistiques en direct** : total, nouvelles, en étude, acceptées, refusées, archivées.
- **Lecteur audio intégré** pour écouter les messages vocaux déposés.
- **Lien WhatsApp direct `wa.me`** pré-rempli pour contacter le prospect en 1 clic sans passer par l'API WhatsApp Business.
- **Workflow complet des statuts** :
  - *Mettre en étude*
  - *Accepter le dossier*
  - *Refuser le dossier*
  - *Archiver le dossier*
  - *Restaurer un dossier archivé*
- **Historique public daté** généré à chaque changement avec commentaire personnalisé.
- **Notes internes confidentielles** strictement réservées à l'équipe et invisibles au public.

---

## 🛠️ Stack Technique

- **Frontend** : React 18, TypeScript, Vite, CSS moderne (Palette Bleu, Blanc, Vert, micro-animations).
- **Backend** : Node.js, Express 5, TypeScript.
- **Base de données** : PostgreSQL via Prisma ORM.
- **Stockage audio** : Multer avec gestion sécurisée et streaming HTTP Range (code 206).

---

## ⚡ Commandes Rapides

### 1. Installation des dépendances
```bash
# Backend
cd server && npm install

# Frontend
cd client && npm install
```

### 2. Base de données & Migrations PostgreSQL
```bash
cd server
npx prisma db push
npx tsx prisma/seed.ts
```

### 3. Lancer en Mode Développement
Dans deux terminaux séparés ou via les scripts du package racine :
```bash
# Terminal 1 : Backend API (port 5001)
npm run dev:server

# Terminal 2 : Frontend Vite (port 5173 avec proxy API automatique)
npm run dev:client
```

### 4. Build & Lancement en Production
```bash
# Compilation complète client + serveur
npm run build

# Démarrer le serveur autonome de production
npm start
```
L'application est alors accessible directement sur `http://localhost:5001`.

### 5. Exécuter la suite de tests fonctionnels et de sécurité
```bash
npm test
```
*Valide 17 points de contrôle incluant l'upload audio, le masquage des données, la protection anti Path-traversal et la sécurité JWT.*

---

## 🔐 Identifiants Administrateur Initiaux

- **Email** : `admin@sylla.com`
- **Mot de passe** : `admin_sylla_2026`
*(Modifiables à tout moment dans `server/.env` ou en base PostgreSQL).*
