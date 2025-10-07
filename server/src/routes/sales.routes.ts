import { Router } from 'express';
import { getSalesData, getSalesSummary, getSalesTrends } from '../controllers/sales.controller';

const router = Router();

router.get('/', getSalesData);
router.get('/summary', getSalesSummary);
router.get('/trends', getSalesTrends);

export default router;