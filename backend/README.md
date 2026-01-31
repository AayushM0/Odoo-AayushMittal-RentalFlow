# Rental ERP Backend

## Prerequisites
- Node.js 18+
- PostgreSQL 14+

## Environment Setup

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Update database credentials in `.env`:
   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=rental_erp
   DB_USER=postgres
   DB_PASSWORD=your_password
   JWT_SECRET=your-secret-key
   ```

## Database Setup

### First Time Setup (Fresh Database)
```bash
npm run db:setup
```

This will:
- Drop existing tables (if any)
- Run all migrations
- Seed sample data

### Individual Commands

```bash
# Run migrations only
npm run db:migrate

# Seed data only
npm run db:seed

# Reset database (drop + migrate + seed)
npm run db:reset
```

## Running the Server

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

## Database Structure

```
database/
├── migrations/       # SQL migration files (versioned)
│   ├── 001_create_users_table.sql
│   ├── 002_create_products_table.sql
│   ├── 003_create_variants_table.sql
│   ├── 004_create_orders_table.sql
│   └── 005_create_reservations_table.sql
└── seeds/           # Sample data for development
    └── dev_seed.sql
```

## Sample Credentials (Development)

After running `npm run db:setup`, you can use these test accounts:

- **Vendor**: `vendor@example.com` / `Test@123`
- **Customer**: `customer@example.com` / `Test@123`

## API Documentation

### Auth Routes: `/api/auth`
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Product Routes: `/api/products`
- `GET /api/products` - List all products (public)
- `GET /api/products/:id` - Get product by ID (public)
- `POST /api/products` - Create product (VENDOR, ADMIN)
- `PUT /api/products/:id` - Update product (VENDOR, ADMIN)
- `DELETE /api/products/:id` - Delete product (VENDOR, ADMIN)

More documentation coming soon...
