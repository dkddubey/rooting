import { Router } from 'express';
import { MatchController } from '../controllers/matchController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authMiddleware);

router.get('/', MatchController.getMyMatches);
router.post('/:id/accept', MatchController.acceptMatch);
router.post('/:id/dismiss', MatchController.dismissMatch);
router.post('/scan', MatchController.triggerScan);

export default router;

