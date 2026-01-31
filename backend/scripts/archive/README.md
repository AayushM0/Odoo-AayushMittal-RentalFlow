# Archived Database Scripts

These files have been replaced by the new migration-based database structure.

## Old Files (Archived)
- `init-db.js` - Replaced by `db-migrate.js`
- `setup-database.sql` - Split into numbered migration files in `src/database/migrations/`
- `quick-setup.sh` - Replaced by `db-setup.js`
- `setup-alternative.sh` - Replaced by `db-setup.js`
- `RUN-THIS-NOW.md` - Outdated instructions

## New Database Management

Use these commands instead:

```bash
# One-command setup (drop, migrate, seed)
npm run db:setup

# Individual commands
npm run db:migrate  # Run migrations
npm run db:seed     # Seed data
npm run db:reset    # Reset database
```

See `backend/README.md` for full documentation.
