import { Router } from 'express'
import blogRouter from './blog.js'
import marketRouter from './market.js'
import requestsRouter from './requests.js'
import authRouter from './auth.js'
import userRouter from './userRoutes.js'
import adminRouter from './adminRoutes.js'
import vendorRouter from './vendorRoutes.js'
import techRouter from './tech.js'
import uploadRouter from './upload.js'
import socialShareRouter from './socialShare.js'

const router = Router()

router.get('/', (req, res) => {
  res.json({ message: "Bienvenue sur l'API v1" })
})

router.use('/blog', blogRouter)
router.use('/market', marketRouter)
router.use('/requests', requestsRouter)
router.use('/auth', authRouter)
router.use('/user', userRouter)
router.use('/admin', adminRouter)
router.use('/vendor', vendorRouter)
router.use('/tech', techRouter)
router.use('/upload', uploadRouter)
router.use('/social', socialShareRouter)

export default router
