import nodemailer from 'nodemailer'
import dotenv from 'dotenv'

dotenv.config()

// Configuration du transporteur email
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
})

// Envoyer email de bienvenue vendeur avec code d'activation
export async function sendVendorApprovalEmail(vendorData) {
  const { email, name, storeName, activationCode } = vendorData

  const mailOptions = {
    from: `"LUMYNIS Platform" <${process.env.SMTP_USER}>`,
    to: email,
    subject: '🎉 Votre espace vendeur a été approuvé !',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .activation-code { background: white; padding: 30px; border: 2px solid #667eea; border-radius: 10px; margin: 20px 0; text-align: center; }
          .code { font-size: 48px; font-weight: bold; color: #667eea; letter-spacing: 10px; font-family: monospace; }
          .code-label { color: #999; font-size: 14px; margin-bottom: 10px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
          .footer { text-align: center; margin-top: 30px; color: #999; font-size: 12px; }
          .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 5px; color: #856404; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✨ Félicitations ${name} !</h1>
            <p>Votre demande vendeur a été approuvée</p>
          </div>
          <div class="content">
            <h2>Bienvenue sur LUMYNIS - Espace Vendeur</h2>
            <p>Nous sommes ravis de vous compter parmi nos vendeurs ! Votre boutique <strong>"${storeName}"</strong> est maintenant active.</p>
            
            <div class="activation-code">
              <div class="code-label">Votre code d'activation</div>
              <div class="code">${activationCode}</div>
              <p style="color: #999; margin-top: 15px; font-size: 14px;">Code valide pour 24 heures</p>
            </div>

            <div class="warning">
              ⚠️ <strong>Important :</strong> Ce code d'activation ne doit être partagé avec personne. Il vous permettra de configurer votre PIN d'accès personnel.
            </div>

            <h3>📊 Prochaines étapes :</h3>
            <ol>
              <li>Allez sur votre <strong>Espace de Publication</strong></li>
              <li>Entrez le code d'activation à 4 chiffres reçu ci-dessus</li>
              <li>Définissez votre PIN personnel à 4 chiffres</li>
              <li>Utilisez votre PIN pour accéder à votre espace à chaque connexion</li>
              <li>Commencez à publier vos produits</li>
            </ol>

            <a href="http://localhost:3000/market/publication-space/verify-code" class="button">Activer mon compte</a>

            <div class="footer">
              <p>Besoin d'aide ? Contactez notre support : support@lumynis.com</p>
              <p>&copy; 2025 LUMYNIS - Tous droits réservés</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `
  }

  try {
    await transporter.sendMail(mailOptions)
    console.log(`✓ Email d'approbation envoyé à ${email}`)
    return true
  } catch (error) {
    console.error('✗ Erreur envoi email:', error)
    return false
  }
}

// Envoyer email de rejet
export async function sendVendorRejectionEmail(vendorData) {
  const { email, name, reason } = vendorData

  const mailOptions = {
    from: `"LUMYNIS Platform" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Information concernant votre demande vendeur',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #e74c3c; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .footer { text-align: center; margin-top: 30px; color: #999; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Information importante</h1>
          </div>
          <div class="content">
            <p>Bonjour ${name},</p>
            <p>Nous vous remercions pour votre intérêt à devenir vendeur sur LUMYNIS.</p>
            <p>Malheureusement, après examen de votre dossier, nous ne pouvons pas approuver votre demande pour le moment.</p>
            ${reason ? `<p><strong>Raison :</strong> ${reason}</p>` : ''}
            <p>Vous pouvez soumettre une nouvelle demande après avoir vérifié les critères requis.</p>
            <div class="footer">
              <p>Pour toute question : support@lumynis.com</p>
              <p>&copy; 2025 LUMYNIS</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `
  }

  try {
    await transporter.sendMail(mailOptions)
    console.log(`✓ Email de rejet envoyé à ${email}`)
    return true
  } catch (error) {
    console.error('✗ Erreur envoi email:', error)
    return false
  }
}

// Envoyer email de vérification pour nouvel utilisateur
export async function sendVerificationEmail({ email, name, code }) {
  const mailOptions = {
    from: `"Kalvora" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Veuillez vérifier votre adresse email',
    html: `
      <div style="font-family:Arial, Helvetica, sans-serif; line-height:1.6; color:#333;">
        <h2>Bienvenue sur Kalvora, ${name} 👋</h2>
        <p>Merci de vous être inscrit. Voici votre code de vérification :</p>
        <div style="font-size:28px; font-weight:bold; background:#f5f5f5; padding:12px; display:inline-block; border-radius:6px;">${code}</div>
        <p>Ce code est valide pendant 1 heure. Si vous n'avez pas demandé cet email, ignorez-le.</p>
        <p>Ou cliquez ici pour confirmer : <a href="http://localhost:3000/confirm-email">Confirmer mon email</a></p>
        <hr/>
        <p style="color:#777; font-size:12px;">&copy; 2025 Kalvora</p>
      </div>
    `
  }

  try {
    await transporter.sendMail(mailOptions)
    console.log(`✓ Verification email sent to ${email}`)
    return true
  } catch (error) {
    console.error('✗ Error sending verification email:', error)
    return false
  }
}
