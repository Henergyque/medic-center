import React, { useEffect, useState } from 'react'
import {
  Box,
  Container,
  Typography,
  Paper,
  TextField,
  Button,
  Alert,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
} from '@mui/material'
import { Save, Description } from '@mui/icons-material'
import { motion } from 'framer-motion'
import storageService from '../services/storageService'

const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

const MedicalProfilePage = () => {
  const [formData, setFormData] = useState(null)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const load = async () => {
      const profile = await storageService.getMedicalProfile()
      setFormData(profile)
    }
    load()
  }, [])

  const handleChange = (field) => (event) => {
    setSaved(false)
    setFormData((prev) => ({ ...prev, [field]: event.target.value }))
  }

  const handleSave = async () => {
    if (!formData) return
    const ok = await storageService.saveMedicalProfile(formData)
    if (ok) {
      setSaved(true)
      setError(null)
      return
    }
    setError('Impossible de sauvegarder la fiche médicale.')
  }

  if (!formData) {
    return (
      <Container sx={{ py: 3 }}>
        <Typography>Chargement...</Typography>
      </Container>
    )
  }

  return (
    <Box sx={{ minHeight: '100vh', pb: 2 }}>
      <Box
        sx={{
          background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
          color: 'white',
          pt: { xs: 4, sm: 5 },
          pb: { xs: 5, sm: 6 },
          px: 2,
          borderRadius: '0 0 32px 32px',
        }}
      >
        <Container maxWidth="md">
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
            Ma fiche médicale
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            Renseignez les informations importantes pour votre suivi santé.
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="md" sx={{ mt: -3, position: 'relative', zIndex: 2 }}>
        {saved && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSaved(false)}>
            Fiche médicale enregistrée.
          </Alert>
        )}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>
          <Paper sx={{ p: { xs: 2, sm: 3 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Description sx={{ mr: 1, color: '#0284c7' }} />
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Informations personnelles
              </Typography>
            </Box>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Prénom" value={formData.first_name} onChange={handleChange('first_name')} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Nom" value={formData.last_name} onChange={handleChange('last_name')} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="Date de naissance"
                  InputLabelProps={{ shrink: true }}
                  value={formData.birth_date}
                  onChange={handleChange('birth_date')}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Sexe</InputLabel>
                  <Select value={formData.sex} onChange={handleChange('sex')} label="Sexe">
                    <MenuItem value="">Non précisé</MenuItem>
                    <MenuItem value="Femme">Femme</MenuItem>
                    <MenuItem value="Homme">Homme</MenuItem>
                    <MenuItem value="Autre">Autre</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField fullWidth label="Taille (cm)" type="number" value={formData.height_cm} onChange={handleChange('height_cm')} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField fullWidth label="Poids (kg)" type="number" value={formData.weight_kg} onChange={handleChange('weight_kg')} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth>
                  <InputLabel>Groupe sanguin</InputLabel>
                  <Select value={formData.blood_type} onChange={handleChange('blood_type')} label="Groupe sanguin">
                    <MenuItem value="">Inconnu</MenuItem>
                    {bloodTypes.map((type) => (
                      <MenuItem key={type} value={type}>{type}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Allergies"
                  placeholder="Médicaments, aliments, environnement..."
                  value={formData.allergies}
                  onChange={handleChange('allergies')}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Maladies chroniques"
                  value={formData.chronic_conditions}
                  onChange={handleChange('chronic_conditions')}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Traitements en cours"
                  value={formData.current_medications}
                  onChange={handleChange('current_medications')}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Antécédents chirurgicaux"
                  value={formData.past_surgeries}
                  onChange={handleChange('past_surgeries')}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Contact d'urgence (nom)"
                  value={formData.emergency_contact_name}
                  onChange={handleChange('emergency_contact_name')}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Contact d'urgence (téléphone)"
                  value={formData.emergency_contact_phone}
                  onChange={handleChange('emergency_contact_phone')}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Médecin traitant" value={formData.doctor_name} onChange={handleChange('doctor_name')} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Téléphone médecin" value={formData.doctor_phone} onChange={handleChange('doctor_phone')} />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Notes médicales utiles"
                  placeholder="Informations importantes à signaler lors d'une consultation..."
                  value={formData.notes}
                  onChange={handleChange('notes')}
                />
              </Grid>
            </Grid>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 3, gap: 1, flexWrap: 'wrap' }}>
              <Chip
                label={formData.updated_at ? `Dernière mise à jour: ${new Date(formData.updated_at).toLocaleString('fr-FR')}` : 'Pas encore enregistrée'}
                size="small"
                variant="outlined"
              />
              <Button variant="contained" startIcon={<Save />} onClick={handleSave}>
                Enregistrer ma fiche
              </Button>
            </Box>
          </Paper>
        </motion.div>
      </Container>
    </Box>
  )
}

export default MedicalProfilePage
