# Cloudflare Migration Design
**Date:** 2026-04-06
**Project:** Blue Hacks 2025 (project-sinag)

## Overview

Migrate the Next.js 15 app from Vercel to Cloudflare using:
- **Cloudflare Pages** via `opennextjs-cloudflare` (OpenNext)
- **Cloudflare D1** (SQLite) as the database, accessed via Prisma with `@prisma/adapter-d1`
- **Cloudflare R2** for file storage with public bucket access, replacing `@vercel/blob`

Fresh deployment — no data migration required.

---

## Architecture

```
Cloudflare Pages (Next.js via opennextjs-cloudflare)
    │
    ├── D1 Binding (DB) ──────────► Prisma (@prisma/adapter-d1, nodejs_compat)
    ├── R2 Binding (BUCKET) ──────► env.BUCKET.put() via getCloudflareContext()
    └── Env Vars ─────────────────► Google Maps API keys (unchanged)
```

---

## Section 1 — Deployment (Cloudflare Pages + OpenNext)

### Tooling
- Replace `@cloudflare/next-on-pages` with `@opennextjs/cloudflare`
- Build output goes to `.open-next/`
- Add `.open-next/` and `.wrangler/` to `.gitignore`

### Build script (`package.json`)
```json
"build": "prisma generate && opennextjs-cloudflare build",
"deploy": "opennextjs-cloudflare deploy",
"preview": "opennextjs-cloudflare preview"
```

### `wrangler.jsonc`
```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "account_id": "8527ec1369d46f55304a6f59ab5356e4",
  "name": "project-sinag",
  "main": ".open-next/worker.js",
  "compatibility_date": "2026-03-17",
  "compatibility_flags": ["nodejs_compat", "global_fetch_strictly_public"],
  "assets": {
    "binding": "ASSETS",
    "directory": ".open-next/assets"
  },
  "images": {
    "binding": "IMAGES"
  },
  "services": [
    {
      "binding": "WORKER_SELF_REFERENCE",
      "service": "project-sinag"
    }
  ],
  "r2_buckets": [
    {
      "binding": "BUCKET",
      "bucket_name": "project-sinag"
    }
  ],
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "project-sinag",
      "database_id": "84919780-2da0-43b5-9983-d0b50b148197"
    }
  ],
  "observability": {
    "enabled": true
  }
}
```

### Environment variables (Cloudflare Pages dashboard)
Set these as Pages environment variables (not secrets, except `CLOUDFLARE_D1_TOKEN`):
- `NEXT_PUBLIC_GOOGLE_API`
- `NEXT_PUBLIC_GEONAMES_USERNAME`
- `NEXT_PUBLIC_REPORTS_GOOGLE_MAP_ID`
- `R2_PUBLIC_URL` — the `pub-<hash>.r2.dev` base URL from the R2 dashboard after enabling public access on `project-sinag`

---

## Section 2 — Database (D1 + Prisma)

### New packages
- `@prisma/adapter-d1`

### `prisma/schema.prisma` changes
1. Generator block: add `previewFeatures = ["driverAdapters"]`
2. Datasource block: change `provider = "sqlite"`, remove `url = env("DATABASE_URL")`
3. Replace `imageUrl String[]` on `Report` with a `ReportImage` relation
4. Add new `ReportImage` model

```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["driverAdapters"]
}

datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}

model ModeratorCredentials {
  id        String   @id @default(uuid())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  username  String
  password  String
}

model Report {
  id        String   @id @default(uuid())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  lat      Float
  lon      Float
  location String?

  timeOfReport DateTime @default(now())
  description  String?
  images       ReportImage[]
  tags         Tag[]

  hidden Boolean @default(false)
}

model ReportImage {
  id       String @id @default(uuid())
  url      String
  report   Report @relation(fields: [reportId], references: [id])
  reportId String
}

model Tag {
  id        String   @id @default(uuid())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  name      String
  Report    Report[]
}
```

### `src/app/utils/prisma.ts`
Replace singleton export with a factory function:

```ts
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { PrismaClient } from "@prisma/client";
import { PrismaD1 } from "@prisma/adapter-d1";

export async function getPrisma() {
  const { env } = await getCloudflareContext({ async: true });
  const adapter = new PrismaD1(env.DB);
  return new PrismaClient({ adapter });
}
```

### API route changes (Prisma)
In every route file, replace:
```js
import { prisma } from "@/app/utils/prisma";
```
with:
```js
import { getPrisma } from "@/app/utils/prisma";
// inside handler:
const prisma = await getPrisma();
```

