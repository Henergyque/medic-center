import React, { useState, useEffect, useRef } from 'react'
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  IconButton,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
} from '@mui/material'
import {
  CloudUpload,
  Delete,
  Visibility,
  AutoAwesome,
  PictureAsPdf,
  InsertDriveFile,
} from '@mui/icons-material'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import apiService from '../services/apiService'

const DocumentsPage = () => {
  const [documents, setDocuments] = useState([])
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [analyzing, setAnalyzing] = useState(null)
  const [analysis, setAnalysis] = useState(null)
  const [deleteDialog, setDeleteDialog] = useState(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    loadDocuments()
  }, [])

  const loadDocuments = async () => {
    setLoading(true)
    const result = await apiService.getDocuments()
    if (result.success) {
      setDocuments(result.data)
    }
    setLoading(false)
  }

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setError('Seuls les fichiers PDF sont acceptés.')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('Le fichier ne doit pas dépasser 10 Mo.')
      return
    }

    setUploading(true)
    setError(null)

    const result = await apiService.uploadDocument(file)
    if (result.success) {
      await loadDocuments()
    } else {
      setError(result.error)
    }

    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleDelete = async () => {
    if (!deleteDialog) return
    const result = await apiService.deleteDocument(deleteDialog.id)
    if (result.success) {
      setDocuments((prev) => prev.filter((d) => d.id !== deleteDialog.id))
      if (analysis && analysis.docId === deleteDialog.id) setAnalysis(null)
    } else {
      setError(result.error)
    }
    setDeleteDialog(null)
  }

  const handleAnalyze = async (doc) => {
    setAnalyzing(doc.id)
    setAnalysis(null)
    const result = await apiService.analyzeDocument(doc.id)
    if (result.success) {
      setAnalysis({ ...result.data, docId: doc.id })
    } else {
      setError(result.error)
    }
    setAnalyzing(null)
  }

  const handleView = (doc) => {
    window.open(apiService.getDocumentUrl(doc.id), '_blank', 'noopener')
  }

  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'PPp', { locale: fr })
    } catch {
      return 'Date invalide'
    }
  }

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} o`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`
    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
  }

  return (
    <Box sx={{ minHeight: '100vh', pb: 2 }}>
      {/* Header gradient rouge/rose unique aux documents */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)',
          color: 'white',
          pt: { xs: 3, sm: 4 },
          pb: { xs: 4, sm: 5 },
          px: 2,
          borderRadius: '0 0 32px 32px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            position: 'absolute', top: -30, right: -30,
            width: 120, height: 120, borderRadius: '50%',
            background: 'rgba(255,255,255,0.1)',
          }}
        />
        <Container maxWidth="md">
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
            Mes documents
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.85 }}>
            Importez vos PDF médicaux pour les analyser avec l'IA
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="md" sx={{ mt: -3, position: 'relative', zIndex: 2 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Zone d'upload */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Paper
            onClick={() => !uploading && fileInputRef.current?.click()}
            sx={{
              p: 4,
              mb: 3,
              textAlign: 'center',
              cursor: uploading ? 'default' : 'pointer',
              border: '2px dashed',
              borderColor: 'divider',
              transition: 'all 0.2s',
              '&:hover': { borderColor: 'primary.main', bgcolor: '#f8f9ff' },
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              hidden
              onChange={handleFileSelect}
            />
            {uploading ? (
              <>
                <CircularProgress size={40} sx={{ mb: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  Envoi en cours...
                </Typography>
              </>
            ) : (
              <>
                <CloudUpload sx={{ fontSize: 48, color: '#6366f1', mb: 1 }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  Ajouter un document PDF
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Cliquez ou déposez un fichier (max 10 Mo)
                </Typography>
              </>
            )}
          </Paper>
        </motion.div>

        {/* Résultat d'analyse */}
        {analysis && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Paper
              sx={{
                p: 3, mb: 3,
                border: '2px solid',
                borderColor: 'primary.light',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AutoAwesome sx={{ color: '#6366f1', mr: 1 }} />
                <Typography variant="h6" sx={{ fontWeight: 700, flexGrow: 1 }}>
                  Analyse IA
                </Typography>
                <Chip
                  label={`${analysis.page_count} page${analysis.page_count > 1 ? 's' : ''}`}
                  size="small"
                  variant="outlined"
                />
              </Box>
              <Typography
                variant="body2"
                sx={{ whiteSpace: 'pre-line', lineHeight: 1.7 }}
              >
                {analysis.summary}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
                Document : {analysis.document_name}
              </Typography>
            </Paper>
          </motion.div>
        )}

        {/* Liste des documents */}
        {loading ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CircularProgress size={32} />
          </Box>
        ) : documents.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Paper sx={{ p: 5, textAlign: 'center' }}>
              <InsertDriveFile sx={{ fontSize: 56, color: '#d4d4d8', mb: 2 }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }} gutterBottom>
                Aucun document
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Importez vos ordonnances, résultats d'analyses, comptes-rendus…
              </Typography>
            </Paper>
          </motion.div>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {documents
              .slice()
              .reverse()
              .map((doc, index) => (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0, x: -15 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.04 }}
                >
                  <Paper
                    sx={{
                      p: 2,
                      transition: 'box-shadow 0.2s',
                      '&:hover': { boxShadow: '0 4px 16px rgba(0,0,0,0.1)' },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box
                        sx={{
                          width: 44, height: 44, borderRadius: 2,
                          background: 'linear-gradient(135deg, #ef4444, #f97316)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          mr: 2, flexShrink: 0,
                        }}
                      >
                        <PictureAsPdf sx={{ color: 'white', fontSize: 22 }} />
                      </Box>
                      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                        <Typography
                          variant="subtitle2"
                          sx={{
                            fontWeight: 600,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {doc.original_name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(doc.uploaded_at)} · {formatSize(doc.size_bytes)} · {doc.page_count} p.
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1, mt: 1.5, justifyContent: 'flex-end' }}>
                      <Button
                        size="small"
                        startIcon={<Visibility />}
                        onClick={() => handleView(doc)}
                        sx={{ fontSize: '0.75rem' }}
                      >
                        Voir
                      </Button>
                      <Button
                        size="small"
                        startIcon={
                          analyzing === doc.id ? (
                            <CircularProgress size={16} color="inherit" />
                          ) : (
                            <AutoAwesome />
                          )
                        }
                        onClick={() => handleAnalyze(doc)}
                        disabled={analyzing === doc.id}
                        sx={{ fontSize: '0.75rem' }}
                      >
                        Analyser
                      </Button>
                      <IconButton
                        size="small"
                        onClick={() => setDeleteDialog(doc)}
                        sx={{ color: '#d4d4d8', '&:hover': { color: '#ef4444' } }}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Box>
                  </Paper>
                </motion.div>
              ))}
          </Box>
        )}

        {/* Delete dialog */}
        <Dialog open={!!deleteDialog} onClose={() => setDeleteDialog(null)}>
          <DialogTitle>Supprimer ce document ?</DialogTitle>
          <DialogContent>
            <Typography>
              « {deleteDialog?.original_name} » sera supprimé définitivement.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialog(null)}>Annuler</Button>
            <Button onClick={handleDelete} color="error">
              Supprimer
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  )
}

export default DocumentsPage
