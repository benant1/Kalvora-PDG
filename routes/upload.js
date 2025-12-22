import express from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { prisma } from '../lib/prisma.js'
import { requireAuth } from '../middleware/auth.js'

const router = express.Router()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Configuration de multer pour l'upload d'avatars
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '..', 'uploads', 'avatars')
    // Créer le dossier s'il n'existe pas
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }
    cb(null, uploadDir)
  },
  filename: function (req, file, cb) {
    const userId = req.user?.id
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    const ext = path.extname(file.originalname)
    cb(null, `avatar-${userId}-${uniqueSuffix}${ext}`)
  }
})

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('Type de fichier non accepté. Formats acceptés : JPG, PNG, GIF, WEBP'))
  }
}

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2 MB max
  },
  fileFilter: fileFilter
})

// Upload avatar
router.post('/avatar', requireAuth, upload.single('avatar'), async (req, res) => {
  try {
    const userId = req.user?.id
    
    if (!userId) {
      return res.status(401).json({ error: 'Non authentifié' })
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier fourni' })
    }

    const avatarPath = `/uploads/avatars/${req.file.filename}`

    // Récupérer l'ancien avatar pour le supprimer
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { avatar: true }
    })

    // Supprimer l'ancien fichier avatar s'il existe
    if (user?.avatar && user.avatar.startsWith('/uploads/avatars/')) {
      const oldFilePath = path.join(__dirname, '..', user.avatar)
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath)
      }
    }

    // Mettre à jour l'avatar dans la base de données
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { avatar: avatarPath },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        vendorStatus: true
      }
    })

    res.json({
      message: 'Avatar mis à jour avec succès',
      user: updatedUser
    })
  } catch (error) {
    console.error('[Upload Avatar Error]', error)
    res.status(500).json({ error: 'Erreur lors de l\'upload de l\'avatar' })
  }
})

// Delete avatar
router.delete('/avatar', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id
    
    if (!userId) {
      return res.status(401).json({ error: 'Non authentifié' })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { avatar: true }
    })

    // Supprimer le fichier avatar s'il existe
    if (user?.avatar && user.avatar.startsWith('/uploads/avatars/')) {
      const filePath = path.join(__dirname, '..', user.avatar)
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
      }
    }

    // Mettre à jour la base de données
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { avatar: null },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        vendorStatus: true
      }
    })

    res.json({
      message: 'Avatar supprimé avec succès',
      user: updatedUser
    })
  } catch (error) {
    console.error('[Delete Avatar Error]', error)
    res.status(500).json({ error: 'Erreur lors de la suppression de l\'avatar' })
  }
})

export default router
