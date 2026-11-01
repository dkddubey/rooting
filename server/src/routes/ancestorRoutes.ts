import { Router } from 'express';
import { AncestorController } from '../controllers/ancestorController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authMiddleware);

router.get('/', AncestorController.getMyAncestors);
router.get('/tree', AncestorController.getTreeGraph);
router.post('/', AncestorController.createAncestor);
router.put('/:id', AncestorController.updateAncestor);
router.delete('/:id', AncestorController.deleteAncestor);

export default router;

