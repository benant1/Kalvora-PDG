import { Router } from 'express'
import { downloadTemplate, getTemplates } from '../controllers/techController.js'

const router = Router()

// Récupérer la liste des templates
router.get('/templates', getTemplates)

// Télécharger un template spécifique
router.get('/templates/:templateId/download', downloadTemplate)

export default router
