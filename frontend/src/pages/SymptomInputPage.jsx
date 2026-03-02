import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Container,
  Typography,
  TextField,
  Slider,
  Button,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  IconButton,
  Chip,
} from '@mui/material'
import {
  ArrowBack,
  Add,
  LocationOn,
} from '@mui/icons-material'
import { motion } from 'framer-motion'
import { useSymptom } from '../context/SymptomContext'
import apiService from '../services/apiService'

const SymptomInputPage = () => {
  const navigate = useNavigate()
  const { addSymptom } = useSymptom()
  
  const [formData, setFormData] = useState({
    description: '',
    intensity: 5,
    body_part: '',
    duration: '',
    notes: '',
  })
  
  const [loading, setLoading] = useState(false)
  const [analysis, setAnalysis] = useState(null)
  const [error, setError] = useState(null)

  const bodyParts = [
    'Tête', 'Gorge', 'Poitrine', 'Abdomen', 'Dos',
    'Bras gauche', 'Bras droit', 'Jambe gauche', 'Jambe droite',
    'Cou', 'Épaules', 'Mains', 'Pieds', 'Peau', 'Autre'
  ]

  const durations = [
    'Moins d\'1 heure',
    '1-6 heures',
    '6-24 heures',
    '1-3 jours',
    '3-7 jours',
    'Plus d\'1 semaine',
    'Récurrent'
  ]

  const handleChange = (field) => (event) => {
    setFormData({
      ...formData,
      [field]: event.target.value
    })
  }

  const handleIntensityChange = (event, newValue) => {
    setFormData({
      ...formData,
      intensity: newValue
    })
  }

  const handleSubmit = async () => {
    if (!formData.description || !formData.body_part || !formData.duration) {
      setError('Veuillez remplir tous les champs obligatoires')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Sauvegarder le symptôme localement
      const result = await addSymptom(formData)
      
      if (!result.success) {
        setError('Erreur lors de la sauvegarde du symptôme')
        setLoading(false)
        return
      }

      // Analyser avec Claude AI
      const analysisResult = await apiService.analyzeSymptoms([{
        ...formData,
        timestamp: new Date().toISOString()
      }])

      if (analysisResult.success) {
        setAnalysis(analysisResult.data)
      }

      // Réinitialiser le formulaire
      setFormData({
        description: '',
        intensity: 5,
        body_part: '',
        duration: '',
        notes: '',
      })

    } catch (err) {
      console.error('Erreur:', err)
      setError('Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'urgent': return 'error'
      case 'high': return 'warning'
      case 'medium': return 'info'
      case 'low': return 'success'
      default: return 'default'
    }
  }

  const getSeverityLabel = (severity) => {
    switch (severity) {
      case 'urgent': return 'URGENT'
      case 'high': return 'Élevé'
      case 'medium': return 'Moyen'
      case 'low': return 'Faible'
      default: return 'Non évalué'
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
          <Typography variant="h5" sx={{ fontWeight: 600, fontSize: { xs: '1.2rem', sm: '1.5rem' } }}>
            Enregistrer un Symptôme
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Formulaire */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Paper sx={{ p: { xs: 2, sm: 3 }, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Description du symptôme
            </Typography>

            <TextField
              fullWidth
              multiline
              rows={3}
              label="Décrivez votre symptôme *"
              placeholder="Ex: Douleur lancinante, sensation de brûlure..."
              value={formData.description}
              onChange={handleChange('description')}
              sx={{ mb: 3 }}
            />

            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Zone du corps *</InputLabel>
              <Select
                value={formData.body_part}
                onChange={handleChange('body_part')}
                label="Zone du corps *"
              >
                {bodyParts.map((part) => (
                  <MenuItem key={part} value={part}>
                    <LocationOn sx={{ mr: 1, fontSize: 18 }} />
                    {part}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Typography gutterBottom>
              Intensité de la douleur: <strong>{formData.intensity}/10</strong>
            </Typography>
            <Slider
              value={formData.intensity}
              onChange={handleIntensityChange}
              min={1}
              max={10}
              marks
              valueLabelDisplay="auto"
              sx={{ mb: 3 }}
            />

            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Durée *</InputLabel>
              <Select
                value={formData.duration}
                onChange={handleChange('duration')}
                label="Durée *"
              >
                {durations.map((duration) => (
                  <MenuItem key={duration} value={duration}>
                    {duration}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              multiline
              rows={2}
              label="Notes additionnelles (optionnel)"
              placeholder="Facteurs déclencheurs, traitements essayés..."
              value={formData.notes}
              onChange={handleChange('notes')}
              sx={{ mb: 3 }}
            />

            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={handleSubmit}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : <Add />}
            >
              {loading ? 'Analyse en cours...' : 'Enregistrer et Analyser'}
            </Button>
          </Paper>
        </motion.div>

        {/* Résultat de l'analyse */}
        {analysis && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Paper sx={{ p: 3, mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ flexGrow: 1 }}>
                  Analyse IA
                </Typography>
                <Chip 
                  label={getSeverityLabel(analysis.severity_level)}
                  color={getSeverityColor(analysis.severity_level)}
                  size="small"
                />
              </Box>

              {analysis.severity_level === 'urgent' && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  <strong>URGENCE DÉTECTÉE</strong><br />
                  Appelez immédiatement le 15 (SAMU) ou le 112
                </Alert>
              )}

              <Typography variant="body1" paragraph sx={{ whiteSpace: 'pre-line' }}>
                {analysis.response}
              </Typography>

              {analysis.recommendations && analysis.recommendations.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Recommandations:
                  </Typography>
                  {analysis.recommendations.map((rec, idx) => (
                    <Typography key={idx} variant="body2" sx={{ ml: 2, mb: 0.5 }}>
                      • {rec}
                    </Typography>
                  ))}
                </Box>
              )}

              {analysis.sources && analysis.sources.length > 0 && (
                <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                  <Typography variant="caption" color="text.secondary">
                    Sources: {analysis.sources.join(', ')}
                  </Typography>
                </Box>
              )}
            </Paper>

            <Button
              fullWidth
              variant="outlined"
              onClick={() => navigate('/chat')}
            >
              Discuter avec l'IA pour plus de détails
            </Button>
          </motion.div>
        )}
      </Container>
    </Box>
  )
}

export default SymptomInputPage
