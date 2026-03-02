import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Container,
  Typography,
  Paper,
  TextField,
  IconButton,
  Avatar,
  CircularProgress,
  Alert,
  Chip,
} from '@mui/material'
import {
  ArrowBack,
  Send,
  SmartToy,
  Person,
} from '@mui/icons-material'
import { motion } from 'framer-motion'
import { useSymptom } from '../context/SymptomContext'
import apiService from '../services/apiService'
import storageService from '../services/storageService'

const ChatPage = () => {
  const navigate = useNavigate()
  const { symptoms } = useSymptom()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const messagesEndRef = useRef(null)

  // Charger l'historique au démarrage
  useEffect(() => {
    loadChatHistory()
  }, [])

  // Auto-scroll vers le bas
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const loadChatHistory = async () => {
    const history = await storageService.getChatHistory()
    if (history.length > 0) {
      setMessages(history)
    } else {
      // Message de bienvenue
      setMessages([{
        role: 'assistant',
        content: 'Bonjour ! Je suis votre assistant médical virtuel alimenté par Claude AI. Je peux vous aider à comprendre vos symptômes et répondre à vos questions médicales. Comment puis-je vous aider aujourd\'hui ?',
        timestamp: new Date().toISOString()
      }])
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSend = async () => {
    if (!input.trim()) return

    const userMessage = {
      role: 'user',
      content: input,
      timestamp: new Date().toISOString()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)
    setError(null)

    try {
      // Sauvegarder le message de l'utilisateur
      await storageService.saveChatMessage(userMessage)

      // Préparer le contexte des symptômes
      const symptomContext = symptoms.length > 0 ? {
        symptoms: symptoms.slice(-5) // Derniers 5 symptômes
      } : null

      // Préparer l'historique pour Claude
      const chatHistory = messages.map(m => ({
        role: m.role,
        content: m.content
      }))

      // Envoyer le message à Claude
      const response = await apiService.sendChatMessage(
        input,
        chatHistory,
        symptomContext
      )

      if (response.success) {
        const assistantMessage = {
          role: 'assistant',
          content: response.data.response,
          timestamp: response.data.timestamp
        }

        setMessages(prev => [...prev, assistantMessage])
        await storageService.saveChatMessage(assistantMessage)
      } else {
        setError(response.error || 'Erreur lors de la communication avec l\'IA')
      }
    } catch (err) {
      console.error('Erreur:', err)
      setError('Une erreur est survenue lors de l\'envoi du message')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  return (
    <Box sx={{ height: { xs: 'calc(100vh - 56px)', sm: 'calc(100vh - 64px)' }, display: 'flex', flexDirection: 'column' }}>
      {/* En-tête */}
      <Paper 
        elevation={2}
        sx={{ 
          p: 2,
          display: 'flex',
          alignItems: 'center',
          borderRadius: 0,
        }}
      >
        <IconButton onClick={() => navigate('/')} sx={{ mr: 2 }}>
          <ArrowBack />
        </IconButton>
        <SmartToy sx={{ mr: 1, color: 'primary.main' }} />
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
            Assistant Médical IA
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Alimenté par Claude AI
          </Typography>
        </Box>
        {symptoms.length > 0 && (
          <Chip 
            label={`${symptoms.length} symptôme${symptoms.length > 1 ? 's' : ''}`}
            size="small"
            color="primary"
            variant="outlined"
            sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
          />
        )}
      </Paper>

      {error && (
        <Alert 
          severity="error" 
          onClose={() => setError(null)}
          sx={{ m: 2 }}
        >
          {error}
        </Alert>
      )}

      {/* Zone de messages */}
      <Box 
        sx={{ 
          flexGrow: 1, 
          overflow: 'auto',
          p: { xs: 1, sm: 2 },
          bgcolor: 'background.default',
        }}
      >
        <Container maxWidth="md">
          {messages.map((message, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
                  mb: 2,
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: message.role === 'user' ? 'row-reverse' : 'row',
                    alignItems: 'flex-start',
                    maxWidth: { xs: '95%', sm: '80%' },
                  }}
                >
                  <Avatar
                    sx={{
                      bgcolor: message.role === 'user' ? 'primary.main' : 'secondary.main',
                      mx: 1,
                    }}
                  >
                    {message.role === 'user' ? <Person /> : <SmartToy />}
                  </Avatar>
                  <Paper
                    elevation={1}
                    sx={{
                      p: 2,
                      bgcolor: message.role === 'user' ? 'primary.light' : 'white',
                      color: message.role === 'user' ? 'white' : 'text.primary',
                      borderRadius: 2,
                    }}
                  >
                    <Typography 
                      variant="body1" 
                      sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
                    >
                      {message.content}
                    </Typography>
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        display: 'block', 
                        mt: 1,
                        opacity: 0.7
                      }}
                    >
                      {formatTime(message.timestamp)}
                    </Typography>
                  </Paper>
                </Box>
              </Box>
            </motion.div>
          ))}
          
          {loading && (
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Avatar sx={{ bgcolor: 'secondary.main', mr: 1 }}>
                <SmartToy />
              </Avatar>
              <Paper elevation={1} sx={{ p: 2 }}>
                <CircularProgress size={20} sx={{ mr: 1 }} />
                <Typography variant="body2" component="span">
                  L'IA réfléchit...
                </Typography>
              </Paper>
            </Box>
          )}
          
          <div ref={messagesEndRef} />
        </Container>
      </Box>

      {/* Zone de saisie */}
      <Paper 
        elevation={3}
        sx={{ 
          p: { xs: 1, sm: 2 },
          pb: 'max(env(safe-area-inset-bottom), 8px)',
          borderRadius: 0,
        }}
      >
        <Container maxWidth="md">
          <Box sx={{ display: 'flex', alignItems: 'flex-end' }}>
            <TextField
              fullWidth
              multiline
              maxRows={4}
              placeholder="Posez votre question..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading}
              variant="outlined"
              sx={{ mr: 1 }}
            />
            <IconButton
              color="primary"
              onClick={handleSend}
              disabled={!input.trim() || loading}
              sx={{
                bgcolor: 'primary.main',
                color: 'white',
                '&:hover': {
                  bgcolor: 'primary.dark',
                },
                '&:disabled': {
                  bgcolor: 'action.disabledBackground',
                },
              }}
            >
              <Send />
            </IconButton>
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
            Cette IA ne remplace pas un avis médical professionnel. En cas d'urgence, appelez le 15.
          </Typography>
        </Container>
      </Paper>
    </Box>
  )
}

export default ChatPage
