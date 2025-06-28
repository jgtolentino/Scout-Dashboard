import { Router } from 'express';
import { getDashboardData, getGeographicAnalytics, getCustomerAnalytics } from '../controllers/analytics.controller';

const router = Router();

router.get('/dashboard', getDashboardData);
router.get('/geographic', getGeographicAnalytics);
router.get('/customers', getCustomerAnalytics);

export default router;