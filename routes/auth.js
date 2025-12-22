import { Router } from 'express'
import { signup, login, logout, me, confirmEmail } from '../controllers/authController.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

router.post('/signup', signup)
router.post('/confirm-email', confirmEmail)
router.post('/login', login)
router.post('/logout', requireAuth, logout)
router.get('/me', requireAuth, me)

export default router
