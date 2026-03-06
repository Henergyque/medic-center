import axios from 'axios'

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (window.location.hostname === 'localhost' ? 'http://localhost:8000' : '')

// Configuration axios
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 secondes
})

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const extractErrorMessage = (error) => {
  const status = error?.response?.status
  if (status === 503) {
    return 'Serveur temporairement saturé (503). Réessayez dans quelques secondes.'
  }
  return error.response?.data?.detail || 'Erreur de connexion au serveur'
}

const requestWithRetry = async (requestFn, retries = 1, retryDelayMs = 900) => {
  let lastError
  for (let i = 0; i <= retries; i += 1) {
    try {
      return await requestFn()
    } catch (error) {
      lastError = error
      const status = error?.response?.status
      const shouldRetry = i < retries && (status === 503 || !status)
      if (!shouldRetry) break
      await sleep(retryDelayMs)
    }
  }
  throw lastError
}

/**
 * Service de communication avec l'API backend
 */
class ApiService {
  
  // === Analyse des symptômes ===
  
  async analyzeSymptoms(symptoms, userContext = null) {
    try {
      const response = await requestWithRetry(
        () => apiClient.post('/api/analyze-symptoms', {
          symptoms,
          user_context: userContext
        }),
        1
      )
      return { success: true, data: response.data }
    } catch (error) {
      console.error('Erreur lors de l\'analyse des symptômes:', error)
      return { 
        success: false, 
        error: extractErrorMessage(error)
      }
    }
  }
  
  // === Chat conversationnel avec Claude ===
  
  async sendChatMessage(message, history = [], symptomContext = null) {
    try {
      const response = await requestWithRetry(
        () => apiClient.post('/api/chat', {
          message,
          history,
          symptom_context: symptomContext
        }),
        1
      )
      return { success: true, data: response.data }
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error)
      return { 
        success: false, 
        error: extractErrorMessage(error)
      }
    }
  }
  
  // === Analyse de l'évolution temporelle ===
  
  async analyzeTemporalEvolution(symptoms) {
    try {
      const response = await requestWithRetry(
        () => apiClient.post('/api/analyze-temporal-evolution', {
          symptoms
        }),
        1
      )
      return { success: true, data: response.data }
    } catch (error) {
      console.error('Erreur lors de l\'analyse temporelle:', error)
      return { 
        success: false, 
        error: extractErrorMessage(error)
      }
    }
  }
  
  // === Génération de PDF médical ===
  
  async generatePDF(symptomData) {
    try {
      const response = await apiClient.post('/api/generate-pdf', symptomData, {
        responseType: 'blob'
      })
      
      // Créer un blob et télécharger le fichier
      const blob = new Blob([response.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `rapport_medical_${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      return { success: true }
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error)
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Erreur lors de la génération du PDF' 
      }
    }
  }
  
  // === Vérification de la santé de l'API ===
  
  async checkHealth() {
    try {
      const response = await apiClient.get('/')
      return { success: true, data: response.data }
    } catch (error) {
      console.error('Erreur lors de la vérification de l\'API:', error)
      return { success: false, error: 'API non disponible' }
    }
  }
}

export default new ApiService()
