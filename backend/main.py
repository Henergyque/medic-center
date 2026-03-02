from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import anthropic
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Symptom Checker API", version="1.0.0")

# Configuration CORS pour permettre les requêtes depuis le frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Client Anthropic Claude (optionnel)
api_key = os.getenv("ANTHROPIC_API_KEY")
client = anthropic.Anthropic(api_key=api_key) if api_key else None
DEMO_MODE = client is None


# Modèles Pydantic
class Symptom(BaseModel):
    description: str
    intensity: int  # 1-10
    body_part: str
    duration: str
    timestamp: Optional[datetime] = None


class SymptomHistory(BaseModel):
    symptoms: List[Symptom]
    user_context: Optional[str] = None


class ChatMessage(BaseModel):
    message: str
    history: Optional[List[dict]] = None
    symptom_context: Optional[SymptomHistory] = None


class AnalysisResponse(BaseModel):
    response: str
    severity_level: str  # "low", "medium", "high", "urgent"
    recommendations: List[str]
    sources: List[str]


# Routes
@app.get("/")
async def root():
    mode = "DÉMO (sans API)" if DEMO_MODE else "Production"
    return {
        "message": "API de Vérification des Symptômes Médicaux",
        "version": "1.0.0",
        "status": "active",
        "mode": mode
    }


