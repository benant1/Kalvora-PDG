import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { issueToken } from '../middleware/auth.js'
import { sendVerificationEmail } from '../services/emailService.js'

const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  role: z.enum(['user', 'designer', 'developer', 'seller', 'vendor', 'admin']).optional()
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
})

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
})

export async function signup(req, res) {
  try {
    const validated = signupSchema.parse(req.body)
    
    const existing = await prisma.user.findUnique({ where: { email: validated.email } })
    if (existing) {
      return res.status(400).json({ error: 'Email already registered' })
    }

    const hashedPassword = await bcrypt.hash(validated.password, 10)
    
    // Everyone starts as their selected role, no special treatment
    let userRole = validated.role || 'user'
    
    // create user but mark email as unverified and store verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()
    const expires = new Date()
    expires.setHours(expires.getHours() + 1) // code valid 1 hour

    const user = await prisma.user.create({
      data: {
        name: validated.name,
        email: validated.email,
        password: hashedPassword,
        role: userRole,
        emailVerified: false,
        emailVerificationCode: verificationCode,
        emailVerificationExpires: expires
      }
    })

    // Send verification email (best-effort)
    try {
      await sendVerificationEmail({ email: validated.email, name: validated.name, code: verificationCode })
    } catch (e) {
      console.error('Failed sending verification email:', e)
    }

    const { password, ...userWithoutPassword } = user

    res.status(201).json({ 
      message: 'User created. Verification email sent. Please confirm to login.',
      user: userWithoutPassword 
    })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', issues: err.issues })
    }
    console.error('[Signup Error]', err)
    res.status(500).json({ error: 'Internal server error' })
  }
}

// Confirm email endpoint
export async function confirmEmail(req, res) {
  try {
    const { email, code } = req.body
    if (!email || !code) return res.status(400).json({ error: 'Email and code are required' })

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) return res.status(404).json({ error: 'User not found' })
    if (user.emailVerified) return res.status(400).json({ error: 'Email already verified' })

    if (!user.emailVerificationCode || !user.emailVerificationExpires) {
      return res.status(400).json({ error: 'No verification code found' })
    }

    const now = new Date()
    if (now > user.emailVerificationExpires) {
      return res.status(400).json({ error: 'Verification code expired' })
    }

    if (user.emailVerificationCode !== code.toString()) {
      return res.status(400).json({ error: 'Invalid verification code' })
    }

    // mark verified and clear code
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true, emailVerificationCode: null, emailVerificationExpires: null }
    })

    const token = issueToken(updated)
    const { password, ...userWithoutPassword } = updated

    res.json({ message: 'Email verified', token, user: userWithoutPassword })
  } catch (error) {
    console.error('[Confirm Email Error]', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export async function login(req, res) {
  try {
    const validated = loginSchema.parse(req.body)
    
    const user = await prisma.user.findUnique({ where: { email: validated.email } })
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const validPassword = await bcrypt.compare(validated.password, user.password)
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    // Require email verification before allowing login
    if (!user.emailVerified) {
      return res.status(403).json({ error: 'Email not verified. Please check your inbox and confirm your email.' })
    }

    const { password, ...userWithoutPassword } = user
    const token = issueToken(user)

    // S'assurer que l'URL de l'avatar est complète
    let userResponse = { ...userWithoutPassword }
    if (userResponse.avatar && !userResponse.avatar.startsWith('http') && !userResponse.avatar.startsWith('https')) {
      const baseUrl = process.env.API_BASE_URL || 'https://kalvora-pdg.vercel.app'
      userResponse.avatar = userResponse.avatar.startsWith('/') 
        ? `${baseUrl}${userResponse.avatar}`
        : `${baseUrl}/${userResponse.avatar}`
    }

    res.json({ 
      message: 'Login successful',
      token, 
      user: userResponse
    })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', issues: err.issues })
    }
    console.error('[Login Error]', err)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export async function me(req, res) {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        vendorStatus: true,
        createdAt: true
      }
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.json(user)
  } catch (error) {
    console.error('[Me Error]', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export function logout(req, res) {
  res.json({ message: 'Logout successful' })
}
