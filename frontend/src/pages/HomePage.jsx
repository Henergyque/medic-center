import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Alert,
  IconButton,
  Chip,
} from '@mui/material'
import {
  LocalHospital,
  Chat,
  History,
  Add,
  ArrowForward,
  Phone,
} from '@mui/icons-material'
import { motion } from 'framer-motion'
import { useSymptom } from '../context/SymptomContext'

const HomePage = () => {
  const navigate = useNavigate()
  const { symptoms, statistics } = useSymptom()

  return (
    <Box sx={{ minHeight: '100vh', pb: 2 }}>
      {/* Hero section avec gradient */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a78bfa 100%)',
          color: 'white',
          pt: { xs: 4, sm: 5 },
          pb: { xs: 5, sm: 6 },
          px: 2,
          borderRadius: '0 0 32px 32px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Cercles décoratifs d'arrière-plan */}
        <Box sx={{
          position: 'absolute', top: -60, right: -60,
          width: 200, height: 200, borderRadius: '50%',
          background: 'rgba(255,255,255,0.08)',
        }} />
        <Box sx={{
          position: 'absolute', bottom: -40, left: -40,
          width: 150, height: 150, borderRadius: '50%',
          background: 'rgba(255,255,255,0.06)',
        }} />

        <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1 }}>
          <motion.div
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                mb: 1,
                fontSize: { xs: '1.5rem', sm: '2rem' },
              }}
            >
              Bonjour 👋
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.85, maxWidth: 450 }}>
              Suivez vos symptômes et obtenez des recommandations personnalisées grâce à l'IA
            </Typography>
          </motion.div>

          {/* Quick stats dans le hero */}
          {symptoms.length > 0 && statistics && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
            >
              <Box sx={{
                display: 'flex', gap: 2, mt: 3, flexWrap: 'wrap',
              }}>
                <Box sx={{
                  background: 'rgba(255,255,255,0.15)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: 3, px: 2.5, py: 1.5,
                }}>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {statistics.totalEntries}
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>
                    symptômes
                  </Typography>
                </Box>
                <Box sx={{
                  background: 'rgba(255,255,255,0.15)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: 3, px: 2.5, py: 1.5,
                }}>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {statistics.averageIntensity}
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>
                    intensité moy.
                  </Typography>
                </Box>
                <Box sx={{
                  background: 'rgba(255,255,255,0.15)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: 3, px: 2.5, py: 1.5,
                }}>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {statistics.trend === 'improving' ? '📉' :
                     statistics.trend === 'worsening' ? '📈' : '➡️'}
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>
                    {statistics.trend === 'improving' ? 'amélioration' :
                     statistics.trend === 'worsening' ? 'aggravation' : 'stable'}
                  </Typography>
                </Box>
              </Box>
            </motion.div>
          )}
        </Container>
      </Box>

      <Container maxWidth="md" sx={{ mt: -3, position: 'relative', zIndex: 2 }}>
        {/* Action principale */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          <Card
            onClick={() => navigate('/symptom-input')}
            sx={{
              mb: 2,
              cursor: 'pointer',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: 'white',
              transition: 'transform 0.2s',
              '&:hover': { transform: 'translateY(-2px)' },
            }}
          >
            <CardContent sx={{
              display: 'flex', alignItems: 'center',
              py: '20px !important', px: 3,
            }}>
              <Box sx={{
                width: 48, height: 48, borderRadius: 3,
                background: 'rgba(255,255,255,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                mr: 2,
              }}>
                <Add sx={{ fontSize: 28 }} />
              </Box>
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: 'white' }}>
                  Nouveau symptôme
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.85 }}>
                  Enregistrer et analyser
                </Typography>
              </Box>
              <ArrowForward sx={{ opacity: 0.7 }} />
            </CardContent>
          </Card>
        </motion.div>

        {/* Actions secondaires côte à côte */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <motion.div
            style={{ flex: 1 }}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}
          >
            <Card
              onClick={() => navigate('/chat')}
              sx={{
                cursor: 'pointer',
                transition: 'transform 0.2s',
                '&:hover': { transform: 'translateY(-2px)' },
              }}
            >
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <Box sx={{
                  width: 56, height: 56, borderRadius: 3,
                  background: 'linear-gradient(135deg, #06b6d4, #0891b2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  mx: 'auto', mb: 1.5,
                }}>
                  <Chat sx={{ color: 'white', fontSize: 28 }} />
                </Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Chat IA
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Poser une question
                </Typography>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            style={{ flex: 1 }}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.45, duration: 0.4 }}
          >
            <Card
              onClick={() => navigate('/history')}
              sx={{
                cursor: 'pointer',
                transition: 'transform 0.2s',
                '&:hover': { transform: 'translateY(-2px)' },
              }}
            >
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <Box sx={{
                  width: 56, height: 56, borderRadius: 3,
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  mx: 'auto', mb: 1.5,
                }}>
                  <History sx={{ color: 'white', fontSize: 28 }} />
                </Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Historique
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Consulter le suivi
                </Typography>
              </CardContent>
            </Card>
          </motion.div>
        </Box>

        {/* Avertissement compact */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.4 }}
        >
          <Alert
            severity="info"
            variant="outlined"
            sx={{
              mb: 2,
              borderRadius: 3,
              '& .MuiAlert-message': { fontSize: '0.82rem' },
            }}
          >
            Cette application ne remplace pas un avis médical. En cas d'urgence, appelez le <strong>15</strong> ou le <strong>112</strong>.
          </Alert>
        </motion.div>

        {/* Urgences - bande compacte */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.4 }}
        >
          <Box sx={{
            display: 'flex', gap: 1, flexWrap: 'wrap',
          }}>
            <Chip
              icon={<Phone sx={{ fontSize: 16 }} />}
              label="SAMU : 15"
              variant="outlined"
              color="error"
              size="small"
              component="a" href="tel:15"
              clickable
            />
            <Chip
              icon={<Phone sx={{ fontSize: 16 }} />}
              label="Urgences : 112"
              variant="outlined"
              color="error"
              size="small"
              component="a" href="tel:112"
              clickable
            />
            <Chip
              icon={<Phone sx={{ fontSize: 16 }} />}
              label="Pompiers : 18"
              variant="outlined"
              color="error"
              size="small"
              component="a" href="tel:18"
              clickable
            />
          </Box>
        </motion.div>
      </Container>
    </Box>
  )
}

export default HomePage
