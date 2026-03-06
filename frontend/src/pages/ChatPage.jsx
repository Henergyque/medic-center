import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Container,
  Typography,
  TextField,
  IconButton,
  Avatar,
  CircularProgress,
  Alert,
  Chip,
} from '@mui/material'
import {
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

  useEffect(() => {
    loadChatHistory()
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const loadChatHistory = async () => {
    const history = await storageService.getChatHistory()
    if (history.length > 0) {
      setMessages(history)
    } else {
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
      await storageService.saveChatMessage(userMessage)

      const symptomContext = symptoms.length > 0 ? {
        symptoms: symptoms.slice(-5)
      } : null

      const chatHistory = messages.map(m => ({
        role: m.role,
        content: m.content
      }))

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
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <Box sx={{ height: { xs: 'calc(100vh - 56px)', sm: 'calc(100vh - 64px)' }, display: 'flex', flexDirection: 'column' }}>
      {/* Header gradient cyan unique au chat */}
      <Box sx={{
        background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
        color: 'white',
        p: 2,
        display: 'flex',
        alignItems: 'center',
      }}>
        <Box sx={{
          width: 40, height: 40, borderRadius: 2.5,
          background: 'rgba(255,255,255,0.2)',
          backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          mr: 1.5,
        }}>
          <SmartToy sx={{ fontSize: 22 }} />
        </Box>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
            Assistant Médical
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.8 }}>
            Claude AI · En ligne
          </Typography>
        </Box>
        {symptoms.length > 0 && (
          <Chip
            label={`${symptoms.length}`}
            size="small"
            sx={{
              bgcolor: 'rgba(255,255,255,0.2)',
              color: 'white',
              fontWeight: 700,
              display: { xs: 'none', sm: 'inline-flex' },
            }}
          />
        )}
      </Box>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ m: 1.5, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {/* Zone de messages */}
      <Box sx={{
        flexGrow: 1,
        overflow: 'auto',
        p: { xs: 1.5, sm: 2 },
        bgcolor: '#f0f2f5',
      }}>
        <Container maxWidth="md">
          {messages.map((message, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              <Box sx={{
                display: 'flex',
                justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
                mb: 1.5,
              }}>
                <Box sx={{
                  display: 'flex',
                  flexDirection: message.role === 'user' ? 'row-reverse' : 'row',
                  alignItems: 'flex-end',
                  maxWidth: { xs: '90%', sm: '75%' },
                  gap: 1,
                }}>
                  <Avatar
                    sx={{
                      width: 32, height: 32,
                      bgcolor: message.role === 'user' ? '#6366f1' : '#06b6d4',
                      fontSize: '0.9rem',
                    }}
                  >
                    {message.role === 'user' ? <Person sx={{ fontSize: 18 }} /> : <SmartToy sx={{ fontSize: 18 }} />}
                  </Avatar>
                  <Box sx={{
                    p: 2,
                    borderRadius: message.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    bgcolor: message.role === 'user' ? '#6366f1' : 'white',
                    color: message.role === 'user' ? 'white' : 'text.primary',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
                  }}>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.6 }}>
                      {message.content}
                    </Typography>
                    <Typography variant="caption" sx={{
                      display: 'block', mt: 0.5, textAlign: 'right',
                      opacity: 0.5, fontSize: '0.7rem',
                    }}>
                      {formatTime(message.timestamp)}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </motion.div>
          ))}

          {loading && (
            <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1, mb: 1.5 }}>
              <Avatar sx={{ width: 32, height: 32, bgcolor: '#06b6d4' }}>
                <SmartToy sx={{ fontSize: 18 }} />
              </Avatar>
              <Box sx={{
                px: 2.5, py: 1.5,
                borderRadius: '16px 16px 16px 4px',
                bgcolor: 'white',
                boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
              }}>
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  {[0, 1, 2].map(i => (
                    <motion.div
                      key={i}
                      animate={{ y: [0, -6, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                    >
                      <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: '#06b6d4' }} />
                    </motion.div>
                  ))}
                </Box>
              </Box>
            </Box>
          )}

          <div ref={messagesEndRef} />
        </Container>
      </Box>

      {/* Zone de saisie modernisée */}
      <Box sx={{
        p: { xs: 1, sm: 1.5 },
        pb: 'max(env(safe-area-inset-bottom), 8px)',
        bgcolor: 'white',
        borderTop: '1px solid rgba(0,0,0,0.06)',
      }}>
        <Container maxWidth="md">
          <Box sx={{
            display: 'flex', alignItems: 'flex-end',
            bgcolor: '#f0f2f5', borderRadius: 3,
            px: 1.5, py: 0.5,
          }}>
            <TextField
              fullWidth
              multiline
              maxRows={4}
              placeholder="Posez votre question..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading}
              variant="standard"
              InputProps={{ disableUnderline: true }}
              sx={{ mr: 1 }}
            />
            <IconButton
              onClick={handleSend}
              disabled={!input.trim() || loading}
              sx={{
                width: 40, height: 40,
                bgcolor: input.trim() ? '#6366f1' : 'transparent',
                color: input.trim() ? 'white' : 'text.disabled',
                '&:hover': { bgcolor: '#4f46e5', color: 'white' },
                transition: 'all 0.2s',
                mb: 0.5,
              }}
            >
              <Send sx={{ fontSize: 20 }} />
            </IconButton>
          </Box>
        </Container>
      </Box>
    </Box>
  )
}

export default ChatPage
