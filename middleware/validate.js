import { ZodError } from 'zod'

export function validate(schema, source = 'body') {
  return (req, res, next) => {
    try {
      const data = schema.parse(req[source])
      req[source] = data
      next()
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json({ error: 'Validation failed', issues: err.issues })
      }
      next(err)
    }
  }
}
