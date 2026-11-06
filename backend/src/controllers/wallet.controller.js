import * as walletService from '../services/wallet.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const balance = asyncHandler(async (req, res) => {
  const balance = await walletService.getBalance(req.user.id);
  res.json({ success: true, data: { balance } });
});

export const topUp = asyncHandler(async (req, res) => {
  const data = await walletService.topUp(req.user.id, req.body);
  res.status(201).json({ success: true, message: 'Top-up berhasil', data });
});

export const transfer = asyncHandler(async (req, res) => {
  const data = await walletService.transfer(req.user.id, req.body);
  res.status(201).json({ success: true, message: 'Transfer berhasil', data });
});

export const history = asyncHandler(async (req, res) => {
  const data = await walletService.getHistory(req.user.id, req.query);
  res.json({ success: true, data });
});
