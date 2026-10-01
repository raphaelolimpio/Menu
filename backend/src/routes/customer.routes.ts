import { Router } from 'express';
import { CustomerController } from '../controllers/customer.controller';

const router = Router();


router.get('/', CustomerController.list);
router.post('/', CustomerController.create);
router.put('/:id', CustomerController.update);

export default router;