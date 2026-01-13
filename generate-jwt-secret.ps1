# Script PowerShell pour générer un JWT_SECRET sécurisé
# Usage: .\generate-jwt-secret.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Génération de JWT_SECRET" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Méthode 1 : Avec Node.js (si disponible)
try {
    $jwtSecret = node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
    Write-Host "✅ JWT_SECRET généré avec Node.js:" -ForegroundColor Green
    Write-Host ""
    Write-Host "JWT_SECRET=$jwtSecret" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Copiez cette valeur dans votre fichier .env ou Vercel Environment Variables" -ForegroundColor White
} catch {
    # Méthode 2 : Avec PowerShell natif
    Write-Host "⚠️  Node.js non disponible, utilisation de PowerShell..." -ForegroundColor Yellow
    Write-Host ""
    
    $bytes = New-Object byte[] 32
    [System.Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
    $jwtSecret = [Convert]::ToBase64String($bytes)
    
    Write-Host "✅ JWT_SECRET généré avec PowerShell:" -ForegroundColor Green
    Write-Host ""
    Write-Host "JWT_SECRET=$jwtSecret" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Copiez cette valeur dans votre fichier .env ou Vercel Environment Variables" -ForegroundColor White
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "⚠️  IMPORTANT :" -ForegroundColor Red
Write-Host "- Ne partagez JAMAIS cette clé" -ForegroundColor Red
Write-Host "- Ne commitez JAMAIS cette clé dans Git" -ForegroundColor Red
Write-Host "- Utilisez cette clé uniquement en production" -ForegroundColor Red
Write-Host "========================================" -ForegroundColor Cyan
