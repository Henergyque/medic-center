from datetime import datetime
from pathlib import Path
from typing import List, Optional
import os
import json
import uuid

import anthropic
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from PyPDF2 import PdfReader
import io
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

from pdf_generator import router as pdf_router

load_dotenv()

app = FastAPI(title="Symptom Checker API", version="1.0.0")


@app.on_event("startup")
async def startup_event():
    logger.info(f"Server starting - DEMO_MODE={DEMO_MODE}, FRONTEND_DIST={FRONTEND_DIST}, exists={FRONTEND_DIST.exists()}")
    logger.info(f"UPLOADS_DIR={UPLOADS_DIR}, exists={UPLOADS_DIR.exists()}")


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
    medical_profile: Optional[dict] = None


class ChatMessage(BaseModel):
    message: str
    history: Optional[List[dict]] = None
    symptom_context: Optional[SymptomHistory] = None
    medical_profile: Optional[dict] = None


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


def _profile_to_text(profile: Optional[dict]) -> str:
    if not profile or not isinstance(profile, dict):
        return ""

    key_labels = {
        "birth_date": "Date de naissance",
        "sex": "Sexe",
        "height_cm": "Taille (cm)",
        "weight_kg": "Poids (kg)",
        "blood_type": "Groupe sanguin",
        "allergies": "Allergies",
        "chronic_conditions": "Maladies chroniques",
        "current_medications": "Traitements en cours",
        "past_surgeries": "Antécédents chirurgicaux",
        "doctor_name": "Médecin traitant",
        "notes": "Notes médicales",
    }

    lines = []
    for key, label in key_labels.items():
        value = profile.get(key)
        if value is not None and str(value).strip() != "":
            lines.append(f"- {label}: {value}")

    return "\n".join(lines)


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
        profile_text = _profile_to_text(symptom_history.medical_profile)

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
Analyse les symptômes, estime la gravité (low/medium/high/urgent), donne des recommandations prudentes et rappelle qu'il ne s'agit pas d'un diagnostic.

Règles de sécurité impératives:
- Le profil médical utilisateur est prioritaire.
- Si allergies connues: NE JAMAIS recommander ces molécules.
- Si maladie chronique ou traitement en cours: éviter suggestions incompatibles et mentionner la prudence.
- Si information insuffisante, poser des questions avant de proposer un médicament."""
            _nl = '\n'
            user_prompt = f"""Analyse ces symptômes:

{symptoms_text}

{('Contexte additionnel: ' + symptom_history.user_context) if symptom_history.user_context else ''}

{('Profil médical utile:' + _nl + profile_text) if profile_text else ''}"""

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
                "[MODE DÉMO]\n"
                "Synthèse concrète non disponible sans API Anthropic.\n"
                "Actions utiles maintenant:\n"
                "1. Décrivez vos symptômes précisément (où, depuis quand, intensité /10).\n"
                "2. Surveillez l'évolution toutes les 6-12h.\n"
                "3. Consultez rapidement si aggravation.\n"
                "Urgence: douleur thoracique, détresse respiratoire, confusion, faiblesse d'un côté -> 15/112."
            )
        else:
            system_context = """Tu es un assistant médical français orienté utilité maximale.

Objectif:
- Réponses concrètes, précises, actionnables, sans blabla.
- Pas de phrases vagues ni de texte de remplissage.

Contraintes de style:
- Réponds en français.
- Fais des phrases courtes.
- Va droit au but.
- Maximum 180 mots sauf demande explicite de détail.

Format obligatoire de sortie:
1) Ce que ça évoque (max 3 hypothèses, classées du plus probable au moins probable)
2) Pourquoi (indices cliniques concrets en lien avec les symptômes)
3) Ce que je dois faire maintenant (3 à 5 actions claires)
4) Signaux d'alerte (quand consulter vite / appeler 15-112)
5) Questions ciblées (max 3) si info insuffisante

