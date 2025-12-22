import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const prisma = new PrismaClient()

// Update profile (name, email)
export async function updateProfile(req, res) {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const schema = z.object({
      name: z.string().min(1, 'Name is required'),
      email: z.string().email('Invalid email'),
    })

    const { name, email } = schema.parse(req.body)

    // Check if email is already taken by another user
    if (email !== req.user.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email }
      })
      if (existingUser && existingUser.id !== userId) {
        return res.status(400).json({ error: 'Email already in use' })
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { name, email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        createdAt: true
      }
    })

    res.json(updatedUser)
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', issues: err.issues })
    }
    console.error('[Update Profile Error]', err)
    res.status(500).json({ error: 'Internal server error' })
  }
}

// Update password
export async function updatePassword(req, res) {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const schema = z.object({
      currentPassword: z.string().min(1, 'Current password is required'),
      newPassword: z.string().min(8, 'Password must be at least 8 characters'),
    })

    const { currentPassword, newPassword } = schema.parse(req.body)

    // Get current user with password
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.password)
    if (!isValid) {
      return res.status(400).json({ error: 'Current password is incorrect' })
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    })

    res.json({ message: 'Password updated successfully' })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', issues: err.issues })
    }
    console.error('[Update Password Error]', err)
    res.status(500).json({ error: 'Internal server error' })
  }
}

// Update avatar
export async function updateAvatar(req, res) {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { avatar } = req.body
    if (!avatar) {
      return res.status(400).json({ error: 'Avatar URL is required' })
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { avatar },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        createdAt: true
      }
    })

    res.json(updatedUser)
  } catch (err) {
    console.error('[Update Avatar Error]', err)
    res.status(500).json({ error: 'Internal server error' })
  }
}

// Delete account
export async function deleteAccount(req, res) {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    // Delete user and all related data (cascade will handle requests)
    await prisma.user.delete({
      where: { id: userId }
    })

    res.json({ message: 'Account deleted successfully' })
  } catch (err) {
    console.error('[Delete Account Error]', err)
    res.status(500).json({ error: 'Internal server error' })
  }
}
