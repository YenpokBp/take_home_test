import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

import authRoutes from './routes/auth.routes.js';
import walletRoutes from './routes/wallet.routes.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { verifyCsrf } from './middlewares/csrf.js';

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true })); // credentials: agar cookie bisa dikirim
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());
app.use(verifyCsrf);

app.use('/api/auth', authRoutes);
app.use('/api/wallet', walletRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Endpoint tidak ditemukan' });
});
app.use(errorHandler);

export default app;
