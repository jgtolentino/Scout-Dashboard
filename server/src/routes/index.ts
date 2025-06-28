import { Router } from 'express';
import salesRoutes from './sales.routes';
import productRoutes from './product.routes';
import storeRoutes from './store.routes';
import analyticsRoutes from './analytics.routes';

const router = Router();

router.use('/sales', salesRoutes);
router.use('/products', productRoutes);
router.use('/stores', storeRoutes);
router.use('/analytics', analyticsRoutes);

export default router;