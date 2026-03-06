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
  Chip,
  Divider,
} from '@mui/material'
import {
  Add,
  LocationOn,
  FiberManualRecord,
  Chat,
  CheckCircleOutline,
} from '@mui/icons-material'
import { motion } from 'framer-motion'
import { useSymptom } from '../context/SymptomContext'
import apiService from '../services/apiService'

const getCurrentDateTimeLocal = () => {
  const now = new Date()
  const offsetMs = now.getTimezoneOffset() * 60000
  return new Date(now.getTime() - offsetMs).toISOString().slice(0, 16)
}

const SymptomInputPage = () => {
  const navigate = useNavigate()
  const { addSymptom } = useSymptom()
  
  const [formData, setFormData] = useState({
    description: '',
    intensity: 5,
    body_part: '',
    duration: '',
    notes: '',
    timestamp: getCurrentDateTimeLocal(),
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

  const getIntensityColor = (val) => {
    if (val <= 3) return '#10b981'
    if (val <= 6) return '#f59e0b'
    return '#ef4444'
  }

  const getIntensityLabel = (val) => {
    if (val <= 3) return 'Légère'
    if (val <= 6) return 'Modérée'
    if (val <= 8) return 'Intense'
    return 'Très intense'
  }

  const handleSubmit = async () => {
    if (!formData.description || !formData.body_part || !formData.duration) {
      setError('Veuillez remplir tous les champs obligatoires')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const result = await addSymptom(formData)
      
      if (!result.success) {
        setError('Erreur lors de la sauvegarde du symptôme')
        setLoading(false)
        return
      }

      const analysisResult = await apiService.analyzeSymptoms([{
        ...formData,
        timestamp: new Date(formData.timestamp).toISOString()
      }])

      if (analysisResult.success) {
        setAnalysis(analysisResult.data)
      }

      setFormData({
        description: '',
        intensity: 5,
        body_part: '',
        duration: '',
        notes: '',
        timestamp: getCurrentDateTimeLocal(),
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

  const filledSteps = [
    formData.description,
    formData.body_part,
    formData.duration,
  ].filter(Boolean).length

  return (
    <Box sx={{ minHeight: '100vh', pb: 2 }}>
      {/* Header coloré propre à cette page */}
      <Box sx={{
        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        color: 'white',
        pt: { xs: 3, sm: 4 },
        pb: { xs: 4, sm: 5 },
        px: 2,
        borderRadius: '0 0 32px 32px',
      }}>
        <Container maxWidth="md">
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
            Nouveau symptôme
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.85 }}>
            Décrivez précisément ce que vous ressentez
          </Typography>

          {/* Mini progression */}
          <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
            {[0, 1, 2].map((i) => (
              <Box key={i} sx={{
                flex: 1, height: 4, borderRadius: 2,
                background: i < filledSteps
                  ? 'rgba(255,255,255,0.9)'
                  : 'rgba(255,255,255,0.25)',
                transition: 'background 0.3s',
              }} />
            ))}
          </Box>
        </Container>
      </Box>

      <Container maxWidth="md" sx={{ mt: -3, position: 'relative', zIndex: 2 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Paper sx={{ p: { xs: 2.5, sm: 3 }, mb: 3 }}>
            {/* Section 1: Description */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Box sx={{
                width: 28, height: 28, borderRadius: '50%',
                background: '#6366f1', color: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.8rem', fontWeight: 700, mr: 1.5,
              }}>1</Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Que ressentez-vous ?
              </Typography>
            </Box>

            <TextField
              fullWidth
              multiline
              rows={3}
              placeholder="Ex : Douleur lancinante au niveau du front, aggravée par la lumière..."
              value={formData.description}
              onChange={handleChange('description')}
              sx={{ mb: 3 }}
            />

            <Divider sx={{ mb: 3 }} />

            {/* Section 2: Localisation */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Box sx={{
                width: 28, height: 28, borderRadius: '50%',
                background: '#06b6d4', color: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.8rem', fontWeight: 700, mr: 1.5,
              }}>2</Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Où avez-vous mal ?
              </Typography>
            </Box>

            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Zone du corps</InputLabel>
              <Select
                value={formData.body_part}
                onChange={handleChange('body_part')}
                label="Zone du corps"
              >
                {bodyParts.map((part) => (
                  <MenuItem key={part} value={part}>
                    <LocationOn sx={{ mr: 1, fontSize: 18, color: '#06b6d4' }} />
                    {part}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Intensité - visuel différent */}
            <Box sx={{
              p: 2.5, borderRadius: 3,
              background: `${getIntensityColor(formData.intensity)}10`,
              border: `1px solid ${getIntensityColor(formData.intensity)}30`,
              mb: 3,
            }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Intensité de la douleur
                </Typography>
                <Chip
                  size="small"
                  label={`${formData.intensity}/10 — ${getIntensityLabel(formData.intensity)}`}
                  sx={{
                    fontWeight: 600,
                    bgcolor: getIntensityColor(formData.intensity),
                    color: 'white',
                  }}
                />
              </Box>
              <Slider
                value={formData.intensity}
                onChange={handleIntensityChange}
                min={1}
                max={10}
                marks
                valueLabelDisplay="auto"
                sx={{
                  color: getIntensityColor(formData.intensity),
                  '& .MuiSlider-markActive': {
                    backgroundColor: 'white',
                  },
                }}
              />
            </Box>

            <Divider sx={{ mb: 3 }} />

            {/* Section 3: Durée */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Box sx={{
                width: 28, height: 28, borderRadius: '50%',
                background: '#f59e0b', color: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.8rem', fontWeight: 700, mr: 1.5,
              }}>3</Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Depuis combien de temps ?
              </Typography>
            </Box>

            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Durée</InputLabel>
              <Select
                value={formData.duration}
                onChange={handleChange('duration')}
                label="Durée"
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

            <TextField
              fullWidth
              label="Date et heure du symptôme"
              type="datetime-local"
              value={formData.timestamp}
              onChange={handleChange('timestamp')}
              InputLabelProps={{ shrink: true }}
              sx={{ mb: 3 }}
            />

            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={handleSubmit}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <CheckCircleOutline />}
              sx={{
                py: 1.5,
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                },
              }}
            >
              {loading ? 'Analyse en cours...' : 'Enregistrer et analyser'}
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
            <Paper sx={{
              p: 3, mb: 3,
              border: '2px solid',
              borderColor: analysis.severity_level === 'urgent' ? 'error.main' : 'primary.light',
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700 }}>
                  Résultat de l'analyse
                </Typography>
                <Chip 
                  label={getSeverityLabel(analysis.severity_level)}
                  color={getSeverityColor(analysis.severity_level)}
                  size="small"
                  sx={{ fontWeight: 700 }}
                />
              </Box>

              {analysis.severity_level === 'urgent' && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  <strong>URGENCE DÉTECTÉE</strong> — Appelez immédiatement le 15 (SAMU) ou le 112
                </Alert>
              )}

              <Typography variant="body1" paragraph sx={{ whiteSpace: 'pre-line' }}>
                {analysis.response}
              </Typography>

              {analysis.recommendations && analysis.recommendations.length > 0 && (
                <Box sx={{
                  mt: 2, p: 2, borderRadius: 2,
                  bgcolor: 'background.default',
                }}>
                  <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                    Recommandations
                  </Typography>
                  {analysis.recommendations.map((rec, idx) => (
                    <Box key={idx} sx={{ display: 'flex', alignItems: 'flex-start', mb: 0.5 }}>
                      <FiberManualRecord sx={{ fontSize: 8, mt: 0.8, mr: 1, color: 'primary.main' }} />
                      <Typography variant="body2">{rec}</Typography>
                    </Box>
                  ))}
                </Box>
              )}

              {analysis.sources && analysis.sources.length > 0 && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
                  Sources : {analysis.sources.join(', ')}
                </Typography>
              )}
            </Paper>

            <Button
              fullWidth
              variant="outlined"
              startIcon={<Chat />}
              onClick={() => navigate('/chat')}
              sx={{ borderRadius: 3 }}
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
