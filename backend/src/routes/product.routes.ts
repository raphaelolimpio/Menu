import { Router } from 'express';
import { ProductController } from '../controllers/product.controller';
import { upload } from '../middlewares/upload.middleware';
import { authMiddleware } from '../middlewares/auth.middleware';


const router = Router();


router.get('/', ProductController.list);
router.get('/:id', ProductController.getById);

router.post('/', authMiddleware, upload.single('file3d'), ProductController.create);
router.put('/:id', authMiddleware, upload.single('file3d'), ProductController.update);
router.delete('/:id', authMiddleware, ProductController.delete);

export default router;