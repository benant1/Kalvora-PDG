import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Get all templates
export async function getAllTemplates(req, res) {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admin access required' })
    }

    const templates = await prisma.template.findMany({
      orderBy: { createdAt: 'desc' }
    })

    res.json(templates)
  } catch (error) {
    console.error('[Get All Templates Error]', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

// Create template
export async function createTemplate(req, res) {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admin access required' })
    }

    const { name, description, category, price, imageUrl, demoUrl, downloadUrl, featured } = req.body

    if (!name || !description || !category || price === undefined) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    if (!['web', 'mobile', 'design'].includes(category)) {
      return res.status(400).json({ error: 'Invalid category. Must be web, mobile, or design' })
    }

    const template = await prisma.template.create({
      data: {
        name,
        description,
        category,
        price: parseFloat(price),
        imageUrl,
        demoUrl,
        downloadUrl,
        featured: featured || false
      }
    })

    res.status(201).json(template)
  } catch (error) {
    console.error('[Create Template Error]', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

// Update template
export async function updateTemplate(req, res) {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admin access required' })
    }

    const { id } = req.params
    const { name, description, category, price, imageUrl, demoUrl, downloadUrl, featured } = req.body

    if (category && !['web', 'mobile', 'design'].includes(category)) {
      return res.status(400).json({ error: 'Invalid category. Must be web, mobile, or design' })
    }

    const updateData = {}
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (category !== undefined) updateData.category = category
    if (price !== undefined) updateData.price = parseFloat(price)
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl
    if (demoUrl !== undefined) updateData.demoUrl = demoUrl
    if (downloadUrl !== undefined) updateData.downloadUrl = downloadUrl
    if (featured !== undefined) updateData.featured = featured

    const template = await prisma.template.update({
      where: { id: parseInt(id) },
      data: updateData
    })

    res.json(template)
  } catch (error) {
    console.error('[Update Template Error]', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

// Delete template
export async function deleteTemplate(req, res) {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admin access required' })
    }

    const { id } = req.params

    await prisma.template.delete({
      where: { id: parseInt(id) }
    })

    res.json({ message: 'Template deleted successfully' })
  } catch (error) {
    console.error('[Delete Template Error]', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

// Get all designs
export async function getAllDesigns(req, res) {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admin access required' })
    }

    const designs = await prisma.design.findMany({
      orderBy: { createdAt: 'desc' }
    })

    res.json(designs)
  } catch (error) {
    console.error('[Get All Designs Error]', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

// Create design
export async function createDesign(req, res) {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admin access required' })
    }

    const { title, description, category, imageUrl, price, featured } = req.body

    if (!title || !description || !category || !imageUrl || price === undefined) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    if (!['logo', 'ui', 'graphic', 'illustration'].includes(category)) {
      return res.status(400).json({ error: 'Invalid category. Must be logo, ui, graphic, or illustration' })
    }

    const design = await prisma.design.create({
      data: {
        title,
        description,
        category,
        imageUrl,
        price: parseFloat(price),
        featured: featured || false
      }
    })

    res.status(201).json(design)
  } catch (error) {
    console.error('[Create Design Error]', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

// Update design
export async function updateDesign(req, res) {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admin access required' })
    }

    const { id } = req.params
    const { title, description, category, imageUrl, price, featured } = req.body

    if (category && !['logo', 'ui', 'graphic', 'illustration'].includes(category)) {
      return res.status(400).json({ error: 'Invalid category. Must be logo, ui, graphic, or illustration' })
    }

    const updateData = {}
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (category !== undefined) updateData.category = category
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl
    if (price !== undefined) updateData.price = parseFloat(price)
    if (featured !== undefined) updateData.featured = featured

    const design = await prisma.design.update({
      where: { id: parseInt(id) },
      data: updateData
    })

    res.json(design)
  } catch (error) {
    console.error('[Update Design Error]', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

// Delete design
export async function deleteDesign(req, res) {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admin access required' })
    }

    const { id } = req.params

    await prisma.design.delete({
      where: { id: parseInt(id) }
    })

    res.json({ message: 'Design deleted successfully' })
  } catch (error) {
    console.error('[Delete Design Error]', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