@app.post("/api/analyze-symptoms", response_model=AnalysisResponse)
async def analyze_symptoms(symptom_history: SymptomHistory):
    """Analyse les symptômes avec Claude AI et retourne des recommandations"""
    try:
        # Préparer le contexte pour Claude
        symptoms_text = "\n".join([
            f"- {s.description} (Intensité: {s.intensity}/10, Zone: {s.body_part}, Durée: {s.duration})"
            for s in symptom_history.symptoms
        ])
        
        if DEMO_MODE:
            # Mode démo sans API
            response_text = f"""[MODE DÉMO - Réponse Générée]

Analyse de vos symptômes:
{symptoms_text}

Basée sur votre description, voici une analyse générale:

• Vos symptômes semblent nécessiter une surveillance attentive
• L'intensité globale est modérée à moyenne
• Il est recommandé de surveiller l'évolution sur les prochains jours
• Consultez un professionnel de santé si les symptômes s'aggravent ou persistent

RECOMMANDATIONS:
1. Notez tout changement dans l'intensité ou la nature des symptômes
2. Continuez à enregistrer vos symptômes quotidiennement
3. Hydratez-vous bien et reposez-vous
4. Consultez votre médecin pour un diagnostic professionnel

⚠️ IMPORTANT: Cette analyse est générée en mode démo. Pour une analyse complète par IA, veuillez configurer une clé API Anthropic.
Sources: Ameli.fr, Santé Publique France, Vidal, MedlinePlus, Mayo Clinic, NHS, OMS"""
            severity = "medium"
        else:
            # Prompt système pour Claude
            system_prompt = """Tu es un assistant médical français qui aide à analyser les symptômes.
            Tu dois:
            1. Analyser les symptômes décrits
            2. Évaluer le niveau de gravité (faible, moyen, élevé, urgent)
            3. Fournir des recommandations basées sur des sources médicales officielles
            4. TOUJOURS inclure un disclaimer rappelant de consulter un professionnel
            5. Détecter les urgences médicales et les signaler clairement
        if not DEMO_MODE:
            if any(word in response_text.lower() for word in ["urgent", "urgence", "immédiat", "15", "112", "samu"]):
                severity = "urgent"
            elif any(word in response_text.lower() for word in ["grave", "important", "rapidement", "médecin"]):
                severity = "high"
            elif any(word in response_text.lower() for word in ["surveiller", "bénin", "repos"]):
    
{f"Contexte additionnel: {symptom_history.user_context}" if symptom_history.user_context else ""}

Fournis une analyse complète en français avec niveau de gravité et recommandations."""
            
            # Appel à Claude API
            message = client.messages.create(
                model="claude-sonnet-4-6",
                max_tokens=2000,
                system=system_prompt,
                messages=[
                    {"role": "user", "content": user_prompt}
                ]
            )
            
            response_text = message.content[0].text
            severity = "medium"
        
        # Détection du niveau de gravité (simplifié - à améliorer avec analyse sémantique)
        severity = "medium"
        if any(word in response_text.lower() for word in ["urgent", "urgence", "immédiat", "15", "112", "samu"]):
            severity = "urgent"
        elif any(word in response_text.lower() for word in ["grave", "important", "rapidement", "médecin"]):
            severity = "high"
        elif any(word in response_text.lower() for word in ["surveiller", "bénin", "repos"]):
            severity = "low"
        
        # Extraction des recommandations (simplifié)
        recommendations = [
            "Consulter un professionnel de santé si les symptômes persistent",
            "Surveiller l'évolution des symptômes",
            "Noter tout changement dans l'intensité ou la nature des symptômes"
        ]
        
        sources = [
            "Ameli.fr", "Santé Publique France", "MedlinePlus", 
            "Mayo Clinic", "NHS", "OMS"
        ]
        
        return AnalysisResponse(
            response=response_text,
            severity_level=severity,
            recommendations=recommendations,
            sources=sources
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de l'analyse: {str(e)}")


@app.post("/api/chat")
async def chat_with_claude(chat_message: ChatMessage):
    """Chat conversationnel avec Claude pour expliquer les symptômes"""
    try:
        # Préparer l'historique de conversation
        messages = []
        if chat_message.history:
            messages = chat_message.history
        
        messages.append({"role": "user", "content": chat_message.message})
        
        if DEMO_MODE:
            # Mode démo
            assistant_message = f"""[MODE DÉMO] Réponse générée:

Je vais vous aider avec votre question: "{chat_message.message}"

En mode démo, je fournis une réponse générique. Pour des réponses intelligentes et personnalisées par IA, veuillez configurer une clé API Anthropic.

Quelques ressources utiles:
• Ameli.fr: https://www.ameli.fr
• Santé Publique France: https://www.santepubliquefrance.fr
• MedlinePlus: https://medlineplus.gov
• Mayo Clinic: https://www.mayoclinic.org

N'oubliez pas: consultez toujours un professionnel de santé pour un diagnostic professionnel."""
        else:
            # Contexte système adapté au contexte des symptômes
            system_context = """Tu es un assistant médical français bienveillant qui aide à comprendre les symptômes médicaux.
            
            Tes rôles:
            - Répondre aux questions sur les symptômes en français simple
            - Poser des questions de clarification pertinentes
            - Expliquer les conditions médicales de manière compréhensible
            - TOUJOURS rappeler qu'il ne s'agit pas d'un diagnostic médical
            - Référencer des sources médicales officielles françaises et internationales
            - Détecter les situations urgentes et recommander d'appeler le 15 ou 112
            
            Ton ton: Rassurant, professionnel, pédagogique"""
            
            # Ajouter le contexte des symptômes si disponible
            if chat_message.symptom_context:
                symptoms_summary = "\n".join([
                    f"- {s.description} ({s.body_part}, intensité {s.intensity}/10)"
                    for s in chat_message.symptom_context.symptoms
                ])
                system_context += f"\n\nSymptômes actuels de l'utilisateur:\n{symptoms_summary}"
            
            # Appel à Claude
            response = client.messages.create(
                model="claude-sonnet-4-6",
                max_tokens=1500,
                system=system_context,
                messages=messages
            )
            
            assistant_message = response.content[0].text
        
        return {
            "response": assistant_message,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors du chat: {str(e)}")


@app.post("/api/analyze-temporal-evolution")
async def analyze_temporal_evolution(symptom_history: SymptomHistory):
    """Analyse l'évolution temporelle des symptômes et adapte les recommandations"""
    try:
        if len(symptom_history.symptoms) < 2:
            return {
                "evolution": "insufficient_data",
                "message": "Pas assez de données pour analyser l'évolution. Continuez à enregistrer vos symptômes quotidiennement."
            }
        
        # Trier les symptômes par date
        sorted_symptoms = sorted(symptom_history.symptoms, key=lambda x: x.timestamp or datetime.now())
        
        if DEMO_MODE:
            # Mode démo
            trend = "stable"
            if len(sorted_symptoms) >= 2:
                recent_intensity = sorted_symptoms[-1].intensity if sorted_symptoms[-1].intensity else 5
                older_intensity = sorted_symptoms[0].intensity if sorted_symptoms[0].intensity else 5
                if recent_intensity > older_intensity:
                    trend = "worsening"
                elif recent_intensity < older_intensity:
                    trend = "improving"
            
            analysis = f"""[MODE DÉMO] Analyse de l'évolution:

Nombre d'entrées: {len(sorted_symptoms)}
Tendance observée: {"Aggravation" if trend == "worsening" else "Amélioration" if trend == "improving" else "Stable"}

En mode démo, cette analyse est basique. Avec une clé API Anthropic, vous obtiendrez une analyse complète et intelligente de l'évolution temporelle de vos symptômes."""
        else:
            # Préparer l'analyse temporelle pour Claude
            timeline = "\n".join([
                f"Jour {i+1} ({s.timestamp.strftime('%d/%m/%Y') if s.timestamp else 'Non daté'}): "
                f"{s.description} - Intensité: {s.intensity}/10"
                for i, s in enumerate(sorted_symptoms)
            ])
            
            system_prompt = """Tu es un expert médical analysant l'évolution temporelle des symptômes.
            
            Analyse:
            1. L'évolution (amélioration, aggravation, stagnation)
            2. Les patterns (cyclique, progressif, fluctuant)
            3. Les signaux d'alerte (aggravation rapide, nouveaux symptômes graves)
            4. Adapte tes recommandations selon l'évolution observée
            
            Si aggravation: recommande consultation urgente
            Si amélioration: encourage poursuite traitement/repos
            Si stagnation prolongée: suggère consultation pour diagnostic"""
            
            user_prompt = f"""Analyse cette évolution temporelle des symptômes:

{timeline}

Détermine la tendance et adapte les recommandations en conséquence."""
            
            message = client.messages.create(
                model="claude-sonnet-4-6",
                max_tokens=1500,
                system=system_prompt,
                messages=[{"role": "user", "content": user_prompt}]
            )
            
            analysis = message.content[0].text
            trend = "stable"
        
        return {
            "evolution": trend,
            "analysis": analysis,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de l'analyse temporelle: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
