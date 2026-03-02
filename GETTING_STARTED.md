# Guide de Démarrage Rapide

## Installation Rapide (Sans Docker)

### 1. Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
```

Éditez `.env` et ajoutez votre clé API Anthropic :
```
ANTHROPIC_API_KEY=sk-ant-...
```

Initialisez la base de données :
```bash
python database.py
```

Lancez le serveur :
```bash
python main.py
```

### 2. Frontend

Nouveau terminal :
```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

### 3. Accédez à l'application

Ouvrez votre navigateur sur : `http://localhost:3000`

## Installation avec Docker

```bash
# Créer le fichier .env à la racine
copy backend\.env.example .env

# Éditer .env et ajouter votre clé API Anthropic

# Lancer tous les services
docker-compose up -d

# Voir les logs
docker-compose logs -f
```

L'application sera disponible sur :
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000`
- Documentation API: `http://localhost:8000/docs`

## Première Utilisation

1. **Activez les notifications** (optionnel) pour les rappels quotidiens
2. **Enregistrez votre premier symptôme** via le bouton "Enregistrer des symptômes"
3. **Discutez avec l'IA** pour obtenir des explications
4. **Consultez l'historique** pour voir l'évolution

## Obtenir une Clé API Anthropic

1. Visitez [https://console.anthropic.com/](https://console.anthropic.com/)
2. Créez un compte
3. Ajoutez des crédits (minimum 5$)
4. Générez une clé API
5. Copiez-la dans votre fichier `.env`

## Résolution de Problèmes

### Le backend ne démarre pas
- Vérifiez que Python 3.10+ est installé : `python --version`
- Assurez-vous que le venv est activé
- Vérifiez la clé API dans `.env`

### Le frontend ne démarre pas
- Vérifiez que Node.js 18+ est installé : `node --version`
- Supprimez `node_modules` et réinstallez : `npm install`

### L'IA ne répond pas
- Vérifiez la clé API Anthropic
- Vérifiez que le backend est lancé
- Consultez les logs du backend

### Les notifications ne fonctionnent pas
- Autorisez les notifications dans votre navigateur
- Utilisez HTTPS ou localhost (requis pour les notifications)

## Commandes Utiles

```bash
# Backend
cd backend
python main.py                    # Lancer le serveur
python database.py                # Réinitialiser la DB

# Frontend
cd frontend
npm run dev                       # Mode développement
npm run build                     # Build production
npm run preview                   # Prévisualiser le build

# Docker
docker-compose up -d              # Démarrer tous les services
docker-compose down               # Arrêter tous les services
docker-compose logs -f backend    # Voir les logs backend
docker-compose logs -f frontend   # Voir les logs frontend
docker-compose restart            # Redémarrer tous les services
```

## Support

Pour toute question, ouvrez une issue sur GitHub ou consultez le README.md complet.
