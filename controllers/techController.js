import path from 'path'
import { fileURLToPath } from 'url'
import archiver from 'archiver'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Définir les templates disponibles avec leurs fichiers
const templates = {
  'ecommerce': {
    name: 'E-Commerce Store',
    description: 'Boutique e-commerce complète avec panier et paiement',
    files: [
      { name: 'package.json', content: JSON.stringify({ name: 'ecommerce-store', version: '1.0.0', scripts: { dev: 'next dev', build: 'next build', start: 'next start' }, dependencies: { 'next': '^14.0.0', 'react': '^18.0.0', 'stripe': '^13.0.0', 'tailwindcss': '^3.0.0' } }, null, 2) },
      { name: 'README.md', content: `# E-Commerce Store

Template e-commerce complet avec Next.js, Stripe et Tailwind CSS.

## Installation

\`\`\`bash
npm install
npm run dev
\`\`\`

## Features

- Panier d'achat
- Intégration Stripe pour les paiements
- Design responsive avec Tailwind CSS
- Next.js 14+

## Configuration

Créez un fichier \`.env.local\` :

\`\`\`
NEXT_PUBLIC_STRIPE_KEY=your_stripe_key
STRIPE_SECRET_KEY=your_stripe_secret
\`\`\`
` },
      { name: 'next.config.js', content: `/** @type {import('next').NextConfig} */
const nextConfig = {}
module.exports = nextConfig
` },
    ]
  },
  'saas-dashboard': {
    name: 'SaaS Dashboard',
    description: 'Dashboard complet pour applications SaaS',
    files: [
      { name: 'package.json', content: JSON.stringify({ name: 'saas-dashboard', version: '1.0.0', scripts: { dev: 'react-scripts start', build: 'react-scripts build' }, dependencies: { 'react': '^18.0.0', 'recharts': '^2.0.0', 'typescript': '^5.0.0', 'tailwindcss': '^3.0.0' } }, null, 2) },
      { name: 'README.md', content: `# SaaS Dashboard

Dashboard complet pour applications SaaS avec graphiques et analytics.

## Installation

\`\`\`bash
npm install
npm run dev
\`\`\`

## Features

- Graphiques avec Recharts
- TypeScript support
- Design responsive
- Analytics et métriques

## Utilisation

Démarrez le serveur de développement et accédez à http://localhost:3000
` },
    ]
  },
  'blog-platform': {
    name: 'Blog Platform',
    description: 'Plateforme de blog avec système de commentaires',
    files: [
      { name: 'package.json', content: JSON.stringify({ name: 'blog-platform', version: '1.0.0', scripts: { dev: 'next dev', build: 'next build', start: 'next start' }, dependencies: { 'next': '^14.0.0', 'mdx-js': '^2.0.0', 'react': '^18.0.0' } }, null, 2) },
      { name: 'README.md', content: `# Blog Platform

Plateforme de blog moderne avec support MDX et système de commentaires.

## Installation

\`\`\`bash
npm install
npm run dev
\`\`\`

## Features

- Support MDX pour les articles
- Système de commentaires
- SEO optimisé
- Design moderne et responsive
` },
    ]
  },
  'admin-panel': {
    name: 'Admin Panel',
    description: 'Panneau d\'administration complet et responsive',
    files: [
      { name: 'package.json', content: JSON.stringify({ name: 'admin-panel', version: '1.0.0', scripts: { dev: 'npm start', build: 'react-scripts build' }, dependencies: { 'react': '^18.0.0', 'recharts': '^2.0.0', 'react-hook-form': '^7.0.0', 'tailwindcss': '^3.0.0' } }, null, 2) },
      { name: 'README.md', content: `# Admin Panel

Panneau d'administration complet avec graphiques, tables et formulaires.

## Installation

\`\`\`bash
npm install
npm start
\`\`\`

## Features

- Graphiques avec Recharts
- Tables de données
- Formulaires validés
- Design responsive
- Dark/Light mode support
` },
    ]
  }
}

export const downloadTemplate = (req, res) => {
  try {
    const { templateId } = req.params
    const template = templates[templateId]

    if (!template) {
      return res.status(404).json({ error: 'Template not found' })
    }

    // Créer un archive ZIP
    const archive = archiver('zip', { zlib: { level: 9 } })

    res.setHeader('Content-Type', 'application/zip')
    res.setHeader('Content-Disposition', `attachment; filename="${templateId}-${Date.now()}.zip"`)

    archive.pipe(res)

    // Ajouter chaque fichier au ZIP
    template.files.forEach(file => {
      archive.append(file.content, { name: file.name })
    })

    // Ajouter un dossier src vide avec index.js
    archive.append('// Your code here\n', { name: 'src/index.js' })
    archive.append('body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif; }\n', { name: 'src/styles.css' })

    archive.finalize()

    archive.on('error', (err) => {
      console.error('Archive error:', err)
      res.status(500).json({ error: 'Failed to create archive' })
    })
  } catch (error) {
    console.error('Download template error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const getTemplates = (req, res) => {
  try {
    const templatesList = Object.entries(templates).map(([id, template]) => ({
      id,
      name: template.name,
      description: template.description,
      filesCount: template.files.length
    }))

    res.json({ templates: templatesList })
  } catch (error) {
    console.error('Get templates error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
