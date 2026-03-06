import localforage from 'localforage'

// Configuration de localforage
localforage.config({
  name: 'SymptomChecker',
  version: 1.0,
  storeName: 'symptom_data',
  description: 'Stockage local des symptômes et historique'
})

// Clés de stockage
const KEYS = {
  SYMPTOMS: 'symptoms_history',
  CHAT_HISTORY: 'chat_history',
  NOTIFICATIONS: 'notification_settings',
  LAST_CHECK: 'last_symptom_check',
}

/**
 * Service de gestion du stockage local
 */
class StorageService {
  
  // === Gestion des symptômes ===
  
  async saveSymptom(symptom) {
    try {
      const symptoms = await this.getSymptoms()
      symptoms.push({
        ...symptom,
        id: Date.now(),
        timestamp: symptom.timestamp || new Date().toISOString()
      })
      await localforage.setItem(KEYS.SYMPTOMS, symptoms)
      return true
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du symptôme:', error)
      return false
    }
  }
  
  async getSymptoms() {
    try {
      const symptoms = await localforage.getItem(KEYS.SYMPTOMS)
      return symptoms || []
    } catch (error) {
      console.error('Erreur lors de la récupération des symptômes:', error)
      return []
    }
  }
  
  async updateSymptom(id, updates) {
    try {
      const symptoms = await this.getSymptoms()
      const index = symptoms.findIndex(s => s.id === id)
      if (index !== -1) {
        symptoms[index] = { ...symptoms[index], ...updates }
        await localforage.setItem(KEYS.SYMPTOMS, symptoms)
        return true
      }
      return false
    } catch (error) {
      console.error('Erreur lors de la mise à jour du symptôme:', error)
      return false
    }
  }
  
  async deleteSymptom(id) {
    try {
      const symptoms = await this.getSymptoms()
      const filtered = symptoms.filter(s => s.id !== id)
      await localforage.setItem(KEYS.SYMPTOMS, filtered)
      return true
    } catch (error) {
      console.error('Erreur lors de la suppression du symptôme:', error)
      return false
    }
  }
  
  async clearAllSymptoms() {
    try {
      await localforage.setItem(KEYS.SYMPTOMS, [])
      return true
    } catch (error) {
      console.error('Erreur lors de la suppression de tous les symptômes:', error)
      return false
    }
  }
  
  // === Gestion de l'historique de chat ===
  
  async saveChatMessage(message) {
    try {
      const history = await this.getChatHistory()
      history.push({
        ...message,
        id: Date.now(),
        timestamp: new Date().toISOString()
      })
      await localforage.setItem(KEYS.CHAT_HISTORY, history)
      return true
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du message:', error)
      return false
    }
  }
  
  async getChatHistory() {
    try {
      const history = await localforage.getItem(KEYS.CHAT_HISTORY)
      return history || []
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'historique:', error)
      return []
    }
  }
  
  async clearChatHistory() {
    try {
      await localforage.setItem(KEYS.CHAT_HISTORY, [])
      return true
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'historique:', error)
      return false
    }
  }
  
  // === Gestion des paramètres de notification ===
  
  async getNotificationSettings() {
    try {
      const settings = await localforage.getItem(KEYS.NOTIFICATIONS)
      return settings || {
        enabled: true,
        time: '09:00',
        lastNotification: null
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des paramètres:', error)
      return {
        enabled: true,
        time: '09:00',
        lastNotification: null
      }
    }
  }
  
  async updateNotificationSettings(settings) {
    try {
      const current = await this.getNotificationSettings()
      const updated = { ...current, ...settings }
      await localforage.setItem(KEYS.NOTIFICATIONS, updated)
      return true
    } catch (error) {
      console.error('Erreur lors de la mise à jour des paramètres:', error)
      return false
    }
  }
  
  async setLastNotificationTime() {
    try {
      const settings = await this.getNotificationSettings()
      settings.lastNotification = new Date().toISOString()
      await localforage.setItem(KEYS.NOTIFICATIONS, settings)
      return true
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la dernière notification:', error)
      return false
    }
  }
  
  // === Gestion du dernier check ===
  
  async setLastCheck() {
    try {
      await localforage.setItem(KEYS.LAST_CHECK, new Date().toISOString())
      return true
    } catch (error) {
      console.error('Erreur lors de la mise à jour du dernier check:', error)
      return false
    }
  }
  
  async getLastCheck() {
    try {
      const lastCheck = await localforage.getItem(KEYS.LAST_CHECK)
      return lastCheck
    } catch (error) {
      console.error('Erreur lors de la récupération du dernier check:', error)
      return null
    }
  }
  
  // === Export de données ===
  
  async exportAllData() {
    try {
      const symptoms = await this.getSymptoms()
      const chatHistory = await this.getChatHistory()
      const notifications = await this.getNotificationSettings()
      
      return {
        symptoms,
        chatHistory,
        notifications,
        exportDate: new Date().toISOString()
      }
    } catch (error) {
      console.error('Erreur lors de l\'export des données:', error)
      return null
    }
  }
  
  // === Statistiques ===
  
  async getStatistics() {
    try {
      const symptoms = await this.getSymptoms()
      
      if (symptoms.length === 0) {
        return {
          totalEntries: 0,
          averageIntensity: 0,
          mostCommonBodyPart: null,
          trend: 'insufficient_data'
        }
      }
      
      // Calcul des statistiques
      const totalEntries = symptoms.length
      const avgIntensity = symptoms.reduce((sum, s) => sum + (s.intensity || 0), 0) / totalEntries
      
      // Zone corporelle la plus fréquente
      const bodyPartCounts = {}
      symptoms.forEach(s => {
        if (s.body_part) {
          bodyPartCounts[s.body_part] = (bodyPartCounts[s.body_part] || 0) + 1
        }
      })
      const mostCommonBodyPart = Object.keys(bodyPartCounts).length > 0
        ? Object.keys(bodyPartCounts).reduce((a, b) => 
            bodyPartCounts[a] > bodyPartCounts[b] ? a : b
          )
        : null
      
      // Tendance (simplifiée)
      let trend = 'stable'
      if (symptoms.length >= 2) {
        const recent = symptoms.slice(-3)
        const older = symptoms.slice(0, 3)
        const recentAvg = recent.reduce((sum, s) => sum + (s.intensity || 0), 0) / recent.length
        const olderAvg = older.reduce((sum, s) => sum + (s.intensity || 0), 0) / older.length
        
        if (recentAvg > olderAvg + 1) trend = 'worsening'
        else if (recentAvg < olderAvg - 1) trend = 'improving'
      }
      
      return {
        totalEntries,
        averageIntensity: avgIntensity.toFixed(1),
        mostCommonBodyPart,
        trend
      }
    } catch (error) {
      console.error('Erreur lors du calcul des statistiques:', error)
      return null
    }
  }
}

export default new StorageService()
