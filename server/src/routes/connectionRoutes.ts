import { Router } from 'express';
import { ConnectionController } from '../controllers/connectionController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authMiddleware);

router.get('/', ConnectionController.getMyConnections);
router.post('/request', ConnectionController.sendRequest);
router.put('/respond/:id', ConnectionController.respondRequest);
router.get('/kinship/:otherUserId', ConnectionController.getKinshipWithUser);

export default router;

