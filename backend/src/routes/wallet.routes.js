import { Router } from 'express';
import * as ctrl from '../controllers/wallet.controller.js';
import { authenticate } from '../middlewares/auth.js';

const router = Router();

router.use(authenticate); // semua endpoint wallet wajib login

router.get('/balance', ctrl.balance);
router.post('/topup', ctrl.topUp);
router.post('/transfer', ctrl.transfer);
router.get('/transactions', ctrl.history);

export default router;
