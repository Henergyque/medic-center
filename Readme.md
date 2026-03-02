# Application de Vérification des Symptômes Médicaux

Application web mobile-first permettant de suivre vos symptômes médicaux, discuter avec une IA (Claude) pour obtenir des explications et des recommandations basées sur des sources médicales officielles françaises et internationales.

## 🏥 Fonctionnalités

- **Suivi des symptômes** : Enregistrez vos symptômes avec intensité, localisation et durée
- **Chat IA intelligent** : Discutez avec Claude AI pour comprendre vos symptômes
- **Analyse temporelle** : Suivez l'évolution de vos symptômes dans le temps
- **Notifications quotidiennes** : Rappels automatiques pour mettre à jour vos symptômes
- **Export PDF médical** : Générez un rapport professionnel pour votre médecin
- **Sources officielles** : Informations basées sur Ameli.fr, Santé Publique France, Vidal, Mayo Clinic, NHS, CDC, OMS
- **Stockage local** : Vos données restent privées sur votre appareil (localStorage)
- **Sans authentification** : Utilisation anonyme et simple

## 🚀 Installation

### Prérequis

- Python 3.10+
- Node.js 18+
- PostgreSQL (optionnel, SQLite par défaut)
- Redis (optionnel, pour le cache)

### Backend (FastAPI)

```bash
cd backend

# Créer un environnement virtuel
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac

# Installer les dépendances
pip install -r requirements.txt

# Configurer les variables d'environnement
copy .env.example .env
# Éditer .env et ajouter votre clé API Anthropic

# Initialiser la base de données
python database.py

# Lancer le serveur
python main.py
```

Le backend sera accessible sur `http://localhost:8000`

### Frontend (React + Vite)

```bash
cd frontend

# Installer les dépendances
npm install

# Configurer les variables d'environnement
copy .env.example .env

# Lancer le serveur de développement
npm run dev
```

Le frontend sera accessible sur `http://localhost:3000`

## 🔑 Configuration

### Clé API Anthropic

1. Obtenez une clé API sur [https://console.anthropic.com/](https://console.anthropic.com/)
2. Ajoutez-la dans `backend/.env` :
   ```
   ANTHROPIC_API_KEY=your_key_here
   ```

### Notifications Web

Les notifications quotidiennes nécessitent l'autorisation de votre navigateur. Vous serez invité à l'activer lors de la première utilisation.

## 📱 Utilisation

1. **Page d'accueil** : Vue d'ensemble avec statistiques et accès aux fonctionnalités
2. **Enregistrer un symptôme** : Formulaire détaillé avec analyse IA immédiate
3. **Chat IA** : Conversation avec Claude pour poser des questions
4. **Historique** : Visualisation de tous vos symptômes avec option d'export PDF

### Rappels quotidiens

- Activez les notifications pour recevoir un rappel quotidien
- Par défaut à 9h00 (modifiable dans le code)
- Vous pouvez mettre à jour vos symptômes quotidiennement

### Export PDF

- Générez un rapport médical professionnel
- Contient uniquement les faits (dates, symptômes, évolution)
- Format adapté pour présentation à un médecin

## 🏗️ Architecture

### Backend
- **Framework** : FastAPI
- **IA** : Anthropic Claude 3.5 Sonnet
- **Base de données** : SQLAlchemy (SQLite/PostgreSQL)
- **Cache** : Redis (optionnel)
- **PDF** : ReportLab

### Frontend
- **Framework** : React 18
- **Build** : Vite
- **UI** : Material-UI (MUI)
- **Animations** : Framer Motion
- **Stockage** : localForage
- **HTTP** : Axios

### Structure du projet

```
.
├── backend/
│   ├── main.py              # API FastAPI principale
│   ├── database.py          # Configuration de la base de données
│   ├── pdf_generator.py     # Générateur de PDF médical
│   ├── requirements.txt     # Dépendances Python
│   └── .env.example         # Variables d'environnement
│
├── frontend/
│   ├── src/
│   │   ├── components/      # Composants réutilisables
│   │   ├── pages/           # Pages principales
│   │   ├── services/        # Services (API, storage)
│   │   ├── context/         # Contexte React
│   │   ├── App.jsx          # Composant principal
│   │   └── main.jsx         # Point d'entrée
│   ├── package.json
│   └── vite.config.js
│
└── README.md
```

## ⚠️ Avertissements Importants

- ❗ **Cette application ne remplace PAS un avis médical professionnel**
- ❗ **En cas d'urgence, appelez le 15 (SAMU) ou le 112**
- ❗ **Les recommandations sont à titre informatif uniquement**
- ❗ **Consultez toujours un professionnel de santé pour un diagnostic**

## 🔐 Sécurité et Confidentialité

- Aucune donnée n'est envoyée à des serveurs tiers (sauf API Claude)
- Stockage local uniquement (localStorage)
- Pas d'authentification ni de compte utilisateur
- Les données restent sur votre appareil

## 🚧 Développement

### Lancer en mode développement

Terminal 1 (Backend) :
```bash
cd backend
venv\Scripts\activate
python main.py
```

Terminal 2 (Frontend) :
```bash
cd frontend
npm run dev
```

### Build pour production

```bash
cd frontend
npm run build
```

Les fichiers seront dans `frontend/dist/`

## 📝 TODO / Améliorations futures

- [ ] Dockerisation complète
- [ ] Tests unitaires et d'intégration
- [ ] PWA (Progressive Web App)
- [ ] Mode hors ligne complet
- [ ] Graphiques d'évolution visuels
- [ ] Support multilingue
- [ ] Intégration de plus de sources médicales
- [ ] Export en JSON pour import/export de données

## 📄 Licence

Ce projet est à usage personnel et éducatif. Non destiné à un usage médical professionnel.

## 🤝 Contribution

Ce projet est un prototype. Pour toute amélioration :
1. Forkez le projet
2. Créez une branche (`git checkout -b feature/AmazingFeature`)
3. Committez vos changements (`git commit -m 'Add AmazingFeature'`)
4. Pushez vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request

## 📧 Contact

Pour toute question ou suggestion, ouvrez une issue sur GitHub.

---

**⚕️ Rappel : Cette application est un outil d'aide et ne remplace en aucun cas un avis médical professionnel.**