Sécurité:
- Ne jamais poser de diagnostic certain.
- Si symptômes potentiellement graves, le dire clairement et prioriser l'orientation urgente.
- Mentionner une seule ligne de disclaimer en fin de réponse, pas plus."""

            system_context += """

Règles médicales impératives liées au profil patient:
- Les données de la fiche médicale sont des contraintes strictes.
- Si allergie à un médicament/substance: ne jamais le conseiller.
- Si traitement en cours ou maladie chronique: vérifier la compatibilité et le signaler explicitement.
- En cas de doute sur compatibilité médicamenteuse: recommander validation pharmacien/médecin."""

            if chat_message.symptom_context and chat_message.symptom_context.symptoms:
                symptoms_summary = "\n".join(
                    [
                        f"- {s.description} ({s.body_part}, intensité {s.intensity}/10)"
                        for s in chat_message.symptom_context.symptoms
                    ]
                )
                system_context += f"\n\nSymptômes actuels:\n{symptoms_summary}"

            profile_text = _profile_to_text(
                chat_message.medical_profile
                or (chat_message.symptom_context.medical_profile if chat_message.symptom_context else None)
            )
            if profile_text:
                system_context += f"\n\nProfil médical du patient (à prendre en compte):\n{profile_text}"

            response = client.messages.create(
                model=MODEL_NAME,
                max_tokens=900,
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
        profile_text = _profile_to_text(symptom_history.medical_profile)

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
                messages=[{
                    "role": "user",
                    "content": timeline + (('\n\nProfil médical utile:\n' + profile_text) if profile_text else ''),
                }],
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


# === Gestion des documents PDF ===

UPLOADS_DIR = BASE_DIR / "uploads"
UPLOADS_DIR.mkdir(exist_ok=True)
DOCUMENTS_INDEX = UPLOADS_DIR / "index.json"


def _load_documents_index():
    if DOCUMENTS_INDEX.exists():
        return json.loads(DOCUMENTS_INDEX.read_text(encoding="utf-8"))
    return []


def _save_documents_index(docs):
    DOCUMENTS_INDEX.write_text(json.dumps(docs, ensure_ascii=False, indent=2), encoding="utf-8")


def _extract_pdf_text(file_bytes: bytes) -> str:
    reader = PdfReader(io.BytesIO(file_bytes))
    text_parts = []
    for page in reader.pages:
        page_text = page.extract_text()
        if page_text:
            text_parts.append(page_text)
    return "\n".join(text_parts)


@app.post("/api/documents/upload")
async def upload_document(file: UploadFile = File(...)):
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Seuls les fichiers PDF sont acceptés.")

    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Le fichier ne doit pas dépasser 10 Mo.")

    doc_id = str(uuid.uuid4())
    safe_filename = f"{doc_id}.pdf"
    file_path = UPLOADS_DIR / safe_filename

    file_path.write_bytes(contents)

    try:
        extracted_text = _extract_pdf_text(contents)
    except Exception:
        extracted_text = ""

    doc_entry = {
        "id": doc_id,
        "original_name": file.filename,
        "stored_name": safe_filename,
        "uploaded_at": datetime.now().isoformat(),
        "size_bytes": len(contents),
        "page_count": len(PdfReader(io.BytesIO(contents)).pages),
        "has_text": bool(extracted_text.strip()),
    }

    docs = _load_documents_index()
    docs.append(doc_entry)
    _save_documents_index(docs)

    return {
        "success": True,
        "document": doc_entry,
        "preview": extracted_text[:500] if extracted_text else None,
    }


@app.get("/api/documents")
async def list_documents():
    docs = _load_documents_index()
    return {"documents": docs}


@app.get("/api/documents/{doc_id}")
async def get_document_file(doc_id: str):
    docs = _load_documents_index()
    doc = next((d for d in docs if d["id"] == doc_id), None)
    if not doc:
        raise HTTPException(status_code=404, detail="Document non trouvé.")

    file_path = UPLOADS_DIR / doc["stored_name"]
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Fichier introuvable.")

    return FileResponse(
        path=str(file_path),
        media_type="application/pdf",
        filename=doc["original_name"],
    )


@app.delete("/api/documents/{doc_id}")
async def delete_document(doc_id: str):
    docs = _load_documents_index()
    doc = next((d for d in docs if d["id"] == doc_id), None)
    if not doc:
        raise HTTPException(status_code=404, detail="Document non trouvé.")

    file_path = UPLOADS_DIR / doc["stored_name"]
    if file_path.exists():
        file_path.unlink()

    docs = [d for d in docs if d["id"] != doc_id]
    _save_documents_index(docs)

    return {"success": True}


@app.post("/api/documents/{doc_id}/analyze")
async def analyze_document(doc_id: str):
    docs = _load_documents_index()
    doc = next((d for d in docs if d["id"] == doc_id), None)
    if not doc:
        raise HTTPException(status_code=404, detail="Document non trouvé.")

    file_path = UPLOADS_DIR / doc["stored_name"]
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Fichier introuvable.")

    try:
        extracted_text = _extract_pdf_text(file_path.read_bytes())
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Impossible de lire le PDF: {str(e)}")

    if not extracted_text.strip():
        raise HTTPException(
            status_code=422,
            detail="Aucun texte extractible dans ce PDF (document scanné ou image).",
        )

    # Limiter le texte envoyé à Claude
    truncated = extracted_text[:6000]

    if DEMO_MODE:
        summary = (
            f"[MODE DÉMO] Document « {doc['original_name']} » ({doc['page_count']} page(s)).\n\n"
            f"Aperçu du contenu extrait :\n{truncated[:800]}...\n\n"
            "Analyse détaillée non disponible sans API Anthropic."
        )
    else:
        response = client.messages.create(
            model=MODEL_NAME,
            max_tokens=1200,
            system="""Tu es un assistant médical français. On te donne le texte extrait d'un document médical PDF.
