# StockFlow

StockFlow is a web-based inventory and point-of-sale (POS) application for small businesses. It centralizes products, stock levels, sales, customers, suppliers, and performance reporting in one dashboard.

## Features

- Secure email/password authentication through Supabase Auth.
- Product catalog management with SKU, barcode, category, pricing, cost, supplier, and minimum-stock fields.
- POS checkout with product search, cart quantities, line-item discounts, optional customer selection, and cash/card/mobile payments.
- Automatic stock reduction after a completed sale.
- Inventory monitoring, including low-stock alerts based on each product's minimum stock level.
- Customer and supplier record management.
- Dashboard metrics for revenue, profit, product totals, low-stock items, recent sales, and category stock.
- Reports for sales trends, sales history, payment methods, top products, customers, and supplier inventory value.

## Technology

| Area | Technology |
| --- | --- |
| Front end | React 18, TypeScript, Vite |
| Styling/UI | Tailwind CSS, shadcn/ui, Radix UI, Lucide icons |
| Routing | React Router |
| Data/authentication | Supabase (Auth and PostgreSQL) |
| Data visualization | Recharts |
| Server-state utilities | TanStack Query |
| Testing | Vitest, Testing Library, Playwright |

## Prerequisites

- Node.js 18 or later
- npm
- A Supabase project with authentication and the required database tables

## Getting started

1. Clone the repository and open the project directory.

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file in the project root and add your Supabase public credentials:

   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

   Do not commit this file or any secret keys.

4. Start the development server:

   ```bash
   npm run dev
   ```

5. Open the local URL shown by Vite, then sign in with a user configured in Supabase Auth.

## Available scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite development server. |
| `npm run build` | Create a production build. |
| `npm run build:dev` | Build using development mode. |
| `npm run preview` | Preview the production build locally. |
| `npm run lint` | Run ESLint. |
| `npm run test` | Run the Vitest suite once. |
| `npm run test:watch` | Run Vitest in watch mode. |

## Data model

The application reads from and writes to these Supabase tables:

| Table | Purpose |
| --- | --- |
| `products` | Product details, prices, costs, stock, minimum stock level, supplier, SKU, and barcode. |
| `customers` | Customer contact information, purchase total, and last-visit data. |
| `suppliers` | Supplier contact and address information, plus supplied-product totals. |
| `sales` | Sale totals, taxes, discounts, payment method, customer, cashier, and date. |
| `sale_items` | Individual products sold in each sale, including quantity, price, and discount. |

`sale_items` belongs to a sale through `sale_id`; sales load their associated line items when displayed. When a sale is recorded, StockFlow creates the sale, creates its line items, and decreases the stock of every product sold.

## Project structure

```text
src/
├── components/       # Application layout, shared widgets, and UI primitives
├── hooks/            # Reusable React hooks
├── lib/
│   ├── store.ts      # Supabase data access, mutations, and calculated metrics
│   └── supabase.ts   # Supabase client configuration
├── pages/            # Login, dashboard, products, sales, inventory, CRM, and reports pages
├── test/             # Vitest setup and tests
├── App.tsx           # Authentication gate and routes
└── main.tsx          # Application entry point
```

## Application flow

1. The app checks for an existing Supabase session.
2. Unauthenticated visitors see the login page; authenticated users enter the dashboard.
3. The store loads products, customers, suppliers, sales, and sale items from Supabase.
4. Staff manage catalog, customer, supplier, and inventory information.
5. At checkout, staff add products to a cart, apply quantities or discounts, select a payment method and optional customer, then complete the sale.
6. The app saves the sale and its line items, updates product stock, refreshes data, and exposes updated dashboard/report metrics and low-stock alerts.

## Flowchart prompt

Use the following prompt with an AI diagram generator (for example, ChatGPT, Mermaid Chart, Lucidchart AI, or diagrams.net AI):

```text
Create a clean, professional flowchart for a web-based inventory and point-of-sale system named “StockFlow.” Use standard flowchart symbols: rounded rectangles for start/end, rectangles for actions, diamonds for decisions, cylinders for the Supabase database, and arrows for control flow. Use a left-to-right layout and label every decision branch.

Model this workflow:
1. Start.
2. User opens StockFlow.
3. System checks for an active Supabase authentication session.
4. Decision: Is the user authenticated?
   - No: Show Login page → user enters email and password → Supabase Auth validates credentials → decision: valid credentials? If no, show login error and return to Login page; if yes, create session and continue.
   - Yes: continue.
5. Display the Dashboard.
6. System loads Products, Customers, Suppliers, Sales, and Sale Items from the Supabase database.
7. User chooses a task: Manage Products, Manage Inventory, Manage Customers, Manage Suppliers, Create Sale, or View Reports.
8. For management tasks, show create/update/delete or search actions, save changes to the corresponding Supabase table, refresh data, and return to the selected module.
9. For Create Sale: search product by name/SKU/barcode → add product to cart → set quantity and optional line discount → optionally select customer → choose payment method (cash, card, or mobile) → calculate subtotal, tax, discount, and total → decision: complete sale? If no, return to cart; if yes, create Sales record, create Sale Items records, reduce stock for every purchased product, refresh data.
10. Check whether any product stock is less than or equal to its minimum stock level. If yes, display a low-stock alert.
11. Update dashboard and reports, then end.

Add database interactions at every load, save, sale creation, sale-item creation, and stock-update step. Keep the chart readable by grouping the six dashboard tasks under one “Choose task” decision.
```

## Use-case diagram prompt

Use the following prompt to generate a UML use-case diagram:

```text
Create a UML use-case diagram for “StockFlow,” a web-based inventory and point-of-sale system. Draw a system boundary labeled “StockFlow System.” Use stick-figure actors outside the boundary and oval use cases inside it. Use association lines for actor-to-use-case relationships and dashed arrows labeled <<include>> or <<extend>> where specified.

Actors:
- Staff User (cashier or store administrator)
- Supabase Auth
- Supabase Database

Staff User use cases inside the system:
- Sign in
- Sign out
- View Dashboard
- Manage Products
- Search Products
- Manage Inventory
- View Low-Stock Alerts
- Manage Customers
- Manage Suppliers
- Create Sale
- Add Item to Cart
- Update Cart Quantity
- Apply Item Discount
- Select Customer
- Choose Payment Method
- Calculate Sale Total
- Complete Sale
- View Sales History
- View Reports

Relationships:
- Staff User associates with every listed Staff User use case.
- Create Sale <<include>> Search Products, Add Item to Cart, Update Cart Quantity, Choose Payment Method, Calculate Sale Total, and Complete Sale.
- Apply Item Discount and Select Customer <<extend>> Create Sale because they are optional.
- Complete Sale <<include>> Create Sales Record, Create Sale Item Records, Update Product Stock, and Refresh Dashboard Metrics.
- Manage Inventory <<include>> View Low-Stock Alerts.
- View Reports <<include>> View Sales History.
- Supabase Auth associates with Sign in and Sign out.
- Supabase Database associates with Manage Products, Manage Inventory, Manage Customers, Manage Suppliers, Create Sale, View Dashboard, and View Reports.

Use a clear black-and-white UML style, arrange the Staff User on the left, Supabase Auth and Supabase Database on the right, and avoid overlapping connectors.
```

## Notes

The client expects the database fields `min_stock`, `created_at`, `total_purchases`, `last_visit`, `products_supplied`, `payment_method`, and `customer_id`; these are mapped to camelCase values inside `src/lib/store.ts`. Configure suitable Supabase row-level security policies before deploying the application.
