import express from 'express'
import { 
  submitVendorApplication,
  getVendorApplicationStatus,
  getPendingApplications,
  getAllApplications,
  approveApplication,
  rejectApplication,
  getApprovedVendors,
  verifyActivationCode,
  setUserPin,
  verifyUserPin,
  toggleVendorBlock,
  upload,
  // Produits
  getVendorProducts,
  getVendorProduct,
  createVendorProduct,
  updateVendorProduct,
  deleteVendorProduct,
  uploadProductImages,
  // Dashboard & Stats
  getVendorDashboardStats,
  // Commandes
  getVendorOrders,
  updateVendorOrderStatus
} from '../controllers/vendorController.js'
import { requireAuth } from '../middleware/auth.js'

const router = express.Router()

// Routes utilisateur - demande vendeur
router.post('/apply', requireAuth, upload.single('documentFile'), submitVendorApplication)
router.get('/status', requireAuth, getVendorApplicationStatus)
router.post('/verify-activation-code', requireAuth, verifyActivationCode)
router.post('/set-pin', requireAuth, setUserPin)
router.post('/verify-pin', requireAuth, verifyUserPin)

// Routes vendeur - Dashboard
router.get('/dashboard/stats', requireAuth, getVendorDashboardStats)

// Routes vendeur - Produits
router.get('/products', requireAuth, getVendorProducts)
router.get('/products/:productId', requireAuth, getVendorProduct)
router.post('/products', requireAuth, uploadProductImages.array('images', 10), createVendorProduct)
router.put('/products/:productId', requireAuth, uploadProductImages.array('images', 10), updateVendorProduct)
router.delete('/products/:productId', requireAuth, deleteVendorProduct)

// Routes vendeur - Commandes
router.get('/orders', requireAuth, getVendorOrders)
router.put('/orders/:orderId', requireAuth, updateVendorOrderStatus)

// Routes admin
router.get('/admin/pending', requireAuth, getPendingApplications)
router.get('/admin/all', requireAuth, getAllApplications)
router.get('/admin/approved', requireAuth, getApprovedVendors)
router.put('/admin/:applicationId/approve', requireAuth, approveApplication)
router.put('/admin/:applicationId/reject', requireAuth, rejectApplication)
router.put('/admin/:applicationId/block', requireAuth, toggleVendorBlock)

export default router