Résume le contenu de façon structurée :
1) Type de document (ordonnance, résultats labo, compte-rendu, etc.)
2) Informations clés (résultats, prescriptions, diagnostics)
3) Points d'attention importants
Sois factuel sans interpréter au-delà du texte. Rappelle que cela ne constitue pas un avis médical.""",
            messages=[{"role": "user", "content": f"Voici le texte du document :\n\n{truncated}"}],
        )
        summary = response.content[0].text

    return {
        "summary": summary,
        "document_name": doc["original_name"],
        "page_count": doc["page_count"],
        "timestamp": datetime.now().isoformat(),
    }


@app.post("/api/documents/{doc_id}/extract-symptoms")
async def extract_symptoms_from_document(doc_id: str):
    docs = _load_documents_index()
    doc = next((d for d in docs if d["id"] == doc_id), None)
    if not doc:
        raise HTTPException(status_code=404, detail="Document non trouvé.")

    file_path = UPLOADS_DIR / doc["stored_name"]
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Fichier introuvable.")

    try:
        extracted_text = _extract_pdf_text(file_path.read_bytes())
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Impossible de lire le PDF: {str(e)}")

    if not extracted_text.strip():
        raise HTTPException(
            status_code=422,
            detail="Aucun texte extractible dans ce PDF (document scanné ou image).",
        )

    truncated = extracted_text[:6000]

    if DEMO_MODE:
        return {
            "symptoms": [
                {
                    "description": "Symptôme extrait (mode démo)",
                    "intensity": 5,
                    "body_part": "Autre",
                    "duration": "1-3 jours",
                    "notes": f"Extrait du document « {doc['original_name']} » (mode démo)",
                    "timestamp": datetime.now().isoformat(),
                }
            ],
            "document_name": doc["original_name"],
        }

    response = client.messages.create(
        model=MODEL_NAME,
        max_tokens=2000,
        system="""Tu es un extracteur de données médicales expert. On te donne le texte d'un document médical PDF.
