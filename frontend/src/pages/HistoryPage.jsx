import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Container,
  Typography,
  Paper,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Alert,
  Card,
  CardContent,
  Grid,
  CircularProgress,
} from '@mui/material'
import {
  ArrowBack,
  Delete,
  PictureAsPdf,
  Timeline,
  DeleteOutline,
  TrendingUp,
  TrendingDown,
  TrendingFlat,
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
    if (intensity >= 8) return 'error'
    if (intensity >= 5) return 'warning'
    return 'success'
  }

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'improving': return <TrendingDown color="success" />
      case 'worsening': return <TrendingUp color="error" />
      default: return <TrendingFlat color="info" />
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
    <Box sx={{ minHeight: '100vh', py: { xs: 2, sm: 3 } }}>
      <Container maxWidth="md">
        {/* En-tête */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <IconButton onClick={() => navigate('/')} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h5" sx={{ fontWeight: 600, flexGrow: 1, fontSize: { xs: '1.2rem', sm: '1.5rem' } }}>
            Historique des Symptômes
          </Typography>
          {symptoms.length > 0 && (
            <IconButton 
              color="error" 
              onClick={() => setClearDialog(true)}
              title="Tout supprimer"
            >
              <DeleteOutline />
            </IconButton>
          )}
        </Box>

        {symptoms.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Timeline sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Aucun symptôme enregistré
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Commencez à enregistrer vos symptômes pour suivre leur évolution
            </Typography>
            <Button 
              variant="contained"
              onClick={() => navigate('/symptom-input')}
            >
              Enregistrer un symptôme
            </Button>
          </Paper>
        ) : (
          <>
            {/* Statistiques */}
            {statistics && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card sx={{ mb: 3, bgcolor: 'primary.light', color: 'white' }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Résumé
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={4}>
                        <Typography variant="h4">{statistics.totalEntries}</Typography>
                        <Typography variant="body2">Entrées</Typography>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Typography variant="h4">{statistics.averageIntensity}</Typography>
                        <Typography variant="body2">Intensité moyenne</Typography>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {getTrendIcon(statistics.trend)}
                          <Typography variant="body2" sx={{ ml: 1 }}>
                            {getTrendLabel(statistics.trend)}
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Actions */}
            <Box sx={{ mb: 3, display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
              <Button
                variant="contained"
                startIcon={generating ? <CircularProgress size={20} /> : <PictureAsPdf />}
                onClick={handleGeneratePDF}
                disabled={generating}
                sx={{ flex: 1 }}
              >
                Exporter en PDF
              </Button>
              <Button
                variant="outlined"
                startIcon={analyzingEvolution ? <CircularProgress size={20} /> : <Timeline />}
                onClick={handleAnalyzeEvolution}
                disabled={analyzingEvolution || symptoms.length < 2}
                sx={{ flex: 1 }}
              >
                Analyser l'évolution
              </Button>
            </Box>

            {/* Résultat de l'analyse d'évolution */}
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
                  <Typography variant="subtitle2" gutterBottom>
                    Analyse de l'évolution temporelle
                  </Typography>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                    {evolution.analysis}
                  </Typography>
                </Alert>
              </motion.div>
            )}

            {/* Liste des symptômes */}
            <Paper>
              <List>
                {symptoms.slice().reverse().map((symptom, index) => (
                  <motion.div
                    key={symptom.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <ListItem
                      divider={index < symptoms.length - 1}
                      sx={{
                        flexDirection: 'column',
                        alignItems: 'stretch',
                        py: 2,
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', width: '100%', mb: 1 }}>
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                            {symptom.description}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatDate(symptom.timestamp)}
                          </Typography>
                        </Box>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteClick(symptom)}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Box>

                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                        <Chip
                          label={`${symptom.body_part}`}
                          size="small"
                          variant="outlined"
                        />
                        <Chip
                          label={`Intensité: ${symptom.intensity}/10`}
                          size="small"
                          color={getIntensityColor(symptom.intensity)}
                        />
                        <Chip
                          label={symptom.duration}
                          size="small"
                          variant="outlined"
                        />
                      </Box>

                      {symptom.notes && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          Notes: {symptom.notes}
                        </Typography>
                      )}
                    </ListItem>
                  </motion.div>
                ))}
              </List>
            </Paper>
          </>
        )}

        {/* Dialog de suppression */}
        <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
          <DialogTitle>Supprimer ce symptôme ?</DialogTitle>
          <DialogContent>
            <Typography>
              Cette action est irréversible. Êtes-vous sûr de vouloir supprimer ce symptôme ?
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialog(false)}>Annuler</Button>
            <Button onClick={handleDeleteConfirm} color="error">
              Supprimer
            </Button>
          </DialogActions>
        </Dialog>

        {/* Dialog de suppression complète */}
        <Dialog open={clearDialog} onClose={() => setClearDialog(false)}>
          <DialogTitle>Supprimer tout l'historique ?</DialogTitle>
          <DialogContent>
            <Alert severity="warning" sx={{ mb: 2 }}>
              Cette action supprimera TOUS vos symptômes enregistrés de manière permanente.
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
