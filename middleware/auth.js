import jwt from 'jsonwebtoken'

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) return res.status(401).json({ error: 'Unauthorized' })
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret')
    req.user = { id: payload.sub, role: payload.role }
    next()
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' })
  }
}

export function issueToken(user) {
  return jwt.sign({ sub: user.id, role: user.role || 'user' }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '1h' })
}
