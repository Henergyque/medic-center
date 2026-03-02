import React, { useEffect, useState } from 'react'
import { Snackbar, Alert, Button } from '@mui/material'
import { Notifications } from '@mui/icons-material'
import storageService from '../services/storageService'

const NotificationManager = () => {
  const [showPermission, setShowPermission] = useState(false)
  const [lastCheck, setLastCheck] = useState(null)

  useEffect(() => {
    initNotifications()
    checkDailyReminder()
  }, [])

  const initNotifications = async () => {
    // Vérifier si les notifications sont supportées
    if (!('Notification' in window)) {
      console.log('Les notifications ne sont pas supportées')
      return
    }

    // Demander la permission si nécessaire
    if (Notification.permission === 'default') {
      setShowPermission(true)
    } else if (Notification.permission === 'granted') {
      setupDailyNotification()
    }
  }

  const requestPermission = async () => {
    const permission = await Notification.requestPermission()
    setShowPermission(false)
    
    if (permission === 'granted') {
      setupDailyNotification()
      showTestNotification()
    }
  }

  const setupDailyNotification = async () => {
    const settings = await storageService.getNotificationSettings()
    
    if (!settings.enabled) return

    // Calculer le temps jusqu'à la prochaine notification
    const now = new Date()
    const [hours, minutes] = settings.time.split(':')
    const scheduledTime = new Date()
    scheduledTime.setHours(parseInt(hours), parseInt(minutes), 0, 0)

    // Si l'heure est déjà passée aujourd'hui, planifier pour demain
    if (scheduledTime <= now) {
      scheduledTime.setDate(scheduledTime.getDate() + 1)
    }

    const timeUntilNotification = scheduledTime - now

    // Planifier la notification
    setTimeout(() => {
      sendDailyReminder()
      // Re-planifier pour le jour suivant
      setupDailyNotification()
    }, timeUntilNotification)
  }

  const checkDailyReminder = async () => {
    const settings = await storageService.getNotificationSettings()
    const lastCheckDate = await storageService.getLastCheck()
    
    if (!lastCheckDate) return

    const now = new Date()
    const lastCheck = new Date(lastCheckDate)
    const hoursSinceLastCheck = (now - lastCheck) / (1000 * 60 * 60)

    // Si plus de 20 heures depuis le dernier check, proposer de mettre à jour
    if (hoursSinceLastCheck >= 20 && Notification.permission === 'granted') {
      setLastCheck(lastCheck)
    }
  }

  const sendDailyReminder = () => {
    if (Notification.permission !== 'granted') return

    const notification = new Notification('Mise à jour de vos symptômes', {
      body: 'Comment vous sentez-vous aujourd\'hui ? Prenez un moment pour enregistrer vos symptômes.',
      icon: '/medical-icon.svg',
      badge: '/medical-icon.svg',
      tag: 'daily-reminder',
      requireInteraction: false,
      silent: false,
    })

    notification.onclick = () => {
      window.focus()
      window.location.href = '/symptom-input'
      notification.close()
    }

    // Enregistrer l'heure de la notification
    storageService.setLastNotificationTime()
  }

  const showTestNotification = () => {
    if (Notification.permission !== 'granted') return

    new Notification('Notifications activées', {
      body: 'Vous recevrez un rappel quotidien pour mettre à jour vos symptômes.',
      icon: '/medical-icon.svg',
    })
  }

  return (
    <>
      <Snackbar
        open={showPermission}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          severity="info"
          icon={<Notifications />}
          action={
            <Button color="inherit" size="small" onClick={requestPermission}>
              Activer
            </Button>
          }
        >
          Activez les notifications pour recevoir des rappels quotidiens
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!lastCheck}
        autoHideDuration={10000}
        onClose={() => setLastCheck(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity="info"
          onClose={() => setLastCheck(null)}
          action={
            <Button 
              color="inherit" 
              size="small" 
              onClick={() => {
                window.location.href = '/symptom-input'
                setLastCheck(null)
              }}
            >
              Mettre à jour
            </Button>
          }
        >
          Il est temps de mettre à jour vos symptômes
        </Alert>
      </Snackbar>
    </>
  )
}

export default NotificationManager
