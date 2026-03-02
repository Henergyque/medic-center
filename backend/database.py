from datetime import datetime
import os
import json

# Utiliser un fichier JSON simple comme base de données locale
DB_FILE = "symptom_data.json"

class Database:
    def __init__(self):
        self.data = self._load_data()
    
    def _load_data(self):
        if os.path.exists(DB_FILE):
            with open(DB_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        return {
            "sources": self._get_default_sources(),
            "emergency_indicators": self._get_emergency_indicators()
        }
    
    def _save_data(self):
        with open(DB_FILE, 'w', encoding='utf-8') as f:
            json.dump(self.data, f, indent=2, ensure_ascii=False)
    
    def _get_default_sources(self):
        return [
            {"name": "Ameli.fr", "url": "https://www.ameli.fr", "language": "fr", "reliability": 9.5},
            {"name": "Santé Publique France", "url": "https://www.santepubliquefrance.fr", "language": "fr", "reliability": 9.5},
            {"name": "Vidal", "url": "https://www.vidal.fr", "language": "fr", "reliability": 9.0},
            {"name": "MedlinePlus", "url": "https://medlineplus.gov", "language": "en", "reliability": 9.0},
            {"name": "Mayo Clinic", "url": "https://www.mayoclinic.org", "language": "en", "reliability": 9.5},
            {"name": "NHS", "url": "https://www.nhs.uk", "language": "en", "reliability": 9.5},
            {"name": "CDC", "url": "https://www.cdc.gov", "language": "en", "reliability": 9.0},
            {"name": "OMS/WHO", "url": "https://www.who.int", "language": "multi", "reliability": 10.0},
        ]
    
    def _get_emergency_indicators(self):
        return [
            {
                "pattern": "douleur thoracique intense",
                "urgency": "immediate",
                "action": "Appeler le 15 (SAMU) immédiatement"
            },
            {
                "pattern": "difficulté respiratoire sévère",
                "urgency": "immediate",
                "action": "Appeler le 15 (SAMU) immédiatement"
            },
            {
                "pattern": "perte de conscience",
                "urgency": "immediate",
                "action": "Appeler le 15 (SAMU) immédiatement"
            },
            {
                "pattern": "paralysie faciale soudaine",
                "urgency": "immediate",
                "action": "Appeler le 15 - Suspicion d'AVC"
            },
            {
                "pattern": "hémorragie importante",
                "urgency": "immediate",
                "action": "Appeler le 15 (SAMU) immédiatement"
            },
        ]

def init_db():
    """Initialise la base de données"""
    db = Database()
    db._save_data()
    print("✅ Base de données initialisée avec succès")

if __name__ == "__main__":
    print("Initialisation de la base de données...")
    init_db()
