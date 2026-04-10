import { Router } from 'express';
import { getCacheValue, setCacheValue, deleteCacheValue } from './cache.controller';
import { requireAuth } from '../../middleware/auth';

const router = Router();

// Require authorization for all cache endpoints so mobile clients 
// need a valid token to interact with remote Redis caching
router.use(requireAuth);

router.get('/:key', getCacheValue);
router.post('/', setCacheValue);
router.delete('/:key', deleteCacheValue);

export default router;
