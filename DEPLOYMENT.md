# Production Deployment

This app should use one production SQLite database:

```bash
DATABASE_URL="file:/opt/sanctum-ops/prisma/prod.db"
```

Do not use `file:./dev.db` on the server. With Prisma, relative SQLite paths are resolved from `prisma/schema.prisma`, so `file:./dev.db` points at `prisma/dev.db`.

If `/opt/sanctum-ops/prisma/prisma/dev.db` exists, treat it as an accidental database. Stop the app, confirm the production database has the data you need, then move the accidental file out of the app directory or archive it. The app should only read and write `/opt/sanctum-ops/prisma/prod.db`.

## Checklist

Run from `/opt/sanctum-ops`:

```bash
npm install
npx prisma generate
npx prisma db push
npm run build
# restart app with your process manager, for example:
# pm2 restart sanctum-ops
# or systemctl restart sanctum-ops
```

Optional:

```bash
npm run db:studio
npm run db:seed
```

`npm run db:seed` only creates default app settings. To add sample inventory intentionally:

```bash
SEED_SAMPLE_DATA=true npm run db:seed
```
