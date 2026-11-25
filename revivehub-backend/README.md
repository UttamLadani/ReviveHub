# ReviveHub Backend

Express + MongoDB (Mongoose) API for ReviveHub. It handles login (JWT), role checks, listings, admin approval, and orders with commission.

## 1. Install

You need Node.js (LTS). In this folder:

```
npm install
```

## 2. Create your `.env` file

Copy `.env.example` to `.env` and fill it in (never commit or share `.env`):

```
MONGODB_URI=mongodb+srv://<db_user>:<db_password>@<cluster>.mongodb.net/revivehub?retryWrites=true&w=majority
JWT_SECRET=<any long random text, 32+ characters>
CLIENT_ORIGIN=http://localhost:5173
PORT=5000
ADMIN_EMAIL=admin@revivehub.demo
ADMIN_PASSWORD=Admin@123
```

- In Atlas: **Connect → Drivers → Node.js**, copy the string, put your database user's password in place of `<db_password>`, and add `/revivehub` after `.net` (that is the database name).
- A password with symbols such as `@` or `#` must be URL-encoded.
- Atlas → **Network Access** must allow your IP (or `0.0.0.0/0` for development).
- To make a random `JWT_SECRET`: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

## 3. Fill the database with sample data (once)

```
npm run seed
```

This creates the admin account, the two demo accounts and some sample listings and orders (all made up). Other commands:

- `npm run seed -- --reset` wipes users, listings and orders, then fills again
- `npm run seed:admin` only creates the admin account (nothing else)

Admin accounts are created only here. The register endpoint refuses `role: "admin"`.

## 4. Run

```
npm run dev
```

The API runs on http://localhost:5000 (check http://localhost:5000/api/health). Then start the frontend.

## Endpoints

| Method and path | Who | What |
|---|---|---|
| POST `/api/auth/register` | public | Create a seller or buyer account |
| POST `/api/auth/login` | public | Log in, returns a token |
| GET `/api/auth/me` | logged in | Who am I |
| GET `/api/listings` | buyer, admin | Search live lots (`query, categories, conditions, minPrice, maxPrice, city, sort`) |
| GET `/api/listings/:id` | logged in | One listing (drafts and pending ones only for their owner or an admin) |
| GET `/api/listings/mine` | seller | My listings |
| POST `/api/listings`, PUT `/api/listings/:id` | seller | Save draft or submit (`submit: true`) |
| POST `/api/listings/import` | seller | Import CSV rows as drafts |
| PATCH `/api/listings/:id/withdraw` | seller | Take a live listing down |
| GET `/api/admin/listings?status=pending` | admin | Approval queue |
| PATCH `/api/admin/listings/:id` | admin | `{decision: "approve"}` or `{decision: "reject", reason}` |
| POST `/api/orders` | buyer | Place an order (stock is reduced in one atomic step) |
| GET `/api/orders/mine`, `/api/orders/seller`, `/api/admin/orders` | buyer, seller, admin | Order lists |
| GET `/api/orders/:id` | buyer, seller or admin of that order | One order |
| PATCH `/api/orders/:id/status` | by role | `accept, decline, dispatch, cancel, receive, close` |

## How it is protected

- Passwords are stored as bcrypt hashes and never sent back.
- Every route except register, login and health needs a valid token. The user and role are loaded from the database on each request, so the browser cannot claim a different role.
- Sellers can only change their own listings, and buyers and sellers can only see their own orders.
- State changes (approve, order steps, stock) check the current status inside the database update, so a double click or two buyers at once cannot break the rules.
- `helmet`, CORS limited to `CLIENT_ORIGIN`, a request size limit, and a rate limit on login and register.

## Not done yet

- Delivery cost is still calculated in the browser and sent with the order. The next step is to calculate it on the server (postal-code distance API).
- Photos are stored inside the listing. Cloudinary is the planned replacement.
- The AI price suggestion is still a stand-in (Python service later).
