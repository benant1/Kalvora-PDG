import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

import apiRouter from './routes/index.js'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 4000

// Configuration CORS
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:4000',
  'https://kalvora-pdg.vercel.app',
  'https://kalvora-pdg-frontend.vercel.app',
  'https://kalvora-odkkb92xx-benant1s-projects.vercel.app',
  /^https:\/\/kalvora-.*-benant1s-projects\.vercel\.app$/ // Pattern pour les déploiements de prévisualisation Vercel
]

const corsOptions = {
  origin: function (origin, callback) {
    // Autoriser les requêtes sans origine (comme les applications mobiles ou Postman)
    if (!origin) return callback(null, true)
    
    // Vérifier si l'origine est dans la liste blanche
    if (allowedOrigins.some(allowedOrigin => {
      if (typeof allowedOrigin === 'string') {
        return origin === allowedOrigin
      } else if (allowedOrigin instanceof RegExp) {
        return allowedOrigin.test(origin)
      }
      return false
    })) {
      return callback(null, true)
    }
    
    return callback(new Error('Not allowed by CORS'))
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  credentials: true,
  optionsSuccessStatus: 204,
  preflightContinue: false
}

// Configuration de sécurité
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false
}))

// Middleware CORS
app.use(cors(corsOptions))
app.use(express.json())
app.use(morgan('dev'))

// Gestionnaire pour les requêtes OPTIONS (prévol)
app.options('*', cors(corsOptions), (req, res) => {
  res.status(200).send()
})

// Middleware CORS spécifique pour les fichiers uploadés
app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.header('Cross-Origin-Resource-Policy', 'cross-origin')
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200)
  }
  next()
})
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res, path) => {
    res.set('Access-Control-Allow-Origin', '*')
    res.set('Cross-Origin-Resource-Policy', 'cross-origin')
  }
}))

app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), timestamp: Date.now() })
})

// Route racine
app.get('/', (req, res) => {
  res.json({
    message: 'Bienvenue sur l\'API Kalvora PDG',
    version: '1.0.0',
    documentation: 'https://github.com/benant1/Kalvora-PDG',
    health: '/health',
    api: '/api/v1'
  })
})

// Routes API
app.use('/api/v1', apiRouter)

// Gestion des erreurs 404
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not Found',
    message: `La route ${req.method} ${req.path} n'existe pas`,
    availableRoutes: ['/api/v1', '/health']
  })
})

app.use((err, req, res, next) => {
  console.error('[Error]', err)
  res.status(500).json({ error: 'Internal Server Error' })
})

app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`)
})
