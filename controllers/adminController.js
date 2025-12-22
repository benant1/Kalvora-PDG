import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Get all users (admin only)
export async function getAllUsers(req, res) {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admin access required' })
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    res.json(users)
  } catch (error) {
    console.error('[Get All Users Error]', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

// Get dashboard statistics
export async function getDashboardStats(req, res) {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admin access required' })
    }

    const [
      totalUsers,
      totalProducts,
      totalBlogPosts,
      totalRequests,
      totalTemplates,
      totalDesigns,
      totalDownloads,
      totalPurchases,
      allUsers,
      usersByRole
    ] = await Promise.all([
      prisma.user.count(),
      prisma.product.count(),
      prisma.blogPost.count(),
      prisma.request.count(),
      prisma.template.count(),
      prisma.design.count(),
      prisma.download.count(),
      prisma.purchase.count(),
      prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.groupBy({
        by: ['role'],
        _count: true
      })
    ])

    // Get user growth (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const [userGrowthData, downloadsData, purchasesData] = await Promise.all([
      prisma.user.findMany({
        where: { createdAt: { gte: sevenDaysAgo } },
        select: { createdAt: true }
      }),
      prisma.download.findMany({
        where: { createdAt: { gte: sevenDaysAgo } },
        select: { createdAt: true, itemType: true }
      }),
      prisma.purchase.findMany({
        where: { createdAt: { gte: sevenDaysAgo } },
        select: { createdAt: true, itemType: true, amount: true }
      })
    ])

    // Group by day
    const growthByDay = {}
    const downloadsByDay = {}
    const purchasesByDay = {}
    const revenueByDay = {}
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      growthByDay[dateStr] = 0
      downloadsByDay[dateStr] = { template: 0, design: 0, total: 0 }
      purchasesByDay[dateStr] = { template: 0, design: 0, product: 0, total: 0 }
      revenueByDay[dateStr] = 0
    }

    userGrowthData.forEach(user => {
      const dateStr = user.createdAt.toISOString().split('T')[0]
      if (growthByDay[dateStr] !== undefined) {
        growthByDay[dateStr]++
      }
    })

    downloadsData.forEach(download => {
      const dateStr = download.createdAt.toISOString().split('T')[0]
      if (downloadsByDay[dateStr] !== undefined) {
        downloadsByDay[dateStr][download.itemType]++
        downloadsByDay[dateStr].total++
      }
    })

    purchasesData.forEach(purchase => {
      const dateStr = purchase.createdAt.toISOString().split('T')[0]
      if (purchasesByDay[dateStr] !== undefined) {
        purchasesByDay[dateStr][purchase.itemType]++
        purchasesByDay[dateStr].total++
        revenueByDay[dateStr] += purchase.amount
      }
    })

    // Get top downloaded items
    const topDownloads = await prisma.download.groupBy({
      by: ['itemName', 'itemType'],
      _count: true,
      orderBy: { _count: { itemName: 'desc' } },
      take: 5
    })

    // Get top purchased items
    const topPurchases = await prisma.purchase.groupBy({
      by: ['itemName', 'itemType'],
      _count: true,
      _sum: { amount: true },
      orderBy: { _count: { itemName: 'desc' } },
      take: 5
    })

    res.json({
      totalUsers,
      totalProducts,
      totalBlogPosts,
      totalRequests,
      totalTemplates,
      totalDesigns,
      totalDownloads,
      totalPurchases,
      allUsers,
      usersByRole,
      userGrowth: Object.entries(growthByDay).map(([date, count]) => ({ date, count })),
      downloadStats: Object.entries(downloadsByDay).map(([date, stats]) => ({ date, ...stats })),
      purchaseStats: Object.entries(purchasesByDay).map(([date, stats]) => ({ date, ...stats })),
      revenueStats: Object.entries(revenueByDay).map(([date, revenue]) => ({ date, revenue })),
      topDownloads,
      topPurchases
    })
  } catch (error) {
    console.error('[Get Dashboard Stats Error]', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

// Update user role
export async function updateUserRole(req, res) {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admin access required' })
    }

    const { userId } = req.params
    const { role } = req.body

    if (!['user', 'developer', 'designer', 'vendor', 'seller', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' })
    }

    const updatedUser = await prisma.user.update({
      where: { id: parseInt(userId) },
      data: { role },
      select: {
        id: true,
        email: true,
        name: true,
        role: true
      }
    })

    res.json(updatedUser)
  } catch (error) {
    console.error('[Update User Role Error]', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

// Delete user (admin only)
export async function deleteUser(req, res) {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admin access required' })
    }

    const { userId } = req.params

    // Prevent admin from deleting themselves
    if (parseInt(userId) === req.user.sub) {
      return res.status(400).json({ error: 'Cannot delete your own account' })
    }

    const uid = parseInt(userId)

    // Remove dependent records to avoid foreign key constraint errors
    await prisma.download.deleteMany({ where: { userId: uid } }).catch(() => null)
    await prisma.purchase.deleteMany({ where: { userId: uid } }).catch(() => null)
    await prisma.request.deleteMany({ where: { userId: uid } }).catch(() => null)

    // If the user has a vendor application, remove related vendor data first
    const vendorApp = await prisma.vendorApplication.findUnique({ where: { userId: uid } })
    if (vendorApp) {
      const vId = vendorApp.id
      // Delete vendor-related orders, social shares, products
      await prisma.vendorOrder.deleteMany({ where: { vendorApplicationId: vId } }).catch(() => null)
      await prisma.socialMediaShare.deleteMany({ where: { vendorApplicationId: vId } }).catch(() => null)
      await prisma.vendorProduct.deleteMany({ where: { vendorApplicationId: vId } }).catch(() => null)
      // Finally delete the vendor application
      await prisma.vendorApplication.delete({ where: { id: vId } }).catch(() => null)
    }

    // Finally delete the user
    await prisma.user.delete({ where: { id: uid } })

    res.json({ message: 'User deleted successfully' })
  } catch (error) {
    console.error('[Delete User Error]', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

// Get all products (for management)
export async function getAllProducts(req, res) {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admin access required' })
    }

    const products = await prisma.product.findMany({
      orderBy: { createdAt: 'desc' }
    })

    res.json(products)
  } catch (error) {
    console.error('[Get All Products Error]', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

// Get all blog posts (for management)
export async function getAllBlogPosts(req, res) {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admin access required' })
    }

    const posts = await prisma.blogPost.findMany({
      orderBy: { createdAt: 'desc' }
    })

    res.json(posts)
  } catch (error) {
    console.error('[Get All Blog Posts Error]', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

// Get all requests (for management)
export async function getAllRequests(req, res) {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admin access required' })
    }

    const requests = await prisma.request.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    res.json(requests)
  } catch (error) {
    console.error('[Get All Requests Error]', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

// Get all pending vendor applications
export async function getPendingVendors(req, res) {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admin access required' })
    }

    const pendingVendors = await prisma.user.findMany({
      where: {
        role: 'vendor',
        vendorStatus: 'pending'
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        vendorStatus: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    })

    res.json(pendingVendors)
  } catch (error) {
    console.error('[Get Pending Vendors Error]', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

// Approve vendor application
export async function approveVendor(req, res) {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admin access required' })
    }

    const { userId } = req.params

    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) }
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    if (user.role !== 'vendor') {
      return res.status(400).json({ error: 'User is not a vendor' })
    }

    const updatedUser = await prisma.user.update({
      where: { id: parseInt(userId) },
      data: { vendorStatus: 'approved' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        vendorStatus: true
      }
    })

    res.json({ message: 'Vendor approved successfully', user: updatedUser })
  } catch (error) {
    console.error('[Approve Vendor Error]', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

// Reject vendor application
export async function rejectVendor(req, res) {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admin access required' })
    }

    const { userId } = req.params

    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) }
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    if (user.role !== 'vendor') {
      return res.status(400).json({ error: 'User is not a vendor' })
    }

    const updatedUser = await prisma.user.update({
      where: { id: parseInt(userId) },
      data: { vendorStatus: 'rejected' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        vendorStatus: true
      }
    })

    res.json({ message: 'Vendor rejected successfully', user: updatedUser })
  } catch (error) {
    console.error('[Reject Vendor Error]', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
