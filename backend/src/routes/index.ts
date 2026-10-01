import { Router } from 'express';
import productRoutes from './product.routes';
import customerRoutes from './customer.routes';
import orderRoutes from './order.routes';
import uploadRoutes from './upload.routes';
import userStoreRoutes from './user-store.routes';

const router = Router();

router.use('/products', productRoutes);
router.use('/customers', customerRoutes);
router.use('/orders', orderRoutes);
router.use('/upload', uploadRoutes);  
router.use('/', userStoreRoutes);


export default router;