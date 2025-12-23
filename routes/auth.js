import { Router } from 'express'
import { signup, login, logout, me, confirmEmail } from '../controllers/authController.js'
import { requireAuth } from '../middleware/auth.js'
import cors from 'cors'

const router = Router()

router.post('/signup', signup)
router.post('/confirm-email', confirmEmail)
// Gestion des requêtes OPTIONS pour /login
router.options('/login', cors()) // Répondre aux pré-requêtes OPTIONS
router.post('/login', cors(), login)
router.post('/logout', requireAuth, logout)
router.get('/me', requireAuth, me)

export default router
