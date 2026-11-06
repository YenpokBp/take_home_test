import { Router } from 'express';
import * as ctrl from '../controllers/wallet.controller.js';
import { authenticate } from '../middlewares/auth.js';
import { validateBody } from '../middlewares/validate.js';

const router = Router();

router.use(authenticate); // semua endpoint wallet wajib login

router.get('/balance', ctrl.balance);
router.post('/topup', validateBody, ctrl.topUp);
router.post('/transfer', validateBody, ctrl.transfer);
router.get('/transactions', ctrl.history);

export default router;
