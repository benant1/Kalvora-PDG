import { Router } from 'express'
import { listRequests, createRequest, closeRequest } from '../controllers/requestsController.js'
import { requireAuth } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { z } from 'zod'

const router = Router()

const createRequestSchema = z.object({
	title: z.string().min(3),
	description: z.string().optional(),
	budget: z.string().optional(),
	deadline: z.string().datetime().optional(),
	templateId: z.number().optional()
})

router.get('/', listRequests)
router.post('/', validate(createRequestSchema), createRequest)
router.patch('/:id/close', requireAuth, closeRequest)

export default router
