import { Router } from 'express';
import { getStores, getStoreDetails, getStorePerformance } from '../controllers/store.controller';

const router = Router();

router.get('/', getStores);
router.get('/:id', getStoreDetails);
router.get('/:id/performance', getStorePerformance);

export default router;