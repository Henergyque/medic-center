from datetime import datetime
from pathlib import Path
from typing import List, Optional
import os

import anthropic
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from pdf_generator import router as pdf_router

load_dotenv()

app = FastAPI(title="Symptom Checker API", version="1.0.0")


def _build_allowed_origins() -> List[str]:
    raw = os.getenv("CORS_ORIGINS", "")
    if raw.strip():
        return [origin.strip() for origin in raw.split(",") if origin.strip()]
    return ["http://localhost:3000", "http://localhost:5173"]


app.add_middleware(
    CORSMiddleware,
    allow_origins=_build_allowed_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_NAME = os.getenv("ANTHROPIC_MODEL", "claude-sonnet-4-6")
api_key = os.getenv("ANTHROPIC_API_KEY")
client = anthropic.Anthropic(api_key=api_key) if api_key else None
DEMO_MODE = client is None

BASE_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BASE_DIR.parent
FRONTEND_DIST = Path(os.getenv("FRONTEND_DIST", PROJECT_ROOT / "frontend" / "dist"))


class Symptom(BaseModel):
    description: str
    intensity: int
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
    severity_level: str
    recommendations: List[str]
    sources: List[str]


def _severity_from_text(text: str) -> str:
    lowered = text.lower()
    if any(word in lowered for word in ["urgent", "urgence", "immédiat", "15", "112", "samu"]):
        return "urgent"
    if any(word in lowered for word in ["grave", "important", "rapidement", "médecin"]):
        return "high"
    if any(word in lowered for word in ["surveiller", "bénin", "repos"]):
        return "low"
    return "medium"


@app.get("/api/health")
async def health():
    mode = "DEMO" if DEMO_MODE else "PRODUCTION"
    return {
        "message": "API de Vérification des Symptômes Médicaux",
        "version": "1.0.0",
        "status": "active",
        "mode": mode,
        "model": MODEL_NAME if not DEMO_MODE else None,
    }


@app.post("/api/analyze-symptoms", response_model=AnalysisResponse)
async def analyze_symptoms(symptom_history: SymptomHistory):
    try:
        symptoms_text = "\n".join(
            [
                f"- {s.description} (Intensité: {s.intensity}/10, Zone: {s.body_part}, Durée: {s.duration})"
                for s in symptom_history.symptoms
            ]
        )

        if DEMO_MODE:
            response_text = f"""[MODE DÉMO - Réponse Générée]

Analyse de vos symptômes:
{symptoms_text}

Basée sur votre description, voici une analyse générale:
- Surveillez l'évolution sur les prochains jours
- Consultez un professionnel si les symptômes persistent ou s'aggravent
- En cas de signe d'urgence, appelez le 15 ou le 112

⚠️ IMPORTANT: Analyse générée en mode démo sans API Anthropic."""
        else:
            system_prompt = """Tu es un assistant médical français.
Analyse les symptômes, estime la gravité (low/medium/high/urgent), donne des recommandations prudentes et rappelle qu'il ne s'agit pas d'un diagnostic."""
            user_prompt = f"""Analyse ces symptômes:

{symptoms_text}

{f"Contexte additionnel: {symptom_history.user_context}" if symptom_history.user_context else ""}"""

            message = client.messages.create(
                model=MODEL_NAME,
                max_tokens=1500,
                system=system_prompt,
                messages=[{"role": "user", "content": user_prompt}],
            )
            response_text = message.content[0].text

        severity = _severity_from_text(response_text)

        return AnalysisResponse(
            response=response_text,
            severity_level=severity,
            recommendations=[
                "Consulter un professionnel de santé si les symptômes persistent",
                "Surveiller l'évolution des symptômes",
                "Noter tout changement dans l'intensité ou la nature des symptômes",
            ],
            sources=["Ameli.fr", "Santé Publique France", "MedlinePlus", "Mayo Clinic", "NHS", "OMS"],
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de l'analyse: {str(e)}")


@app.post("/api/chat")
async def chat_with_claude(chat_message: ChatMessage):
    try:
        messages = chat_message.history[:] if chat_message.history else []
        messages.append({"role": "user", "content": chat_message.message})

        if DEMO_MODE:
            assistant_message = (
                "[MODE DÉMO] Je peux vous aider à comprendre vos symptômes, "
                "mais cette réponse est générique sans clé Anthropic. "
                "Pour une analyse IA complète, configurez ANTHROPIC_API_KEY."
            )
        else:
            system_context = """Tu es un assistant médical français bienveillant.
Réponds simplement, rappelle qu'il ne s'agit pas d'un diagnostic, et recommande le 15/112 en cas d'urgence."""

            if chat_message.symptom_context and chat_message.symptom_context.symptoms:
                symptoms_summary = "\n".join(
                    [
                        f"- {s.description} ({s.body_part}, intensité {s.intensity}/10)"
                        for s in chat_message.symptom_context.symptoms
                    ]
                )
                system_context += f"\n\nSymptômes actuels:\n{symptoms_summary}"

            response = client.messages.create(
                model=MODEL_NAME,
                max_tokens=1200,
                system=system_context,
                messages=messages,
            )
            assistant_message = response.content[0].text

        return {"response": assistant_message, "timestamp": datetime.now().isoformat()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors du chat: {str(e)}")


@app.post("/api/analyze-temporal-evolution")
async def analyze_temporal_evolution(symptom_history: SymptomHistory):
    try:
        if len(symptom_history.symptoms) < 2:
            return {
                "evolution": "insufficient_data",
                "message": "Pas assez de données pour analyser l'évolution.",
            }

        sorted_symptoms = sorted(symptom_history.symptoms, key=lambda x: x.timestamp or datetime.now())

        if DEMO_MODE:
            first_intensity = sorted_symptoms[0].intensity
            last_intensity = sorted_symptoms[-1].intensity
            if last_intensity > first_intensity:
                trend = "worsening"
            elif last_intensity < first_intensity:
                trend = "improving"
            else:
                trend = "stable"

            analysis = (
                f"[MODE DÉMO] Évolution observée: {trend}. "
                "Ajoutez plus d'entrées pour une analyse plus fiable."
            )
        else:
            timeline = "\n".join(
                [
                    f"Jour {i+1}: {s.description} - Intensité {s.intensity}/10"
                    for i, s in enumerate(sorted_symptoms)
                ]
            )
            response = client.messages.create(
                model=MODEL_NAME,
                max_tokens=1200,
                system="""Analyse l'évolution des symptômes (amélioration/aggravation/stagnation) et reste prudent.""",
                messages=[{"role": "user", "content": timeline}],
            )
            analysis = response.content[0].text
            if "aggrav" in analysis.lower() or "wors" in analysis.lower():
                trend = "worsening"
            elif "amélior" in analysis.lower() or "improv" in analysis.lower():
                trend = "improving"
            else:
                trend = "stable"

        return {"evolution": trend, "analysis": analysis, "timestamp": datetime.now().isoformat()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de l'analyse temporelle: {str(e)}")


app.include_router(pdf_router)


if FRONTEND_DIST.exists():
    assets_dir = FRONTEND_DIST / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")


@app.get("/")
async def serve_index():
    index_file = FRONTEND_DIST / "index.html"
    if index_file.exists():
        return FileResponse(index_file)
    return JSONResponse({"message": "Frontend non buildé. Lancez npm run build dans /frontend."})


@app.get("/{full_path:path}")
async def serve_spa(full_path: str):
    if full_path.startswith("api"):
        raise HTTPException(status_code=404, detail="Not Found")

    requested_file = FRONTEND_DIST / full_path
    if requested_file.exists() and requested_file.is_file():
        return FileResponse(requested_file)

    index_file = FRONTEND_DIST / "index.html"
    if index_file.exists():
        return FileResponse(index_file)
    raise HTTPException(status_code=404, detail="Not Found")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", "8000")))
