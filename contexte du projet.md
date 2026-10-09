## CORRECTIONS ET EXIGENCES DÉFINITIVES — SYLLA COLLABORATIONS

Ces instructions remplacent toute exigence contradictoire dans le cahier des charges précédent.

### 1. Stack technique obligatoire

**Frontend**

- React
- TypeScript
- Vite

**Backend**

- Node.js
- Express.js
- TypeScript
- PostgreSQL
- Prisma ORM

Respecte cette architecture. N'introduis pas un autre backend, une autre base de données ou un service externe inutile.

### 2. Aucune intégration WhatsApp Business

Ne pas utiliser :

- WhatsApp Business API.
- Une API d'envoi automatique de messages WhatsApp.
- Un service payant d'envoi de notifications.
- Un système d'OTP par SMS, email ou WhatsApp.

Après la soumission, le code de suivi est généré par le backend et affiché directement sur l'écran de confirmation.

L'utilisateur peut copier ce code et le conserver. Il pourra ensuite accéder à la page de suivi pour consulter son dossier.

Dans le dashboard administrateur, tu peux proposer un lien WhatsApp standard `wa.me` pour permettre à l'équipe d'ouvrir manuellement une conversation. Ce lien n'est pas une intégration WhatsApp Business et ne doit jamais simuler l'envoi automatique d'un message.

### 3. Parcours public définitif

Le parcours doit rester extrêmement simple :

1. L'utilisateur choisit une catégorie : publicité, partenariat, événement, sponsoring, création de contenu ou autre.
2. Il explique son projet par message vocal, texte ou les deux.
3. Il saisit son nom et son numéro de téléphone/WhatsApp, avec l'entreprise en option.
4. Il envoie sa demande.
5. Le serveur enregistre la demande et génère un code de suivi unique.
6. L'utilisateur voit son code, peut le copier et accède au suivi de son dossier.

Aucun compte utilisateur, aucun mot de passe et aucune inscription ne sont nécessaires.

### 4. Dashboard administrateur

Le dashboard doit permettre de consulter toutes les demandes, triées par date de réception, de la plus récente à la plus ancienne.

Il doit permettre de filtrer les dossiers par type et par statut, de lire les messages, d'écouter les vocaux et d'effectuer ces actions :

- Nouvelle demande.
- Mettre en étude.
- Accepter.
- Refuser.
- Archiver.
- Restaurer un dossier archivé.

Chaque changement doit être enregistré en base et visible dans le suivi public, avec son historique daté. Les notes internes restent confidentielles.

### 5. Sites de référence

Utilise ces deux sites comme références de marque et de cohérence visuelle :

- Sylla Voyage : https://syllavoyage.com
- Sylla English Academy : https://www.syllaenglishacademy.com

Conserve une identité professionnelle cohérente avec l'écosystème Sylla, tout en créant une interface de collaboration indépendante, ultra simple et rapide.

Palette obligatoire : bleu, blanc et vert. Ajoute des micro-animations élégantes, une onde sonore durant l'enregistrement et des transitions fluides, en préservant les performances mobiles.

### 6. Consigne d'exécution

Inspecte le workspace actuel et poursuis directement le développement complet. Si du code existe déjà, conserve ce qui fonctionne et applique les modifications nécessaires.

Tous les parcours doivent être reliés à PostgreSQL via Prisma. Aucun bouton fictif ni donnée simulée ne doit subsister dans la version finale.

Exécute les migrations, les tests fonctionnels, les tests de sécurité et le build de production. Corrige les erreurs et documente les commandes de lancement et de déploiement.

Ne déclare pas le projet terminé tant que la création, le suivi par code et le traitement administratif des demandes ne fonctionnent pas réellement de bout en bout.
