import { Router } from 'express';
import { getProducts, getProductPerformance, getTopProducts } from '../controllers/product.controller';

const router = Router();

router.get('/', getProducts);
router.get('/performance', getProductPerformance);
router.get('/top', getTopProducts);

export default router;