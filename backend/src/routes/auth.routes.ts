import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { TeamController } from '../controllers/team.controller';
import { authMiddleware, requireOwner } from '../middlewares/auth.middleware';

const router = Router();



router.post('/register', AuthController.register);
router.post('/login', AuthController.login);

router.get('/team/:storeId', authMiddleware, TeamController.listTeam);
router.patch('/team/:sellerId', authMiddleware, requireOwner, TeamController.updateSellerPermissions);
router.post('/forgot-password', AuthController.forgotPassword);
router.post('/reset-password', AuthController.resetPassword);

export default router;