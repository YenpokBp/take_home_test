# Mini Wallet API (Backend)

## Cara menjalankan
1. `npm install`
2. Buat database lalu import schema:
   ```
   mysql -u root -p -e "CREATE DATABASE mini_wallet"
   mysql -u root -p mini_wallet < src/config/mini_wallet.sql
   ```
3. Sesuaikan `.env` (DB_USER, DB_PASSWORD, JWT_SECRET)
4. `npm run dev`  -> http://localhost:5000

## Endpoint
| Method | URL | Auth |
|---|---|---|
| POST | /api/auth/register | - |
| POST | /api/auth/login | - |
| POST | /api/auth/logout | - |
| GET  | /api/auth/me | Ya |
| GET  | /api/wallet/balance | Ya |
| POST | /api/wallet/topup | Ya |
| POST | /api/wallet/transfer | Ya |
| GET  | /api/wallet/transactions?page=1&limit=10 | Ya |

Catatan: user seed (budi, sari) di file SQL punya password_hash placeholder, jadi tidak bisa login. Buat user baru lewat /api/auth/register.
