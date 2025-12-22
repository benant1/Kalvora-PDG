import { Router } from 'express'
import { listProducts, getProduct, listVendorProducts, getVendorProduct, getVendorProductCategories } from '../controllers/marketController.js'

const router = Router()

// Routes produits vendeurs (public) - DOIVENT ÊTRE EN PREMIER
router.get('/vendor/products/categories', getVendorProductCategories)
router.get('/vendor/products', listVendorProducts)
router.get('/vendor/products/:slugOrId', getVendorProduct)

// Routes produits originaux - EN DERNIER
router.get('/', listProducts)
router.get('/:id', getProduct)

export default router
