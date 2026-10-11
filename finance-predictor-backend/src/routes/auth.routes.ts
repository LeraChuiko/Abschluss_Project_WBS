import { Router } from 'express';
import { validate } from '../middleware/validate.ts';
import { requireAuth } from '../middleware/requireAuth.ts';
import { loginSchema, registerSchema } from '../schemas/auth.schema.ts';
import { login, me, register } from '../controllers/auth.controller.ts';

const router = Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.get('/me', requireAuth, me);

export default router;
