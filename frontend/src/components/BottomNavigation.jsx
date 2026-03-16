import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Box, Typography } from '@mui/material'
import {
  Home,
  AddCircle,
  Chat,
  History,
  Description,
  PictureAsPdf,
} from '@mui/icons-material'

const tabs = [
  { path: '/', label: 'Accueil', icon: Home, color: '#6366f1' },
  { path: '/symptom-input', label: 'Symptôme', icon: AddCircle, color: '#10b981' },
  { path: '/chat', label: 'Chat IA', icon: Chat, color: '#06b6d4' },
  { path: '/history', label: 'Historique', icon: History, color: '#f59e0b' },
  { path: '/documents', label: 'Documents', icon: PictureAsPdf, color: '#ef4444' },
  { path: '/medical-profile', label: 'Fiche', icon: Description, color: '#0284c7' },
]

const BottomNavigation = () => {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        bgcolor: 'white',
        borderTop: '1px solid rgba(0,0,0,0.06)',
        display: 'flex',
        pb: 'env(safe-area-inset-bottom)',
        boxShadow: '0 -2px 10px rgba(0,0,0,0.04)',
      }}
    >
      {tabs.map((tab) => {
        const isActive = location.pathname === tab.path
        const Icon = tab.icon

        return (
          <Box
            key={tab.path}
            onClick={() => navigate(tab.path)}
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              py: 1,
              cursor: 'pointer',
              transition: 'all 0.2s',
              position: 'relative',
              '&:active': { transform: 'scale(0.92)' },
            }}
          >
            {/* Indicator pill */}
            {isActive && (
              <Box sx={{
                position: 'absolute',
                top: 0,
                width: 24,
                height: 3,
                borderRadius: '0 0 3px 3px',
                bgcolor: tab.color,
              }} />
            )}
            <Icon sx={{
              fontSize: 24,
              color: isActive ? tab.color : '#a1a1aa',
              transition: 'color 0.2s',
              mb: 0.2,
            }} />
            <Typography sx={{
              fontSize: '0.65rem',
              fontWeight: isActive ? 700 : 500,
              color: isActive ? tab.color : '#a1a1aa',
              transition: 'color 0.2s',
            }}>
              {tab.label}
            </Typography>
          </Box>
        )
      })}
    </Box>
  )
}

export default BottomNavigation
