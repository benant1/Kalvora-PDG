import express from 'express'
import { requireAuth } from '../middleware/auth.js'
import {
  getAllUsers,
  getDashboardStats,
  updateUserRole,
  deleteUser,
  getAllProducts,
  getAllBlogPosts,
  getAllRequests,
  getPendingVendors,
  approveVendor,
  rejectVendor
} from '../controllers/adminController.js'
import {
  getAllTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  getAllDesigns,
  createDesign,
  updateDesign,
  deleteDesign
} from '../controllers/templateController.js'

const router = express.Router()

// All routes require admin authentication
router.use(requireAuth)

// Dashboard stats
router.get('/stats', getDashboardStats)

// User management
router.get('/users', getAllUsers)
router.put('/users/:userId/role', updateUserRole)
router.delete('/users/:userId', deleteUser)

// Vendor management
router.get('/vendors/pending', getPendingVendors)
router.put('/vendors/:userId/approve', approveVendor)
router.put('/vendors/:userId/reject', rejectVendor)

// Content management
router.get('/products', getAllProducts)
router.get('/blog-posts', getAllBlogPosts)
router.get('/requests', getAllRequests)

// Template management
router.get('/templates', getAllTemplates)
router.post('/templates', createTemplate)
router.put('/templates/:id', updateTemplate)
router.delete('/templates/:id', deleteTemplate)

// Design management
router.get('/designs', getAllDesigns)
router.post('/designs', createDesign)
router.put('/designs/:id', updateDesign)
router.delete('/designs/:id', deleteDesign)

export default router
