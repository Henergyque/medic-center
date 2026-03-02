import React, { createContext, useContext, useState, useEffect } from 'react'
import storageService from '../services/storageService'

const SymptomContext = createContext()

export const useSymptom = () => {
  const context = useContext(SymptomContext)
  if (!context) {
    throw new Error('useSymptom must be used within a SymptomProvider')
  }
  return context
}

export const SymptomProvider = ({ children }) => {
  const [symptoms, setSymptoms] = useState([])
  const [loading, setLoading] = useState(true)
  const [statistics, setStatistics] = useState(null)

  // Charger les symptômes au démarrage
  useEffect(() => {
    loadSymptoms()
  }, [])

  // Charger les statistiques quand les symptômes changent
  useEffect(() => {
    if (symptoms.length > 0) {
      loadStatistics()
    }
  }, [symptoms])

  const loadSymptoms = async () => {
    setLoading(true)
    try {
      const data = await storageService.getSymptoms()
      setSymptoms(data)
    } catch (error) {
      console.error('Erreur lors du chargement des symptômes:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadStatistics = async () => {
    try {
      const stats = await storageService.getStatistics()
      setStatistics(stats)
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error)
    }
  }

  const addSymptom = async (symptom) => {
    try {
      const success = await storageService.saveSymptom(symptom)
      if (success) {
        await loadSymptoms()
        return { success: true }
      }
      return { success: false, error: 'Échec de la sauvegarde' }
    } catch (error) {
      console.error('Erreur lors de l\'ajout du symptôme:', error)
      return { success: false, error: error.message }
    }
  }

  const updateSymptom = async (id, updates) => {
    try {
      const success = await storageService.updateSymptom(id, updates)
      if (success) {
        await loadSymptoms()
        return { success: true }
      }
      return { success: false, error: 'Échec de la mise à jour' }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du symptôme:', error)
      return { success: false, error: error.message }
    }
  }

  const deleteSymptom = async (id) => {
    try {
      const success = await storageService.deleteSymptom(id)
      if (success) {
        await loadSymptoms()
        return { success: true }
      }
      return { success: false, error: 'Échec de la suppression' }
    } catch (error) {
      console.error('Erreur lors de la suppression du symptôme:', error)
      return { success: false, error: error.message }
    }
  }

  const clearAllSymptoms = async () => {
    try {
      const success = await storageService.clearAllSymptoms()
      if (success) {
        await loadSymptoms()
        return { success: true }
      }
      return { success: false, error: 'Échec de la suppression' }
    } catch (error) {
      console.error('Erreur lors de la suppression de tous les symptômes:', error)
      return { success: false, error: error.message }
    }
  }

  const exportData = async () => {
    try {
      return await storageService.exportAllData()
    } catch (error) {
      console.error('Erreur lors de l\'export des données:', error)
      return null
    }
  }

  const value = {
    symptoms,
    loading,
    statistics,
    addSymptom,
    updateSymptom,
    deleteSymptom,
    clearAllSymptoms,
    exportData,
    refreshSymptoms: loadSymptoms,
  }

  return (
    <SymptomContext.Provider value={value}>
      {children}
    </SymptomContext.Provider>
  )
}
