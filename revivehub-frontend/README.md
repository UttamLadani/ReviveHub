# ReviveHub Frontend

React frontend for **ReviveHub**, an AI-powered marketplace where shutting-down startups sell their unsold inventory to businesses.

Built with **Vite + React + React Router + plain CSS**. It talks to the **ReviveHub backend** (Express + MongoDB) in the `revivehub-backend` folder. Start the backend first (see its README).

## What you need

- [Node.js](https://nodejs.org) (LTS version)
- [VS Code](https://code.visualstudio.com) (recommended)

Check Node is installed:

```
node -v
npm -v
```

## Run it

Open this folder in VS Code (File → Open Folder), open the terminal (Terminal → New Terminal), then:

```
npm install
npm run dev
```

Open the address it prints (usually http://localhost:5173).

Other commands:

- `npm run build` creates a production build in `dist/`
- `npm run preview` serves that build locally

## Demo accounts

These are created in the database by `npm run seed` in the backend folder.

| Role | Email | Password |
|---|---|---|
| Admin | admin@revivehub.demo | Admin@123 |
| Seller | seller@revivehub.demo | Seller@123 |
| Buyer | buyer@revivehub.demo | Buyer@123 |

Anyone can also create a seller or buyer account on `/login`. Admin accounts cannot be self-registered; they are created only by the seed script.

## Screens (routes)

| Route | Screen | Role |
|---|---|---|
| `/` | Landing page | Everyone |
| `/login` | Log in / Create account | Everyone |
| `/seller/create` | Create listing: photos, AI price, save draft / submit, CSV import (`#csv`) | Seller |
| `/seller/listings` | My listings, status, edit drafts, incoming orders (accept / dispatch) | Seller |
| `/search` | Browse approved lots (search, filters, sort) | Buyer |
| `/listing/:id` | Listing details, delivery estimate, place order | Buyer |
| `/orders` | My orders (cancel, mark as received) | Buyer |
| `/order/:id` | One order with its status tracker | Buyer |
| `/admin/approvals` | Approve, or reject with a reason | Admin |
| `/admin/reports` | All orders, close an order and record commission | Admin |

## How the data works

The pages call the functions in `src/api/` (`listings.js`, `orders.js`, `auth.js`). Each one sends a request to the backend through `src/api/http.js`, which adds the login token. Nothing is stored in the browser except the login token.

- In development, Vite forwards every `/api/...` request to `http://localhost:5000` (see `vite.config.js`). To point at a deployed backend, set `VITE_API_URL` when building.
- `auth/ProtectedRoute.jsx` only hides pages from the wrong role. The real protection is in the backend, which checks the token and the role on every request.
- Photos are resized in the browser and saved with the listing (about 100 KB each, up to 4). Later they can move to Cloudinary.
- The login token is kept in `localStorage`. That is common for student projects; a production app would use an httpOnly cookie.

## Typical demo flow

0. Start the backend (`npm run dev` in `revivehub-backend`), then this app.
1. Log in as the seller (or register). Create a listing with photos and submit it. It shows as *Pending approval* in My listings.
2. Log in as admin. The listing is under Listing approvals. Reject it with a reason, then the seller sees the reason, edits it and resubmits. Approve it.
3. Log in as buyer. Find it in Browse lots, check delivery, place an order.
4. Seller: Accept, then Dispatch. Buyer: Mark as received. Admin: Close & record. The 8% commission appears in Orders & commission.

CSV import: on Create listing, use **Download template**, fill it in, then choose the file. Rows become drafts you can review and submit.

## Folder structure

```
src/
  main.jsx            App entry (router + auth + fonts)
  App.jsx             List of routes and who may open them
  index.css           Colours, buttons, forms, cards (shared styles)
  api/                Calls to the backend (http, auth, listings, orders)
  auth/               AuthContext (who is logged in) and ProtectedRoute
  hooks/useApi.js     Small hook to load data and reload it after a change
  utils/              CSV parsing, image resizing
  components/         Logo, AppHeader, AdminSidebar, ListingCard, StatusChip
  pages/              One file per screen, each with its own .css file
  data/
    mockData.js       Category list, commission rate, label helpers (and the sample data the backend seed uses)
    delivery.js       MOCK delivery cost / time / feasibility logic (becomes a backend/API call later)
```

## Where the documentation shows up in the code

- **Listing lifecycle** (Draft → Pending → Live → Sold/Closed): rules in `revivehub-backend/src/routes/listings.js` and `admin.js`; screens `AdminApprovals.jsx`, `CreateListing.jsx`, `MyListings.jsx`.
- **Order lifecycle** (Pending → Confirmed → Shipped → Delivered → Closed, or Cancelled): rules in `revivehub-backend/src/routes/orders.js`; screens `Orders.jsx`, `MyListings.jsx`, `AdminReports.jsx`, `OrderConfirmed.jsx`.
- **Commission** (8% of sale price, recorded when an order is Closed): `revivehub-backend/src/config.js` and `routes/orders.js`.
- **Delivery feasibility**: `data/delivery.js`, used in `ListingDetail.jsx` (still a stand-in; the real distance API comes next).
- **AI price suggestion**: a stand-in function in `CreateListing.jsx`. The real one will be the Python pricing service.
