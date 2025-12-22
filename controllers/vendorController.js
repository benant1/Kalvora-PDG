import { prisma } from '../lib/prisma.js'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import bcrypt from 'bcryptjs'
import { sendVendorApprovalEmail, sendVendorRejectionEmail } from '../services/emailService.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Configuration de multer pour l'upload de fichiers
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '..', 'uploads', 'vendor-documents')
    // Créer le dossier s'il n'existe pas
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }
    cb(null, uploadDir)
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, 'doc-' + uniqueSuffix + path.extname(file.originalname))
  }
})

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('Type de fichier non accepté. Formats acceptés : JPG, PNG, PDF'))
  }
}

export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB max
  },
  fileFilter: fileFilter
})

// Soumettre une demande vendeur
export async function submitVendorApplication(req, res) {
  try {
    const userId = req.user?.id
    
    if (!userId) {
      return res.status(401).json({ error: 'Non authentifié' })
    }

    // Vérifier si l'utilisateur existe
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' })
    }

    // Vérifier si une demande existe déjà
    const existingApplication = await prisma.vendorApplication.findUnique({
      where: { userId }
    })

    if (existingApplication) {
      console.log(`[Vendor Check] Existing application status for userId ${userId}: ${existingApplication.status}`)
      
      // Si la demande est rejetée, permettre de soumettre à nouveau
      if (existingApplication.status === 'rejected') {
        try {
          // Supprimer l'ancienne demande rejetée pour permettre une nouvelle soumission
          const deleteResult = await prisma.vendorApplication.delete({
            where: { userId }
          })
          console.log(`[Vendor] Ancienne demande rejetée supprimée pour userId: ${userId}`, deleteResult)
          
          // Vérifier que la suppression a bien été effectuée
          const checkAfterDelete = await prisma.vendorApplication.findUnique({
            where: { userId }
          })
          console.log(`[Vendor] Vérification après suppression:`, checkAfterDelete ? 'STILL EXISTS!' : 'Supprimée')
        } catch (deleteError) {
          console.error(`[Vendor Delete Error] Impossible de supprimer la demande rejetée:`, deleteError)
          return res.status(500).json({ 
            error: 'Erreur lors de la suppression de votre demande précédente',
            details: deleteError.message
          })
        }
      } else if (existingApplication.status === 'pending') {
        return res.status(400).json({ 
          error: 'Une demande de vendeur est déjà en cours d\'examen. Veuillez attendre la décision.',
          status: 'pending'
        })
      } else if (existingApplication.status === 'approved') {
        return res.status(400).json({ 
          error: 'Vous avez déjà un compte vendeur approuvé. Accédez à votre espace vendeur.',
          status: 'approved'
        })
      } else {
        return res.status(400).json({ 
          error: 'Une demande existe déjà pour cet utilisateur',
          status: existingApplication.status
        })
      }
    }

    const {
      firstName,
      lastName,
      email,
      phone,
      documentType,
      documentNumber,
      storeName,
      storeType,
      storeDescription
    } = req.body

    // Validation
    if (!firstName || !lastName || !email || !phone) {
      return res.status(400).json({ error: 'Informations personnelles incomplètes' })
    }

    if (!documentType || !documentNumber) {
      return res.status(400).json({ error: 'Informations de document incomplètes' })
    }

    if (!storeName || !storeType) {
      return res.status(400).json({ error: 'Informations de boutique incomplètes' })
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Document requis' })
    }

    // Créer la demande - stocker juste le nom de fichier relatif
    const fileName = req.file.filename
    const application = await prisma.vendorApplication.create({
      data: {
        userId,
        firstName,
        lastName,
        email,
        phone,
        documentType,
        documentNumber,
        documentFilePath: `/uploads/vendor-documents/${fileName}`,
        storeName,
        storeType,
        storeDescription: storeDescription || '',
        status: 'pending'
      }
    })

    // Mettre à jour le statut de l'utilisateur
    await prisma.user.update({
      where: { id: userId },
      data: {
        vendorStatus: 'pending'
      }
    })

    res.status(201).json({
      message: 'Demande soumise avec succès',
      application: {
        id: application.id,
        status: application.status,
        storeName: application.storeName
      }
    })
  } catch (error) {
    console.error('[Submit Vendor Application Error]', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

// Obtenir le statut de la demande vendeur
export async function getVendorApplicationStatus(req, res) {
  try {
    const userId = req.user?.id
    
    if (!userId) {
      return res.status(401).json({ error: 'Non authentifié' })
    }

    const application = await prisma.vendorApplication.findUnique({
      where: { userId },
      select: {
        id: true,
        status: true,
        storeName: true,
        storeType: true,
        rejectionReason: true,
        activationCodeVerified: true,
        pinSetAt: true,
        createdAt: true,
        updatedAt: true
      }
    })

    // Retourner un objet vendorApplication même si null (pour que le frontend puisse gérer)
    res.json({ vendorApplication: application })
  } catch (error) {
    console.error('[Get Vendor Application Status Error]', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

// Admin: Obtenir toutes les demandes vendeur (tous les statuts)
export async function getPendingApplications(req, res) {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Accès refusé' })
    }

    // Récupérer TOUTES les demandes, pas seulement pending
    const applications = await prisma.vendorApplication.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            vendorStatus: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    res.json(applications)
  } catch (error) {
    console.error('[Get Pending Applications Error]', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

// Admin: Approuver une demande vendeur
export async function approveApplication(req, res) {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Accès refusé' })
    }

    const { applicationId } = req.params

    // Récupérer l'application avec les infos utilisateur
    const application = await prisma.vendorApplication.findUnique({
      where: { id: parseInt(applicationId) },
      include: { user: true }
    })

    if (!application) {
      return res.status(404).json({ error: 'Demande non trouvée' })
    }

    // Générer un code d'activation à 4 chiffres
    const activationCode = Math.floor(1000 + Math.random() * 9000).toString()
    
    // Le code expire dans 24 heures
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

    // Mettre à jour l'application avec le code d'activation
    const updatedApplication = await prisma.vendorApplication.update({
      where: { id: parseInt(applicationId) },
      data: { 
        status: 'approved',
        activationCode: activationCode,
        activationCodeExpiresAt: expiresAt
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            vendorStatus: true
          }
        }
      }
    })

    // Mettre à jour le statut de l'utilisateur
    await prisma.user.update({
      where: { id: application.userId },
      data: { 
        vendorStatus: 'approved'
      }
    })

    // Envoyer l'email avec le code d'activation
    await sendVendorApprovalEmail({
      email: application.email,
      name: application.firstName + ' ' + application.lastName,
      storeName: application.storeName,
      activationCode: activationCode
    })

    res.json({ 
      message: 'Demande approuvée et code d\'activation envoyé', 
      application: updatedApplication,
      emailSent: true
    })
  } catch (error) {
    console.error('[Approve Application Error]', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

// Admin: Rejeter une demande vendeur
export async function rejectApplication(req, res) {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Accès refusé' })
    }

    const { applicationId } = req.params
    const { reason } = req.body

    // Récupérer l'application
    const application = await prisma.vendorApplication.findUnique({
      where: { id: parseInt(applicationId) }
    })

    if (!application) {
      return res.status(404).json({ error: 'Demande non trouvée' })
    }

    // Mettre à jour le statut
    const updatedApplication = await prisma.vendorApplication.update({
      where: { id: parseInt(applicationId) },
      data: {
        status: 'rejected',
        rejectionReason: reason || 'Non spécifié'
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            vendorStatus: true
          }
        }
      }
    })

    // Mettre à jour le statut vendeur de l'utilisateur
    await prisma.user.update({
      where: { id: application.userId },
      data: { vendorStatus: 'rejected' }
    })

    // Envoyer email de rejet
    await sendVendorRejectionEmail({
      email: application.email,
      name: application.firstName + ' ' + application.lastName,
      reason: reason
    })

    res.json({ message: 'Demande rejetée et email envoyé', application: updatedApplication })
  } catch (error) {
    console.error('[Reject Application Error]', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

// Admin: Obtenir toutes les demandes (peu importe le statut)
export async function getAllApplications(req, res) {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Accès refusé' })
    }

    const applications = await prisma.vendorApplication.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    res.json(applications)
  } catch (error) {
    console.error('[Get All Applications Error]', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

// Admin: Obtenir tous les vendeurs approuvés avec statistiques
export async function getApprovedVendors(req, res) {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Accès refusé' })
    }

    const approvedApplications = await prisma.vendorApplication.findMany({
      where: { status: 'approved' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    })

    // Pour chaque vendeur, récupérer ses statistiques
    const vendorsWithStats = await Promise.all(
      approvedApplications.map(async (app) => {
        // Compter les templates/designs publiés par ce vendeur
        const [templates, designs, downloads, purchases] = await Promise.all([
          prisma.template.count({ where: { createdBy: app.userId } }),
          prisma.design.count({ where: { createdBy: app.userId } }),
          prisma.download.count({ where: { vendorId: app.userId } }),
          prisma.purchase.count({ where: { vendorId: app.userId } })
        ])

        // Calculer le revenu total
        const revenue = await prisma.purchase.aggregate({
          where: { vendorId: app.userId },
          _sum: { amount: true }
        })

        return {
          ...app,
          stats: {
            totalTemplates: templates,
            totalDesigns: designs,
            totalDownloads: downloads,
            totalPurchases: purchases,
            totalRevenue: revenue._sum.amount || 0
          }
        }
      })
    )

    res.json(vendorsWithStats)
  } catch (error) {
    console.error('[Get Approved Vendors Error]', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

// Utilisateur: Vérifier le code d'activation (4 chiffres)
export async function verifyActivationCode(req, res) {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ error: 'Non authentifié' })
    }

    const { activationCode } = req.body

    if (!activationCode || activationCode.toString().length !== 4) {
      return res.status(400).json({ error: 'Le code d\'activation doit être 4 chiffres' })
    }

    // Récupérer l'application de l'utilisateur
    const application = await prisma.vendorApplication.findUnique({
      where: { userId }
    })

    if (!application) {
      return res.status(404).json({ error: 'Demande vendeur non trouvée' })
    }

    if (application.status !== 'approved') {
      return res.status(400).json({ error: 'Votre demande n\'a pas été approuvée' })
    }

    // Vérifier que le code n'a pas expiré
    if (!application.activationCodeExpiresAt || new Date() > application.activationCodeExpiresAt) {
      return res.status(400).json({ error: 'Le code d\'activation a expiré' })
    }

    // Vérifier le code
    if (application.activationCode !== activationCode.toString()) {
      return res.status(400).json({ error: 'Code d\'activation incorrect' })
    }

    // Marquer le code comme vérifié
    await prisma.vendorApplication.update({
      where: { userId },
      data: { activationCodeVerified: true }
    })

    res.json({ 
      message: 'Code d\'activation vérifié. Définissez votre PIN d\'accès.' 
    })
  } catch (error) {
    console.error('[Verify Activation Code Error]', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

// Utilisateur: Définir son PIN d'accès (4 chiffres)
export async function setUserPin(req, res) {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ error: 'Non authentifié' })
    }

    const { pin } = req.body

    if (!pin || pin.toString().length !== 4 || !/^\d{4}$/.test(pin.toString())) {
      return res.status(400).json({ error: 'Le PIN doit être 4 chiffres (0-9)' })
    }

    // Récupérer l'application de l'utilisateur
    const application = await prisma.vendorApplication.findUnique({
      where: { userId }
    })

    if (!application) {
      return res.status(404).json({ error: 'Demande vendeur non trouvée' })
    }

    if (!application.activationCodeVerified) {
      return res.status(400).json({ error: 'Vous devez d\'abord vérifier votre code d\'activation' })
    }

    // Hasher le PIN
    const hashedPin = await bcrypt.hash(pin.toString(), 10)

    // Sauvegarder le PIN de l'utilisateur
    await prisma.vendorApplication.update({
      where: { userId },
      data: { 
        userPin: hashedPin,
        pinSetAt: new Date()
      }
    })

    res.json({ 
      message: 'PIN d\'accès défini avec succès',
      success: true
    })
  } catch (error) {
    console.error('[Set User PIN Error]', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

// Utilisateur: Vérifier son PIN d'accès
export async function verifyUserPin(req, res) {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ error: 'Non authentifié' })
    }

    const { pin } = req.body

    if (!pin || pin.toString().length !== 4) {
      return res.status(400).json({ error: 'Le PIN doit être 4 chiffres' })
    }

    // Récupérer l'application de l'utilisateur
    const application = await prisma.vendorApplication.findUnique({
      where: { userId }
    })

    if (!application) {
      return res.status(404).json({ error: 'Demande vendeur non trouvée' })
    }

    if (!application.userPin) {
      return res.status(400).json({ error: 'Aucun PIN défini. Veuillez d\'abord définir votre PIN.' })
    }

    // DEBUG: log some information to help diagnose PIN mismatch
    console.log('[Verify PIN] userId=', userId, 'receivedPin=', String(pin).replace(/\s+/g, ''), 'hasStoredPin=', !!application.userPin)
    if (application.userPin) {
      try {
        console.log('[Verify PIN] storedHashPrefix=', application.userPin.slice(0, 24))
      } catch (e) {
        console.log('[Verify PIN] storedHash unavailable')
      }
    }

    // Vérifier le PIN
    const pinMatch = await bcrypt.compare(pin.toString(), application.userPin)
    if (!pinMatch) {
      console.log('[Verify PIN] mismatch for userId=', userId)
      return res.status(400).json({ error: 'PIN incorrect' })
    }

    res.json({ 
      message: 'PIN vérifié',
      access: true
    })
  } catch (error) {
    console.error('[Verify User PIN Error]', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

// Admin: Bloquer/Débloquer un espace vendeur
export async function toggleVendorBlock(req, res) {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Accès refusé' })
    }

    const { applicationId } = req.params
    const { blocked, reason } = req.body

    // Récupérer l'application
    const application = await prisma.vendorApplication.findUnique({
      where: { id: parseInt(applicationId) },
      include: { user: true }
    })

    if (!application) {
      return res.status(404).json({ error: 'Demande non trouvée' })
    }

    if (application.status !== 'approved') {
      return res.status(400).json({ error: 'Seuls les espaces approuvés peuvent être bloqués' })
    }

    // Mettre à jour le statut de blocage
    const updatedApplication = await prisma.vendorApplication.update({
      where: { id: parseInt(applicationId) },
      data: {
        isBlocked: blocked,
        blockReason: blocked ? (reason || 'Non spécifié') : null,
        blockedAt: blocked ? new Date() : null
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            vendorStatus: true
          }
        }
      }
    })

    // Mettre à jour le statut vendeur de l'utilisateur
    await prisma.user.update({
      where: { id: application.userId },
      data: { 
        vendorStatus: blocked ? 'blocked' : 'approved'
      }
    })

    res.json({ 
      message: blocked ? 'Espace vendeur bloqué' : 'Espace vendeur débloqué',
      application: updatedApplication
    })
  } catch (error) {
    console.error('[Toggle Vendor Block Error]', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

// =========================================
// PRODUITS VENDEUR
// =========================================

// Configuration multer pour les images produits
const productImageStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '..', 'uploads', 'products')
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }
    cb(null, uploadDir)
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, 'product-' + uniqueSuffix + path.extname(file.originalname))
  }
})

const productImageFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('Type de fichier non accepté. Formats acceptés : JPG, PNG, WEBP'))
  }
}

export const uploadProductImages = multer({
  storage: productImageStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
  fileFilter: productImageFilter
})

// Générer un slug unique pour un produit
function generateSlug(title) {
  const baseSlug = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Supprimer les accents
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
  return `${baseSlug}-${Date.now()}`
}

// Obtenir tous les produits du vendeur connecté
export async function getVendorProducts(req, res) {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ error: 'Non authentifié' })
    }

    const application = await prisma.vendorApplication.findUnique({
      where: { userId }
    })

    if (!application || application.status !== 'approved') {
      return res.status(403).json({ error: 'Accès refusé - Vendeur non approuvé' })
    }

    const { status, category, search, page = 1, limit = 20 } = req.query
    const skip = (parseInt(page) - 1) * parseInt(limit)

    const where = { vendorApplicationId: application.id }
    if (status) where.status = status
    if (category) where.category = category
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } }
      ]
    }

    const [products, total] = await Promise.all([
      prisma.vendorProduct.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.vendorProduct.count({ where })
    ])

    res.json({
      products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    })
  } catch (error) {
    console.error('[Get Vendor Products Error]', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

// Obtenir un produit spécifique du vendeur
export async function getVendorProduct(req, res) {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ error: 'Non authentifié' })
    }

    const application = await prisma.vendorApplication.findUnique({
      where: { userId }
    })

    if (!application || application.status !== 'approved') {
      return res.status(403).json({ error: 'Accès refusé' })
    }

    const { productId } = req.params
    const product = await prisma.vendorProduct.findFirst({
      where: {
        id: parseInt(productId),
        vendorApplicationId: application.id
      }
    })

    if (!product) {
      return res.status(404).json({ error: 'Produit non trouvé' })
    }

    res.json(product)
  } catch (error) {
    console.error('[Get Vendor Product Error]', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

// Créer un nouveau produit
export async function createVendorProduct(req, res) {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ error: 'Non authentifié' })
    }

    const application = await prisma.vendorApplication.findUnique({
      where: { userId }
    })

    if (!application || application.status !== 'approved') {
      return res.status(403).json({ error: 'Accès refusé - Vendeur non approuvé' })
    }

    if (application.isBlocked) {
      return res.status(403).json({ error: 'Votre espace vendeur est bloqué' })
    }

    const {
      title,
      description,
      price,
      comparePrice,
      stock,
      trackStock,
      category,
      subcategory,
      status = 'draft',
      metaTitle,
      metaDescription
    } = req.body

    // Validation
    if (!title || !description || !price || !category) {
      return res.status(400).json({ error: 'Titre, description, prix et catégorie requis' })
    }

    // Générer le slug
    const slug = generateSlug(title)

    // Traiter les images uploadées
    const images = []
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        images.push(`/uploads/products/${file.filename}`)
      })
    }

    const product = await prisma.vendorProduct.create({
      data: {
        vendorApplicationId: application.id,
        title,
        description,
        price: parseFloat(price),
        comparePrice: comparePrice ? parseFloat(comparePrice) : null,
        stock: stock ? parseInt(stock) : 0,
        trackStock: trackStock !== undefined ? trackStock === 'true' || trackStock === true : true,
        category,
        subcategory: subcategory || null,
        images: images,
        thumbnailUrl: images[0] || null,
        status,
        slug,
        metaTitle: metaTitle || title,
        metaDescription: metaDescription || description.substring(0, 160)
      }
    })

    res.status(201).json({
      message: 'Produit créé avec succès',
      product
    })
  } catch (error) {
    console.error('[Create Vendor Product Error]', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

// Mettre à jour un produit
export async function updateVendorProduct(req, res) {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ error: 'Non authentifié' })
    }

    const application = await prisma.vendorApplication.findUnique({
      where: { userId }
    })

    if (!application || application.status !== 'approved') {
      return res.status(403).json({ error: 'Accès refusé' })
    }

    if (application.isBlocked) {
      return res.status(403).json({ error: 'Votre espace vendeur est bloqué' })
    }

    const { productId } = req.params
    
    // Vérifier que le produit appartient au vendeur
    const existingProduct = await prisma.vendorProduct.findFirst({
      where: {
        id: parseInt(productId),
        vendorApplicationId: application.id
      }
    })

    if (!existingProduct) {
      return res.status(404).json({ error: 'Produit non trouvé' })
    }

    const {
      title,
      description,
      price,
      comparePrice,
      stock,
      trackStock,
      category,
      subcategory,
      status,
      metaTitle,
      metaDescription,
      existingImages // Images déjà existantes à conserver
    } = req.body

    // Traiter les nouvelles images uploadées
    let images = existingImages ? JSON.parse(existingImages) : existingProduct.images
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        images.push(`/uploads/products/${file.filename}`)
      })
    }

    const updateData = {}
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (price !== undefined) updateData.price = parseFloat(price)
    if (comparePrice !== undefined) updateData.comparePrice = comparePrice ? parseFloat(comparePrice) : null
    if (stock !== undefined) updateData.stock = parseInt(stock)
    if (trackStock !== undefined) updateData.trackStock = trackStock === 'true' || trackStock === true
    if (category !== undefined) updateData.category = category
    if (subcategory !== undefined) updateData.subcategory = subcategory
    if (status !== undefined) updateData.status = status
    if (metaTitle !== undefined) updateData.metaTitle = metaTitle
    if (metaDescription !== undefined) updateData.metaDescription = metaDescription
    if (images) {
      updateData.images = images
      updateData.thumbnailUrl = images[0] || null
    }

    const product = await prisma.vendorProduct.update({
      where: { id: parseInt(productId) },
      data: updateData
    })

    res.json({
      message: 'Produit mis à jour',
      product
    })
  } catch (error) {
    console.error('[Update Vendor Product Error]', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

// Supprimer un produit
export async function deleteVendorProduct(req, res) {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ error: 'Non authentifié' })
    }

    const application = await prisma.vendorApplication.findUnique({
      where: { userId }
    })

    if (!application || application.status !== 'approved') {
      return res.status(403).json({ error: 'Accès refusé' })
    }

    const { productId } = req.params
    
    // Vérifier que le produit appartient au vendeur
    const existingProduct = await prisma.vendorProduct.findFirst({
      where: {
        id: parseInt(productId),
        vendorApplicationId: application.id
      }
    })

    if (!existingProduct) {
      return res.status(404).json({ error: 'Produit non trouvé' })
    }

    // Supprimer les fichiers images associés
    if (existingProduct.images && Array.isArray(existingProduct.images)) {
      existingProduct.images.forEach(imagePath => {
        const fullPath = path.join(__dirname, '..', imagePath)
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath)
        }
      })
    }

    await prisma.vendorProduct.delete({
      where: { id: parseInt(productId) }
    })

    res.json({ message: 'Produit supprimé' })
  } catch (error) {
    console.error('[Delete Vendor Product Error]', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

// Obtenir les statistiques du vendeur
export async function getVendorDashboardStats(req, res) {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ error: 'Non authentifié' })
    }

    const application = await prisma.vendorApplication.findUnique({
      where: { userId }
    })

    if (!application || application.status !== 'approved') {
      return res.status(403).json({ error: 'Accès refusé' })
    }

    // Compter les produits
    const [totalProducts, publishedProducts, draftProducts] = await Promise.all([
      prisma.vendorProduct.count({ where: { vendorApplicationId: application.id } }),
      prisma.vendorProduct.count({ where: { vendorApplicationId: application.id, status: 'published' } }),
      prisma.vendorProduct.count({ where: { vendorApplicationId: application.id, status: 'draft' } })
    ])

    // Compter les commandes
    const [totalOrders, pendingOrders, completedOrders] = await Promise.all([
      prisma.vendorOrder.count({ where: { vendorApplicationId: application.id } }),
      prisma.vendorOrder.count({ where: { vendorApplicationId: application.id, status: 'pending' } }),
      prisma.vendorOrder.count({ where: { vendorApplicationId: application.id, status: 'completed' } })
    ])

    // Calculer le revenu
    const revenue = await prisma.vendorOrder.aggregate({
      where: { 
        vendorApplicationId: application.id,
        paymentStatus: 'paid'
      },
      _sum: { totalAmount: true }
    })

    // Calculer les vues totales des produits
    const views = await prisma.vendorProduct.aggregate({
      where: { vendorApplicationId: application.id },
      _sum: { views: true }
    })

    // Produits les plus vendus
    const topProducts = await prisma.vendorProduct.findMany({
      where: { vendorApplicationId: application.id },
      orderBy: { sales: 'desc' },
      take: 5,
      select: {
        id: true,
        title: true,
        thumbnailUrl: true,
        price: true,
        sales: true,
        views: true
      }
    })

    // Commandes récentes
    const recentOrders = await prisma.vendorOrder.findMany({
      where: { vendorApplicationId: application.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        product: {
          select: {
            title: true,
            thumbnailUrl: true
          }
        }
      }
    })

    res.json({
      stats: {
        products: {
          total: totalProducts,
          published: publishedProducts,
          draft: draftProducts
        },
        orders: {
          total: totalOrders,
          pending: pendingOrders,
          completed: completedOrders
        },
        revenue: revenue._sum.totalAmount || 0,
        views: views._sum.views || 0
      },
      topProducts,
      recentOrders
    })
  } catch (error) {
    console.error('[Get Vendor Dashboard Stats Error]', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

// Obtenir les commandes du vendeur
export async function getVendorOrders(req, res) {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ error: 'Non authentifié' })
    }

    const application = await prisma.vendorApplication.findUnique({
      where: { userId }
    })

    if (!application || application.status !== 'approved') {
      return res.status(403).json({ error: 'Accès refusé' })
    }

    const { status, page = 1, limit = 20 } = req.query
    const skip = (parseInt(page) - 1) * parseInt(limit)

    const where = { vendorApplicationId: application.id }
    if (status) where.status = status

    const [orders, total] = await Promise.all([
      prisma.vendorOrder.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          product: {
            select: {
              id: true,
              title: true,
              thumbnailUrl: true,
              price: true
            }
          }
        }
      }),
      prisma.vendorOrder.count({ where })
    ])

    res.json({
      orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    })
  } catch (error) {
    console.error('[Get Vendor Orders Error]', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

// Mettre à jour le statut d'une commande
export async function updateVendorOrderStatus(req, res) {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ error: 'Non authentifié' })
    }

    const application = await prisma.vendorApplication.findUnique({
      where: { userId }
    })

    if (!application || application.status !== 'approved') {
      return res.status(403).json({ error: 'Accès refusé' })
    }

    const { orderId } = req.params
    const { status, vendorNote } = req.body

    const order = await prisma.vendorOrder.findFirst({
      where: {
        id: parseInt(orderId),
        vendorApplicationId: application.id
      }
    })

    if (!order) {
      return res.status(404).json({ error: 'Commande non trouvée' })
    }

    const updateData = {}
    if (status) updateData.status = status
    if (vendorNote !== undefined) updateData.vendorNote = vendorNote

    const updatedOrder = await prisma.vendorOrder.update({
      where: { id: parseInt(orderId) },
      data: updateData,
      include: {
        product: {
          select: {
            title: true,
            thumbnailUrl: true
          }
        }
      }
    })

    res.json({
      message: 'Commande mise à jour',
      order: updatedOrder
    })
  } catch (error) {
    console.error('[Update Vendor Order Status Error]', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}