Additionally in each route that returns reports, add `include: { images: true }` to the query.

### Migrations
Apply schema to D1 via Wrangler:
```bash
# Generate SQL from Prisma schema
npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script > migration.sql

# Apply to local D1 (dev)
wrangler d1 execute project-sinag --local --file=migration.sql

# Apply to remote D1 (production)
wrangler d1 execute project-sinag --remote --file=migration.sql
```

---

## Section 3 — File Storage (R2)

### Setup
1. In the Cloudflare R2 dashboard, enable **Public Access** on the `project-sinag` bucket
2. Copy the resulting `pub-<hash>.r2.dev` URL → set as `R2_PUBLIC_URL` in Pages env vars

### New packages
- Remove `@vercel/blob`
- No new packages needed (native R2 binding)

### `src/app/api/report/save/route.js`
Replace the `@vercel/blob` `put()` call with native R2 binding:

```js
import { getCloudflareContext } from "@opennextjs/cloudflare";

// inside handler, replace the vercel/blob block:
const { env } = await getCloudflareContext({ async: true });
const originalExtension = file.name.split(".").pop();
const key = `${report.id}.${originalExtension}`;
await env.BUCKET.put(key, file.stream(), {
  httpMetadata: { contentType: file.type },
});
const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`;

await prisma.reportImage.create({
  data: { url: publicUrl, reportId: report.id },
});
```

### `src/app/api/hotlines/sos/route.js`
Replace the `imageUrl: { push: "..." }` update block:
1. Upload the SOS GIF manually to the `project-sinag` R2 bucket (key: `SOS.gif`)
2. Replace the hardcoded Vercel Blob URL update with:
```js
await prisma.reportImage.create({
  data: { url: `${process.env.R2_PUBLIC_URL}/SOS.gif`, reportId: sos.id },
});
```

### `next.config.mjs`
Update `remotePatterns` to allow R2 public domain:
```js
remotePatterns: [
  {
    protocol: "https",
    hostname: "pub-*.r2.dev",
    port: "",
    pathname: "/**",
  },
],
```

---

## Section 4 — Environment File

### `.env` (updated)
```env
# Runtime (set in Cloudflare Pages dashboard for production)
NEXT_PUBLIC_GOOGLE_API=""
NEXT_PUBLIC_GEONAMES_USERNAME=""
NEXT_PUBLIC_REPORTS_GOOGLE_MAP_ID=""
R2_PUBLIC_URL=""

# Local dev tooling only
CLOUDFLARE_D1_TOKEN=""
```

`DATABASE_URL` and `BLOB_READ_WRITE_TOKEN` are fully removed — D1 and R2 are accessed via
Worker bindings at runtime, not connection strings.

### `.env.example` (updated)
```env
NEXT_PUBLIC_GOOGLE_API=""
NEXT_PUBLIC_GEONAMES_USERNAME=""
NEXT_PUBLIC_REPORTS_GOOGLE_MAP_ID=""
R2_PUBLIC_URL=""
CLOUDFLARE_D1_TOKEN=""
```

---

## Summary of File Changes

| File | Change |
|------|--------|
| `wrangler.jsonc` | New file — D1 + R2 bindings, OpenNext config |
| `package.json` | Replace build script, add `@opennextjs/cloudflare`, `@prisma/adapter-d1`, remove `@vercel/blob` |
| `prisma/schema.prisma` | `sqlite` provider, `driverAdapters` preview, `ReportImage` model |
| `src/app/utils/prisma.ts` | Singleton → `getPrisma()` factory using D1 binding |
| `src/app/api/report/save/route.js` | R2 binding upload, `reportImage.create` |
| `src/app/api/hotlines/sos/route.js` | R2 URL for SOS GIF, `reportImage.create` |
| `src/app/api/report/all/route.js` | Add `include: { images: true }` |
| `src/app/api/report/public/route.js` | Add `include: { images: true }` |
| `src/app/api/report/details/route.js` | `getPrisma()` swap, `include: { images: true }` |
| `src/app/api/report/hide/route.js` | `getPrisma()` swap |
| `src/app/api/report/unhide/route.js` | `getPrisma()` swap |
| `src/app/api/login/route.js` | `getPrisma()` swap |
| `src/app/api/hotlines/route.js` | `getPrisma()` swap |
| `next.config.mjs` | Update `remotePatterns` to R2 public domain |
| `.env` / `.env.example` | Remove `DATABASE_URL`, `BLOB_READ_WRITE_TOKEN`, add `R2_PUBLIC_URL` |
| `.gitignore` | Add `.open-next/`, `.wrangler/` |