Tu dois extraire ABSOLUMENT TOUS les symptômes, plaintes, douleurs, gênes, résultats anormaux et problèmes de santé mentionnés.

Retourne un tableau JSON strict. Chaque entrée correspond à UN symptôme distinct.

Champs obligatoires pour chaque symptôme :
- "description": description précise et complète du symptôme tel que décrit dans le document (string, ex: "Douleur thoracique aiguë irradiant vers le bras gauche")
- "intensity": intensité estimée de 1 à 10 basée sur les qualificatifs utilisés (léger=2-3, modéré=4-5, important/sévère=6-8, insupportable/critique=9-10) (integer)
- "body_part": zone du corps concernée, UNIQUEMENT parmi: Tête, Gorge, Poitrine, Abdomen, Dos, Bras gauche, Bras droit, Jambe gauche, Jambe droite, Cou, Épaules, Mains, Pieds, Peau, Autre (string)
- "duration": durée UNIQUEMENT parmi: Moins d'1 heure, 1-6 heures, 6-24 heures, 1-3 jours, 3-7 jours, Plus d'1 semaine, Récurrent (string)
- "notes": TOUT le contexte médical pertinent : diagnostic associé, traitements prescrits, résultats d'examens, observations du médecin, antécédents liés (string, sois détaillé)
- "timestamp": date mentionnée dans le document au format ISO 8601 (ex: "2025-06-15T10:00:00"), ou null si non mentionnée (string ou null)

Règles :
- Sois exhaustif : chaque symptôme distinct = une entrée séparée
- Si le document mentionne des résultats de labo anormaux (ex: CRP élevée, anémie), crée une entrée pour chacun
- Inclus les symptômes passés ET présents
- Dans "notes", cite les valeurs numériques (ex: "CRP à 45 mg/L, norme < 5"), les médicaments prescrits, le nom du médecin si présent
- Réponds UNIQUEMENT avec le tableau JSON brut, sans markdown, sans texte avant/après
- Si aucun symptôme trouvé, retourne []""",
        messages=[{"role": "user", "content": f"Texte du document :\n\n{truncated}"}],
    )

    raw = response.content[0].text.strip()
    # Nettoyer si le modèle a mis du markdown
    if raw.startswith("```"):
        raw = raw.split("\n", 1)[1] if "\n" in raw else raw[3:]
        if raw.endswith("```"):
            raw = raw[:-3]
        raw = raw.strip()

    try:
        symptoms_list = json.loads(raw)
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=422,
            detail="L'IA n'a pas pu extraire les symptômes dans un format exploitable.",
        )

    if not isinstance(symptoms_list, list):
        symptoms_list = []

    valid_body_parts = {
        "Tête", "Gorge", "Poitrine", "Abdomen", "Dos",
        "Bras gauche", "Bras droit", "Jambe gauche", "Jambe droite",
        "Cou", "Épaules", "Mains", "Pieds", "Peau", "Autre",
    }
    valid_durations = {
        "Moins d'1 heure", "1-6 heures", "6-24 heures",
        "1-3 jours", "3-7 jours", "Plus d'1 semaine", "Récurrent",
    }

    cleaned = []
    for s in symptoms_list:
        if not isinstance(s, dict) or not s.get("description"):
            continue
        intensity = s.get("intensity", 5)
        if not isinstance(intensity, int) or intensity < 1:
            intensity = 5
        if intensity > 10:
            intensity = 10
        cleaned.append({
            "description": str(s["description"])[:200],
            "intensity": intensity,
            "body_part": s.get("body_part") if s.get("body_part") in valid_body_parts else "Autre",
            "duration": s.get("duration") if s.get("duration") in valid_durations else "1-3 jours",
            "notes": str(s.get("notes", f"Extrait du document « {doc['original_name']} »"))[:500],
            "timestamp": s.get("timestamp"),
        })

    return {
        "symptoms": cleaned,
        "document_name": doc["original_name"],
    }


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
