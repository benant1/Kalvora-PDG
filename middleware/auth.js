import jwt from 'jsonwebtoken'

// Vérifier que JWT_SECRET est configuré
const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET || JWT_SECRET === 'dev-secret') {
  if (process.env.NODE_ENV === 'production') {
    console.error('❌ ERREUR CRITIQUE: JWT_SECRET n\'est pas configuré en production!')
    console.error('Configurez JWT_SECRET dans vos variables d\'environnement Vercel.')
    console.error('L\'application continuera avec une valeur par défaut temporaire.')
    // Ne pas faire planter l'app en production sur Vercel (serverless)
    // L'utilisateur doit configurer JWT_SECRET dans Vercel Dashboard
  } else {
    console.warn('⚠️  ATTENTION: JWT_SECRET utilise la valeur par défaut. Configurez-le pour la production.')
  }
}

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) return res.status(401).json({ error: 'Unauthorized' })
  try {
    const secret = JWT_SECRET || 'dev-secret'
    const payload = jwt.verify(token, secret)
    req.user = { id: payload.sub, role: payload.role }
    next()
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' })
  }
}

export function issueToken(user) {
  const secret = JWT_SECRET || 'dev-secret'
  return jwt.sign({ sub: user.id, role: user.role || 'user' }, secret, { expiresIn: '1h' })
}
