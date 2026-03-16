import React, { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Box } from '@mui/material'
import HomePage from './pages/HomePage'
import SymptomInputPage from './pages/SymptomInputPage'
import ChatPage from './pages/ChatPage'
import HistoryPage from './pages/HistoryPage'
import MedicalProfilePage from './pages/MedicalProfilePage'
import DocumentsPage from './pages/DocumentsPage'
import BottomNavigation from './components/BottomNavigation'
import NotificationManager from './components/NotificationManager'
import { SymptomProvider } from './context/SymptomContext'

function App() {
  const [showNotification, setShowNotification] = useState(false)

  useEffect(() => {
    // Demander la permission pour les notifications
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  return (
    <SymptomProvider>
      <Box 
        sx={{ 
          minHeight: '100vh',
          pb: 8, // Padding bottom pour la navigation
          bgcolor: 'background.default'
        }}
      >
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/symptom-input" element={<SymptomInputPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/medical-profile" element={<MedicalProfilePage />} />
          <Route path="/documents" element={<DocumentsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        
        <BottomNavigation />
        <NotificationManager />
      </Box>
    </SymptomProvider>
  )
}

export default App
