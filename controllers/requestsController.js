import { prisma } from '../lib/prisma.js'

export async function listRequests(req, res) {
  try {
    const requests = await prisma.request.findMany({ include: { user: { select: { id: true, name: true, email: true } } } })
    res.json(requests)
  } catch (err) {
    console.error('[Requests List Error]', err)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export async function createRequest(req, res) {
  try {
    const { title, description, budget, deadline, templateId } = req.body || {}
    if (!title) return res.status(400).json({ error: 'Title is required' })
    
    const newReq = await prisma.request.create({
      data: {
        title,
        description: description || null,
        budget: budget || null,
        deadline: deadline ? new Date(deadline) : null,
        templateId: templateId ? parseInt(templateId) : null,
        status: 'open',
        userId: req.user?.sub || null
      },
      include: { user: { select: { id: true, name: true, email: true } } }
    })
    res.status(201).json(newReq)
  } catch (err) {
    console.error('[Requests Create Error]', err)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export async function closeRequest(req, res) {
  try {
    const id = Number(req.params.id)
    const item = await prisma.request.findUnique({ where: { id }, include: { user: { select: { id: true, name: true, email: true } } } })
    if (!item) return res.status(404).json({ error: 'Request not found' })
    
    const updated = await prisma.request.update({
      where: { id },
      data: { status: 'closed' },
      include: { user: { select: { id: true, name: true, email: true } } }
    })
    res.json(updated)
  } catch (err) {
    console.error('[Requests Close Error]', err)
    res.status(500).json({ error: 'Internal server error' })
  }
}
