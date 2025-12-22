import express from 'express'
import { requireAuth } from '../middleware/auth.js'
import {
  updateProfile,
  updatePassword,
  updateAvatar,
  deleteAccount
} from '../controllers/userController.js'

const router = express.Router()

// All routes require authentication
router.use(requireAuth)

// Update profile (name, email)
router.put('/profile', updateProfile)

// Update password
router.put('/password', updatePassword)

// Update avatar
router.put('/avatar', updateAvatar)

// Delete account
router.delete('/account', deleteAccount)

export default router
