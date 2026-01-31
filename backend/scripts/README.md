# Database Management Scripts

This folder contains essential database management scripts.

## Available Scripts

### `db-migrate.js`
Runs all SQL migration files from `src/database/migrations/` in order.

```bash
npm run db:migrate
```

### `db-seed.js`
Seeds the database with development data from `src/database/seeds/dev_seed.sql`.

```bash
npm run db:seed
```

### `db-setup.js`
Complete database setup: drops existing schema, runs migrations, and seeds data.

```bash
npm run db:setup
# or
npm run db:reset
```

## Usage

**First Time Setup:**
```bash
npm run db:setup
```

**Reset Database:**
```bash
npm run db:reset
```

**Run Migrations Only:**
```bash
npm run db:migrate
```

**Seed Data Only:**
```bash
npm run db:seed
```

## Migration Files

All migration files are located in `src/database/migrations/` and are numbered sequentially:
- `001_create_users_table.sql`
- `002_create_products_table.sql`
- `003_create_variants_table.sql`
- `004_create_orders_table.sql`
- `005_create_reservations_table.sql`

## Seed Data

Sample development data is in `src/database/seeds/dev_seed.sql`.

Default credentials after seeding:
- Vendor: `vendor@example.com` / `Test@123`
- Customer: `customer@example.com` / `Test@123`
