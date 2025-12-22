import { prisma } from '../lib/prisma.js'

export async function listProducts(req, res) {
  try {
    const { q, category, min, max } = req.query
    const where = {}
    
    if (category) {
      where.category = category
    }
    if (min || max) {
      where.price = {}
      if (min) where.price.gte = Number(min)
      if (max) where.price.lte = Number(max)
    }
    if (q) {
      where.OR = [
        { name: { contains: q } },
        { productId: { contains: q } }
      ]
    }
    
    const products = await prisma.product.findMany({ where })
    res.json(products)
  } catch (err) {
    console.error('[Market List Error]', err)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export async function getProduct(req, res) {
  try {
    const product = await prisma.product.findUnique({ where: { productId: req.params.id } })
    if (!product) return res.status(404).json({ error: 'Product not found' })
    res.json(product)
  } catch (err) {
    console.error('[Market Detail Error]', err)
    res.status(500).json({ error: 'Internal server error' })
  }
}

// ==================== VENDOR PRODUCTS (PUBLIC) ====================

// Récupérer tous les produits vendeurs publiés (public)
export async function listVendorProducts(req, res) {
  try {
    const { q, category, min, max, page = 1, limit = 20, sort = 'newest' } = req.query
    const skip = (parseInt(page) - 1) * parseInt(limit)
    
    // Filtrer uniquement les produits actifs (montrer draft + published)
    const where = {
      isActive: true
    }
    
    if (category && category !== 'all') {
      where.category = category
    }
    
    if (min || max) {
      where.price = {}
      if (min) where.price.gte = Number(min)
      if (max) where.price.lte = Number(max)
    }
    
    if (q) {
      where.OR = [
        { title: { contains: q } },
        { description: { contains: q } }
      ]
    }
    
    // Définir l'ordre de tri
    let orderBy = { createdAt: 'desc' }
    if (sort === 'oldest') orderBy = { createdAt: 'asc' }
    else if (sort === 'price_asc') orderBy = { price: 'asc' }
    else if (sort === 'price_desc') orderBy = { price: 'desc' }
    else if (sort === 'popular') orderBy = { views: 'desc' }
    else if (sort === 'bestselling') orderBy = { sales: 'desc' }
    
    const [products, total] = await Promise.all([
      prisma.vendorProduct.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy,
        include: {
          vendorApplication: {
            select: {
              id: true,
              storeName: true,
              storeType: true,
              firstName: true,
              lastName: true
            }
          }
        }
      }),
      prisma.vendorProduct.count({ where })
    ])
    
    // Formater les produits pour le frontend
    const formattedProducts = products.map(product => ({
      id: product.id,
      title: product.title,
      description: product.description,
      price: product.price,
      comparePrice: product.comparePrice,
      category: product.category,
      subcategory: product.subcategory,
      images: typeof product.images === 'string' ? JSON.parse(product.images) : product.images,
      thumbnailUrl: product.thumbnailUrl,
      slug: product.slug,
      views: product.views,
      sales: product.sales,
      stock: product.stock,
      trackStock: product.trackStock,
      createdAt: product.createdAt,
      vendor: {
        id: product.vendorApplication.id,
        storeName: product.vendorApplication.storeName,
        storeType: product.vendorApplication.storeType,
        sellerName: `${product.vendorApplication.firstName} ${product.vendorApplication.lastName}`
      }
    }))
    
    res.json({
      products: formattedProducts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    })
  } catch (err) {
    console.error('[Market Vendor Products Error]', err)
    res.status(500).json({ error: 'Internal server error' })
  }
}

// Récupérer un produit vendeur par slug ou ID (public)
export async function getVendorProduct(req, res) {
  try {
    const { slugOrId } = req.params
    
    // Chercher par slug ou par ID
    let product = null
    const id = parseInt(slugOrId)
    
    if (!isNaN(id)) {
      product = await prisma.vendorProduct.findFirst({
        where: { 
          id,
          isActive: true
        },
        include: {
          vendorApplication: {
            select: {
              id: true,
              storeName: true,
              storeType: true,
              storeDescription: true,
              firstName: true,
              lastName: true
            }
          }
        }
      })
    }
    
    if (!product) {
      product = await prisma.vendorProduct.findFirst({
        where: { 
          slug: slugOrId,
          isActive: true
        },
        include: {
          vendorApplication: {
            select: {
              id: true,
              storeName: true,
              storeType: true,
              storeDescription: true,
              firstName: true,
              lastName: true
            }
          }
        }
      })
    }
    
    if (!product) {
      return res.status(404).json({ error: 'Produit non trouvé' })
    }
    
    // Incrémenter le compteur de vues
    await prisma.vendorProduct.update({
      where: { id: product.id },
      data: { views: { increment: 1 } }
    })
    
    // Formater le produit
    const formattedProduct = {
      id: product.id,
      title: product.title,
      description: product.description,
      price: product.price,
      comparePrice: product.comparePrice,
      category: product.category,
      subcategory: product.subcategory,
      images: typeof product.images === 'string' ? JSON.parse(product.images) : product.images,
      thumbnailUrl: product.thumbnailUrl,
      slug: product.slug,
      views: product.views + 1,
      sales: product.sales,
      stock: product.stock,
      trackStock: product.trackStock,
      metaTitle: product.metaTitle,
      metaDescription: product.metaDescription,
      createdAt: product.createdAt,
      vendor: {
        id: product.vendorApplication.id,
        storeName: product.vendorApplication.storeName,
        storeType: product.vendorApplication.storeType,
        storeDescription: product.vendorApplication.storeDescription,
        sellerName: `${product.vendorApplication.firstName} ${product.vendorApplication.lastName}`
      }
    }
    
    res.json(formattedProduct)
  } catch (err) {
    console.error('[Market Vendor Product Detail Error]', err)
    res.status(500).json({ error: 'Internal server error' })
  }
}

// Récupérer les catégories disponibles
export async function getVendorProductCategories(req, res) {
  try {
    const categories = await prisma.vendorProduct.groupBy({
      by: ['category'],
      where: {
        isActive: true
      },
      _count: {
        category: true
      }
    })
    
    const categoryLabels = {
      template: 'Templates',
      design: 'Designs',
      service: 'Services',
      digital: 'Produits numériques',
      other: 'Autres'
    }
    
    const formattedCategories = categories.map(c => ({
      value: c.category,
      label: categoryLabels[c.category] || c.category,
      count: c._count.category
    }))
    
    res.json(formattedCategories)
  } catch (err) {
    console.error('[Market Categories Error]', err)
    res.status(500).json({ error: 'Internal server error' })
  }
}
