import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { 
  BottomNavigation as MuiBottomNavigation, 
  BottomNavigationAction,
  Paper 
} from '@mui/material'
import {
  Home,
  AddCircle,
  Chat,
  History,
} from '@mui/icons-material'

const BottomNavigation = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const getActiveTab = () => {
    const path = location.pathname
    if (path === '/') return 0
    if (path === '/symptom-input') return 1
    if (path === '/chat') return 2
    if (path === '/history') return 3
    return 0
  }

  return (
    <Paper
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        pb: 'env(safe-area-inset-bottom)',
      }}
      elevation={3}
    >
      <MuiBottomNavigation
        value={getActiveTab()}
        onChange={(event, newValue) => {
          const paths = ['/', '/symptom-input', '/chat', '/history']
          navigate(paths[newValue])
        }}
        showLabels
      >
        <BottomNavigationAction 
          label="Accueil" 
          icon={<Home />}
        />
        <BottomNavigationAction 
          label="Symptôme" 
          icon={<AddCircle />}
        />
        <BottomNavigationAction 
          label="Chat IA" 
          icon={<Chat />}
        />
        <BottomNavigationAction 
          label="Historique" 
          icon={<History />}
        />
      </MuiBottomNavigation>
    </Paper>
  )
}

export default BottomNavigation
