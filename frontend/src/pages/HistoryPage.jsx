import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Container,
  Typography,
  Paper,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Alert,
  CircularProgress,
} from '@mui/material'
import {
  Delete,
  PictureAsPdf,
  Timeline,
  DeleteOutline,
  TrendingUp,
  TrendingDown,
  TrendingFlat,
  Add,
} from '@mui/icons-material'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useSymptom } from '../context/SymptomContext'
import apiService from '../services/apiService'

const HistoryPage = () => {
  const navigate = useNavigate()
  const { symptoms, deleteSymptom, clearAllSymptoms, statistics } = useSymptom()
  const [deleteDialog, setDeleteDialog] = useState(false)
  const [clearDialog, setClearDialog] = useState(false)
  const [selectedSymptom, setSelectedSymptom] = useState(null)
  const [generating, setGenerating] = useState(false)
  const [evolution, setEvolution] = useState(null)
  const [analyzingEvolution, setAnalyzingEvolution] = useState(false)

  const handleDeleteClick = (symptom) => {
    setSelectedSymptom(symptom)
    setDeleteDialog(true)
  }

  const handleDeleteConfirm = async () => {
    if (selectedSymptom) {
      await deleteSymptom(selectedSymptom.id)
    }
    setDeleteDialog(false)
    setSelectedSymptom(null)
  }

  const handleClearAll = async () => {
    await clearAllSymptoms()
    setClearDialog(false)
  }

  const handleGeneratePDF = async () => {
    setGenerating(true)
    try {
      const result = await apiService.generatePDF(symptoms)
      if (!result.success) {
        alert('Erreur lors de la génération du PDF: ' + result.error)
      }
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de la génération du PDF')
    } finally {
      setGenerating(false)
    }
  }

  const handleAnalyzeEvolution = async () => {
    if (symptoms.length < 2) {
      alert('Au moins 2 entrées sont nécessaires pour analyser l\'évolution')
      return
    }

    setAnalyzingEvolution(true)
    try {
      const result = await apiService.analyzeTemporalEvolution(symptoms)
      if (result.success) {
        setEvolution(result.data)
      } else {
        alert('Erreur lors de l\'analyse: ' + result.error)
      }
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de l\'analyse de l\'évolution')
    } finally {
      setAnalyzingEvolution(false)
    }
  }

  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'PPpp', { locale: fr })
    } catch {
      return 'Date invalide'
    }
  }

  const getIntensityColor = (intensity) => {
    if (intensity >= 8) return '#ef4444'
    if (intensity >= 5) return '#f59e0b'
    return '#10b981'
  }

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'improving': return <TrendingDown sx={{ color: '#10b981' }} />
      case 'worsening': return <TrendingUp sx={{ color: '#ef4444' }} />
      default: return <TrendingFlat sx={{ color: '#06b6d4' }} />
    }
  }

  const getTrendLabel = (trend) => {
    switch (trend) {
      case 'improving': return 'Amélioration'
      case 'worsening': return 'Aggravation'
      case 'stable': return 'Stable'
      default: return 'Données insuffisantes'
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', pb: 2 }}>
      {/* Header gradient ambre unique à l'historique */}
      <Box sx={{
        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        color: 'white',
        pt: { xs: 3, sm: 4 },
        pb: { xs: 4, sm: 5 },
        px: 2,
        borderRadius: '0 0 32px 32px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <Box sx={{
          position: 'absolute', top: -30, right: -30,
          width: 120, height: 120, borderRadius: '50%',
          background: 'rgba(255,255,255,0.1)',
        }} />
        <Container maxWidth="md">
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
                Historique
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.85 }}>
                {symptoms.length} entrée{symptoms.length !== 1 ? 's' : ''} enregistrée{symptoms.length !== 1 ? 's' : ''}
              </Typography>
            </Box>
            {symptoms.length > 0 && (
              <IconButton
                onClick={() => setClearDialog(true)}
                sx={{ color: 'rgba(255,255,255,0.8)', '&:hover': { color: 'white' } }}
              >
                <DeleteOutline />
              </IconButton>
            )}
          </Box>

          {/* Stats dans le hero */}
          {symptoms.length > 0 && statistics && (
            <Box sx={{ display: 'flex', gap: 2, mt: 2.5, flexWrap: 'wrap' }}>
              <Box sx={{
                background: 'rgba(255,255,255,0.18)',
                backdropFilter: 'blur(10px)',
                borderRadius: 2.5, px: 2, py: 1.2,
              }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {statistics.averageIntensity}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                  intensité moy.
                </Typography>
              </Box>
              <Box sx={{
                background: 'rgba(255,255,255,0.18)',
                backdropFilter: 'blur(10px)',
                borderRadius: 2.5, px: 2, py: 1.2,
                display: 'flex', alignItems: 'center', gap: 1,
              }}>
                {getTrendIcon(statistics.trend)}
                <Typography variant="caption" sx={{ fontWeight: 600 }}>
                  {getTrendLabel(statistics.trend)}
                </Typography>
              </Box>
            </Box>
          )}
        </Container>
      </Box>

      <Container maxWidth="md" sx={{ mt: -2.5, position: 'relative', zIndex: 2 }}>
        {symptoms.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Paper sx={{ p: 5, textAlign: 'center' }}>
              <Timeline sx={{ fontSize: 56, color: '#d4d4d8', mb: 2 }} />
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Aucun symptôme enregistré
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Commencez à enregistrer vos symptômes pour suivre leur évolution
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => navigate('/symptom-input')}
                sx={{
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  '&:hover': { background: 'linear-gradient(135deg, #059669, #047857)' },
                }}
              >
                Enregistrer un symptôme
              </Button>
            </Paper>
          </motion.div>
        ) : (
          <>
            {/* Actions */}
            <Box sx={{ display: 'flex', gap: 1.5, mb: 3 }}>
              <Button
                variant="contained"
                startIcon={generating ? <CircularProgress size={18} color="inherit" /> : <PictureAsPdf />}
                onClick={handleGeneratePDF}
                disabled={generating}
                size="small"
                sx={{
                  flex: 1,
                  background: '#ef4444',
                  '&:hover': { background: '#dc2626' },
                }}
              >
                Export PDF
              </Button>
              <Button
                variant="outlined"
                startIcon={analyzingEvolution ? <CircularProgress size={18} /> : <Timeline />}
                onClick={handleAnalyzeEvolution}
                disabled={analyzingEvolution || symptoms.length < 2}
                size="small"
                sx={{ flex: 1 }}
              >
                Évolution
              </Button>
            </Box>

            {/* Résultat analyse d'évolution */}
            {evolution && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <Alert
                  severity={
                    evolution.evolution === 'worsening' ? 'error' :
                    evolution.evolution === 'improving' ? 'success' : 'info'
                  }
                  sx={{ mb: 3 }}
                  onClose={() => setEvolution(null)}
                >
                  <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                    Analyse de l'évolution
                  </Typography>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                    {evolution.analysis}
                  </Typography>
                </Alert>
              </motion.div>
            )}

            {/* Timeline-style symptom list */}
            <Box sx={{ position: 'relative', pl: { xs: 2.5, sm: 3 } }}>
              {/* Ligne verticale de la timeline */}
              <Box sx={{
                position: 'absolute',
                left: { xs: 8, sm: 10 },
                top: 0, bottom: 0,
                width: 2,
                bgcolor: '#e5e7eb',
                borderRadius: 1,
              }} />

              {symptoms.slice().reverse().map((symptom, index) => (
                <motion.div
                  key={symptom.id}
                  initial={{ opacity: 0, x: -15 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.04 }}
                >
                  <Box sx={{ position: 'relative', mb: 2 }}>
                    {/* Dot de la timeline */}
                    <Box sx={{
                      position: 'absolute',
                      left: { xs: -20, sm: -22 },
                      top: 18,
                      width: 12, height: 12,
                      borderRadius: '50%',
                      bgcolor: getIntensityColor(symptom.intensity),
                      border: '2px solid white',
                      boxShadow: '0 0 0 2px ' + getIntensityColor(symptom.intensity) + '40',
                      zIndex: 1,
                    }} />

                    <Paper sx={{
                      p: 2,
                      transition: 'box-shadow 0.2s',
                      '&:hover': { boxShadow: '0 4px 16px rgba(0,0,0,0.1)' },
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.3 }}>
                            {symptom.description}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatDate(symptom.timestamp)}
                          </Typography>
                        </Box>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteClick(symptom)}
                          sx={{ color: '#d4d4d8', '&:hover': { color: '#ef4444' } }}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Box>

                      <Box sx={{ display: 'flex', gap: 0.8, flexWrap: 'wrap', mt: 1.5 }}>
                        <Chip
                          label={symptom.body_part}
                          size="small"
                          sx={{ bgcolor: '#ede9fe', color: '#6366f1', fontWeight: 500 }}
                        />
                        <Chip
                          label={`${symptom.intensity}/10`}
                          size="small"
                          sx={{
                            bgcolor: getIntensityColor(symptom.intensity) + '18',
                            color: getIntensityColor(symptom.intensity),
                            fontWeight: 600,
                          }}
                        />
                        <Chip
                          label={symptom.duration}
                          size="small"
                          variant="outlined"
                          sx={{ borderColor: '#e5e7eb', color: '#64748b' }}
                        />
                      </Box>

                      {symptom.notes && (
                        <Typography variant="body2" color="text.secondary" sx={{
                          mt: 1.5, pl: 1.5,
                          borderLeft: '2px solid #e5e7eb',
                          fontSize: '0.82rem',
                        }}>
                          {symptom.notes}
                        </Typography>
                      )}
                    </Paper>
                  </Box>
                </motion.div>
              ))}
            </Box>
          </>
        )}

        {/* Dialogs */}
        <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
          <DialogTitle>Supprimer ce symptôme ?</DialogTitle>
          <DialogContent>
            <Typography>
              Cette action est irréversible. Êtes-vous sûr de vouloir supprimer ce symptôme ?
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialog(false)}>Annuler</Button>
            <Button onClick={handleDeleteConfirm} color="error">Supprimer</Button>
          </DialogActions>
        </Dialog>

        <Dialog open={clearDialog} onClose={() => setClearDialog(false)}>
          <DialogTitle>Supprimer tout l'historique ?</DialogTitle>
          <DialogContent>
            <Alert severity="warning" sx={{ mb: 2 }}>
              Cette action supprimera TOUS vos symptômes de manière permanente.
            </Alert>
            <Typography>
              Êtes-vous absolument certain de vouloir continuer ?
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setClearDialog(false)}>Annuler</Button>
            <Button onClick={handleClearAll} color="error" variant="contained">
              Tout supprimer
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  )
}

export default HistoryPage
