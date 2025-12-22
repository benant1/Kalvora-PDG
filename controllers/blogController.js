import { prisma } from '../lib/prisma.js'

export async function listPosts(req, res) {
  try {
    const { q } = req.query
    const where = q ? {
      OR: [
        { title: { contains: q } },
        { excerpt: { contains: q } },
        { slug: { contains: q } }
      ]
    } : {}
    
    const posts = await prisma.blogPost.findMany({ where, select: { id: true, slug: true, title: true, excerpt: true, date: true } })
    res.json(posts)
  } catch (err) {
    console.error('[Blog List Error]', err)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export async function getPost(req, res) {
  try {
    const post = await prisma.blogPost.findUnique({ where: { slug: req.params.slug } })
    if (!post) return res.status(404).json({ error: 'Post not found' })
    res.json(post)
  } catch (err) {
    console.error('[Blog Detail Error]', err)
    res.status(500).json({ error: 'Internal server error' })
  }
}
