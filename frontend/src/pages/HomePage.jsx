import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Alert,
  AlertTitle,
} from '@mui/material'
import {
  LocalHospital,
  Chat,
  History,
  Warning,
} from '@mui/icons-material'
import { motion } from 'framer-motion'
import { useSymptom } from '../context/SymptomContext'

const HomePage = () => {
  const navigate = useNavigate()
  const { symptoms, statistics } = useSymptom()

  const features = [
    {
      icon: <LocalHospital sx={{ fontSize: 48, color: 'primary.main' }} />,
      title: 'Enregistrer des symptômes',
      description: 'Décrivez vos symptômes et suivez leur évolution',
      action: () => navigate('/symptom-input'),
      color: '#1976d2',
    },
    {
      icon: <Chat sx={{ fontSize: 48, color: 'secondary.main' }} />,
      title: 'Discuter avec l\'IA',
      description: 'Posez des questions et obtenez des explications',
      action: () => navigate('/chat'),
      color: '#00bcd4',
    },
    {
      icon: <History sx={{ fontSize: 48, color: 'success.main' }} />,
      title: 'Voir l\'historique',
      description: 'Consultez votre suivi et exportez en PDF',
      action: () => navigate('/history'),
      color: '#4caf50',
    },
  ]

  return (
    <Box sx={{ minHeight: '100vh', py: { xs: 2, sm: 3 } }}>
      <Container maxWidth="md">
        {/* En-tête */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <LocalHospital 
              sx={{ 
                fontSize: 64, 
                color: 'primary.main',
                mb: 2 
              }} 
            />
            <Typography 
              variant="h3" 
              component="h1" 
              gutterBottom
              sx={{ fontWeight: 600, fontSize: { xs: '1.75rem', sm: '2.5rem' } }}
            >
              Vérificateur de Symptômes
            </Typography>
            <Typography 
              variant="body1" 
              color="text.secondary"
              sx={{ maxWidth: 600, mx: 'auto' }}
            >
              Suivez vos symptômes, discutez avec notre IA médicale, 
              et obtenez des recommandations basées sur des sources officielles
            </Typography>
          </Box>
        </motion.div>

        {/* Alerte disclaimer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <Alert severity="warning" sx={{ mb: 4 }}>
            <AlertTitle>Avertissement Important</AlertTitle>
            Cette application ne remplace pas un avis médical professionnel. 
            En cas d'urgence, appelez le <strong>15</strong> (SAMU) ou le <strong>112</strong>.
          </Alert>
        </motion.div>

        {/* Statistiques rapides */}
        {symptoms.length > 0 && statistics && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <Card sx={{ mb: 4, bgcolor: 'primary.light', color: 'white' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Votre Suivi
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="h4">{statistics.totalEntries}</Typography>
                    <Typography variant="body2">Entrées</Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="h4">{statistics.averageIntensity}</Typography>
                    <Typography variant="body2">Intensité moy.</Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="h4">
                      {statistics.trend === 'improving' ? '📉' : 
                       statistics.trend === 'worsening' ? '📈' : '➡️'}
                    </Typography>
                    <Typography variant="body2">
                      {statistics.trend === 'improving' ? 'Amélioration' :
                       statistics.trend === 'worsening' ? 'Aggravation' : 'Stable'}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Fonctionnalités principales */}
        <Grid container spacing={3}>
          {features.map((feature, index) => (
            <Grid item xs={12} md={4} key={index}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.1, duration: 0.5 }}
              >
                <Card 
                  sx={{ 
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: 4,
                    }
                  }}
                  onClick={feature.action}
                >
                  <CardContent sx={{ flexGrow: 1, textAlign: 'center', p: 3 }}>
                    <Box sx={{ mb: 2 }}>
                      {feature.icon}
                    </Box>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                      {feature.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {feature.description}
                    </Typography>
                  </CardContent>
                  <Box sx={{ p: 2, pt: 0 }}>
                    <Button 
                      fullWidth 
                      variant="contained"
                      sx={{ 
                        bgcolor: feature.color,
                        '&:hover': {
                          bgcolor: feature.color,
                          filter: 'brightness(0.9)',
                        }
                      }}
                    >
                      Commencer
                    </Button>
                  </Box>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>

        {/* Numéros d'urgence */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
        >
          <Card sx={{ mt: 4, bgcolor: 'error.light' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Warning sx={{ color: 'error.dark', mr: 1 }} />
                <Typography variant="h6" sx={{ color: 'error.dark' }}>
                  Numéros d'Urgence
                </Typography>
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" sx={{ color: 'error.dark' }}>
                    <strong>SAMU:</strong> 15
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" sx={{ color: 'error.dark' }}>
                    <strong>Urgences EU:</strong> 112
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" sx={{ color: 'error.dark' }}>
                    <strong>Pompiers:</strong> 18
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" sx={{ color: 'error.dark' }}>
                    <strong>Antipoison:</strong> Consulter en ligne
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </motion.div>
      </Container>
    </Box>
  )
}

export default HomePage
