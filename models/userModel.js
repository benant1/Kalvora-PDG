import fs from 'fs'
import path from 'path'

const usersPath = path.join(process.cwd(), 'models', 'users.json')

function loadUsers() {
  if (!fs.existsSync(usersPath)) {
    fs.writeFileSync(usersPath, JSON.stringify([]), 'utf-8')
    return []
  }
  return JSON.parse(fs.readFileSync(usersPath, 'utf-8'))
}

function saveUsers(users) {
  fs.writeFileSync(usersPath, JSON.stringify(users, null, 2), 'utf-8')
}

export function getAllUsers() {
  return loadUsers()
}

export function getUserByEmail(email) {
  const users = loadUsers()
  return users.find(u => u.email.toLowerCase() === email.toLowerCase())
}

export function getUserById(id) {
  const users = loadUsers()
  return users.find(u => u.id === id)
}

export function createUser(userData) {
  const users = loadUsers()
  const newUser = {
    id: users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1,
    ...userData,
    createdAt: new Date().toISOString()
  }
  users.push(newUser)
  saveUsers(users)
  return newUser
}

export function updateUser(id, updates) {
  const users = loadUsers()
  const idx = users.findIndex(u => u.id === id)
  if (idx === -1) return null
  users[idx] = { ...users[idx], ...updates, updatedAt: new Date().toISOString() }
  saveUsers(users)
  return users[idx]
}

export function deleteUser(id) {
  const users = loadUsers()
  const filtered = users.filter(u => u.id !== id)
  saveUsers(filtered)
  return filtered.length < users.length
}
