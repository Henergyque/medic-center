from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from datetime import datetime
from typing import List, Dict
import io


class MedicalReportPDF:
    """Générateur de rapport médical PDF pour le suivi des symptômes"""
    
    def __init__(self):
        self.styles = getSampleStyleSheet()
        self._setup_custom_styles()
    
    def _setup_custom_styles(self):
        """Configure les styles personnalisés pour le PDF"""
        # Style pour le titre
        self.styles.add(ParagraphStyle(
            name='CustomTitle',
            parent=self.styles['Heading1'],
            fontSize=18,
            textColor=colors.HexColor('#1a5490'),
            spaceAfter=20,
            alignment=TA_CENTER,
            fontName='Helvetica-Bold'
        ))
        
        # Style pour les sections
        self.styles.add(ParagraphStyle(
            name='SectionHeader',
            parent=self.styles['Heading2'],
            fontSize=14,
            textColor=colors.HexColor('#2c5aa0'),
            spaceAfter=10,
            spaceBefore=15,
            fontName='Helvetica-Bold'
        ))
        
        # Style pour le contenu
        self.styles.add(ParagraphStyle(
            name='CustomBody',
            parent=self.styles['BodyText'],
            fontSize=10,
            alignment=TA_JUSTIFY,
            spaceAfter=8
        ))
    
    def generate_report(self, symptom_data: List[Dict]) -> bytes:
        """
        Génère un rapport PDF médical factuel
        
        Args:
            symptom_data: Liste des symptômes avec timestamps et détails
            
        Returns:
            bytes: Contenu du PDF généré
        """
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=2*cm, bottomMargin=2*cm)
        story = []
        
        # En-tête du rapport
        story.append(Paragraph("RAPPORT DE SUIVI DES SYMPTÔMES", self.styles['CustomTitle']))
        story.append(Spacer(1, 0.5*cm))
        
        # Informations générales
        story.append(Paragraph("Informations du Rapport", self.styles['SectionHeader']))
        
        info_data = [
            ["Date de génération:", datetime.now().strftime("%d/%m/%Y à %H:%M")],
            ["Période couverte:", self._get_period_covered(symptom_data)],
            ["Nombre d'entrées:", str(len(symptom_data))],
        ]
        
        info_table = Table(info_data, colWidths=[5*cm, 10*cm])
        info_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#e8f0f7')),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ]))
        story.append(info_table)
        story.append(Spacer(1, 0.8*cm))
        
        # Disclaimer médical
        story.append(Paragraph("AVERTISSEMENT IMPORTANT", self.styles['SectionHeader']))
        disclaimer = """Ce rapport est un outil d'auto-surveillance et ne constitue en aucun cas un diagnostic médical. 
        Il est destiné à faciliter la communication avec un professionnel de santé lors d'une consultation. 
        Seul un médecin qualifié peut établir un diagnostic et prescrire un traitement approprié."""
        story.append(Paragraph(disclaimer, self.styles['CustomBody']))
        story.append(Spacer(1, 0.8*cm))
        
        # Chronologie des symptômes
        story.append(Paragraph("Chronologie des Symptômes", self.styles['SectionHeader']))
        story.append(Spacer(1, 0.3*cm))
        
        # Tri des symptômes par date
        sorted_symptoms = sorted(symptom_data, key=lambda x: x.get('timestamp', ''))
        
        for idx, symptom in enumerate(sorted_symptoms, 1):
            # Date et heure
            date_str = symptom.get('timestamp', 'Non daté')
            if isinstance(date_str, str) and date_str != 'Non daté':
                try:
                    dt = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
                    date_str = dt.strftime("%d/%m/%Y à %H:%M")
                except:
                    pass
            
            story.append(Paragraph(f"<b>Entrée #{idx} - {date_str}</b>", self.styles['CustomBody']))
            
            # Détails du symptôme
            symptom_details = [
                ["Description:", symptom.get('description', 'Non spécifiée')],
                ["Zone concernée:", symptom.get('body_part', 'Non spécifiée')],
                ["Intensité:", f"{symptom.get('intensity', 'N/A')}/10"],
                ["Durée:", symptom.get('duration', 'Non spécifiée')],
            ]
            
            # Ajouter les notes si présentes
            if symptom.get('notes'):
                symptom_details.append(["Notes:", symptom.get('notes')])
            
            symptom_table = Table(symptom_details, colWidths=[4*cm, 11*cm])
            symptom_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f5f5f5')),
                ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
                ('ALIGN', (0, 0), (0, -1), 'LEFT'),
                ('ALIGN', (1, 0), (1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 9),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
                ('TOPPADDING', (0, 0), (-1, -1), 6),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ]))
            story.append(symptom_table)
            story.append(Spacer(1, 0.5*cm))
        
        # Résumé de l'évolution
        story.append(PageBreak())
        story.append(Paragraph("Résumé de l'Évolution", self.styles['SectionHeader']))
        
        evolution_summary = self._generate_evolution_summary(sorted_symptoms)
        story.append(Paragraph(evolution_summary, self.styles['CustomBody']))
        story.append(Spacer(1, 0.8*cm))
        
        # Recommandations pour le médecin
        story.append(Paragraph("Notes pour le Professionnel de Santé", self.styles['SectionHeader']))
        notes = """Ce rapport présente un suivi auto-déclaré des symptômes sur la période indiquée. 
        Les intensités sont subjectives et basées sur une échelle de 1 à 10 auto-évaluée par le patient. 
        Ce document peut servir de support lors de l'anamnèse."""
        story.append(Paragraph(notes, self.styles['CustomBody']))
        story.append(Spacer(1, 1*cm))
        
        # Numéros d'urgence
        story.append(Paragraph("Numéros d'Urgence", self.styles['SectionHeader']))
        emergency_data = [
            ["SAMU (Urgences médicales)", "15"],
            ["Urgences européennes", "112"],
            ["Pompiers", "18"],
            ["Centre antipoison", "Consulter: https://centres-antipoison.net"],
        ]
        emergency_table = Table(emergency_data, colWidths=[10*cm, 5*cm])
        emergency_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#ff6b6b')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#fff5f5')),
            ('TEXTCOLOR', (0, 1), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 1, colors.grey),
        ]))
        story.append(emergency_table)
        
        # Pied de page
        story.append(Spacer(1, 1*cm))
        footer = f"<i>Rapport généré le {datetime.now().strftime('%d/%m/%Y à %H:%M')} - Document confidentiel</i>"
        story.append(Paragraph(footer, self.styles['CustomBody']))
        
        # Générer le PDF
        doc.build(story)
        pdf_bytes = buffer.getvalue()
        buffer.close()
        
        return pdf_bytes
    
    def _get_period_covered(self, symptom_data: List[Dict]) -> str:
        """Calcule la période couverte par le rapport"""
        if not symptom_data:
            return "Aucune donnée"
        
        timestamps = [s.get('timestamp') for s in symptom_data if s.get('timestamp')]
        if not timestamps:
            return "Dates non disponibles"
        
        try:
            dates = [datetime.fromisoformat(t.replace('Z', '+00:00')) for t in timestamps]
            start_date = min(dates).strftime("%d/%m/%Y")
            end_date = max(dates).strftime("%d/%m/%Y")
            return f"Du {start_date} au {end_date}"
        except:
            return "Période indéterminée"
    
    def _generate_evolution_summary(self, sorted_symptoms: List[Dict]) -> str:
        """Génère un résumé factuel de l'évolution"""
        if len(sorted_symptoms) < 2:
            return "Données insuffisantes pour analyser l'évolution (une seule entrée)."
        
        # Analyser les tendances d'intensité
        intensities = [s.get('intensity', 0) for s in sorted_symptoms if s.get('intensity')]
        
        if not intensities:
            return "Aucune donnée d'intensité disponible pour l'analyse."
        
        avg_intensity = sum(intensities) / len(intensities)
        first_intensity = intensities[0]
        last_intensity = intensities[-1]
        
        trend = "stable"
        if last_intensity > first_intensity + 2:
            trend = "augmentation"
        elif last_intensity < first_intensity - 2:
            trend = "diminution"
        
        summary = f"""Sur la période de suivi de {len(sorted_symptoms)} entrées:
        - Intensité moyenne des symptômes: {avg_intensity:.1f}/10
        - Intensité initiale: {first_intensity}/10
        - Intensité actuelle: {last_intensity}/10
        - Tendance observée: {trend} de l'intensité
        
        Les symptômes ont été enregistrés de manière régulière sur la période indiquée, 
        permettant un suivi objectif de l'évolution."""
        
        return summary


# Route FastAPI pour générer le PDF
from fastapi import APIRouter
from fastapi.responses import Response

router = APIRouter()

@router.post("/api/generate-pdf")
async def generate_medical_pdf(symptom_data: List[Dict]):
    """Génère un PDF médical à partir des données de symptômes"""
    try:
        pdf_generator = MedicalReportPDF()
        pdf_bytes = pdf_generator.generate_report(symptom_data)
        
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=rapport_medical_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
            }
        )
    except Exception as e:
        return {"error": f"Erreur lors de la génération du PDF: {str(e)}"}
