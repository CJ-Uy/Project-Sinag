# Cloudflare Hosting Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the Blue Hacks 2025 Next.js app to Cloudflare Pages with D1 (SQLite via Prisma) for the database and R2 (native binding) for file storage.

**Architecture:** Next.js is deployed via `@opennextjs/cloudflare` (OpenNext) to Cloudflare Pages. The database is Cloudflare D1 accessed through Prisma's `@prisma/adapter-d1` with `nodejs_compat`. File uploads go directly to an R2 bucket via the native Worker binding; files are served via R2's public URL.

**Tech Stack:** Next.js 15, pnpm, Prisma 6 + `@prisma/adapter-d1`, `@opennextjs/cloudflare`, Cloudflare D1, Cloudflare R2, Wrangler CLI

---

### Task 1: Scaffold — wrangler.jsonc, open-next.config.ts, .gitignore

**Files:**
- Create: `wrangler.jsonc`
- Create: `open-next.config.ts`
- Modify: `.gitignore`

- [ ] **Step 1: Create `wrangler.jsonc`** at the project root

```jsonc
/**
 * For more details on how to configure Wrangler, refer to:
 * https://developers.cloudflare.com/workers/wrangler/configuration/
 */
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "account_id": "8527ec1369d46f55304a6f59ab5356e4",
  "name": "project-sinag",
  "main": ".open-next/worker.js",
  "compatibility_date": "2026-03-17",
  "compatibility_flags": ["nodejs_compat", "global_fetch_strictly_public"],
  "assets": {
    "binding": "ASSETS",
    "directory": ".open-next/assets",
  },
  "images": {
    // Enable image optimization
    "binding": "IMAGES",
  },
  "services": [
    {
      // Self-reference service binding for caching
      "binding": "WORKER_SELF_REFERENCE",
      "service": "project-sinag",
    },
  ],
  "r2_buckets": [
    {
      "binding": "BUCKET",
      "bucket_name": "project-sinag",
    },
  ],
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "project-sinag",
      "database_id": "84919780-2da0-43b5-9983-d0b50b148197",
    },
  ],
  "observability": {
    "enabled": true,
  },
}
```

- [ ] **Step 2: Create `open-next.config.ts`** at the project root

```ts
import type { OpenNextConfig } from "@opennextjs/cloudflare";

const config: OpenNextConfig = {};

export default config;
```

- [ ] **Step 3: Update `.gitignore`** — add Cloudflare build artifacts

Add these two lines at the end of `.gitignore`:
```
# cloudflare
.open-next/
.wrangler/
```

- [ ] **Step 4: Commit**

```bash
git add wrangler.jsonc open-next.config.ts .gitignore
git commit -m "chore: add cloudflare wrangler config and open-next scaffold"
```

---

### Task 2: Package Updates

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install new dependencies**

```bash
pnpm add @prisma/adapter-d1
pnpm add -D @opennextjs/cloudflare wrangler
```

- [ ] **Step 2: Remove `@vercel/blob`**

```bash
pnpm remove @vercel/blob
```

- [ ] **Step 3: Update build scripts in `package.json`**

Replace the `scripts` block:
```json
"scripts": {
  "dev": "next dev --turbopack",
  "build": "prisma generate && opennextjs-cloudflare build",
  "deploy": "opennextjs-cloudflare deploy",
  "preview": "opennextjs-cloudflare preview",
  "lint": "next lint",
  "cf-typegen": "wrangler types --env-interface CloudflareEnv cloudflare-env.d.ts"
},
```

- [ ] **Step 4: Generate Cloudflare env types**

```bash
pnpm cf-typegen
```

Expected: a file `cloudflare-env.d.ts` is created at the project root with content similar to:
```ts
interface CloudflareEnv {
  DB: D1Database;
  BUCKET: R2Bucket;
  ASSETS: Fetcher;
  IMAGES: any;
  WORKER_SELF_REFERENCE: Fetcher;
}
```

If the command fails because wrangler isn't authenticated, create `cloudflare-env.d.ts` manually with the content above.

- [ ] **Step 5: Commit**

```bash
git add package.json pnpm-lock.yaml cloudflare-env.d.ts
git commit -m "chore: add opennextjs/cloudflare and prisma-adapter-d1, remove vercel/blob"
```

---

### Task 3: Update Prisma Schema

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Replace `prisma/schema.prisma`** with the following

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

Key changes from original:
- `provider = "sqlite"` (was `"postgresql"`)
- `previewFeatures = ["driverAdapters"]` added to generator
- `url = "file:./dev.db"` (placeholder only — D1 binding is used at runtime)
- `imageUrl String[]` removed from `Report`, replaced by `images ReportImage[]` relation
- New `ReportImage` model added

- [ ] **Step 2: Regenerate Prisma client**

```bash
pnpm prisma generate
```

Expected output ends with: `✔ Generated Prisma Client`

- [ ] **Step 3: Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat: migrate prisma schema to sqlite/d1 with ReportImage model"
```

---

### Task 4: Generate and Apply D1 Migration

**Files:**
- Create: `migration.sql` (temporary, not committed)

- [ ] **Step 1: Generate migration SQL from the Prisma schema**

```bash
pnpm prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script > migration.sql
```

Expected: `migration.sql` is created. Open it and verify it contains `CREATE TABLE` statements for `ModeratorCredentials`, `Report`, `ReportImage`, `Tag`, and the implicit many-to-many join table for `Tag`↔`Report`.

- [ ] **Step 2: Apply migration to remote D1 (production)**

```bash
pnpm wrangler d1 execute project-sinag --remote --file=migration.sql
```

Expected output: `✅ Applied migration` (or similar success message). If prompted to authenticate, run `pnpm wrangler login` first.

- [ ] **Step 3: Clean up migration file**

```bash
rm migration.sql
```

- [ ] **Step 4: Commit**

```bash
git commit --allow-empty -m "chore: applied d1 schema migration (see prisma/schema.prisma)"
```

---

### Task 5: Update `prisma.ts` — getPrisma() Factory

**Files:**
- Modify: `src/app/utils/prisma.ts`

- [ ] **Step 1: Replace `src/app/utils/prisma.ts`** with the factory function

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

- [ ] **Step 2: Commit**

```bash
git add src/app/utils/prisma.ts
git commit -m "feat: replace prisma singleton with getPrisma() d1 factory"
```

---

### Task 6: Update Report Routes — Prisma Swap + include images

There are 5 route files that only need `getPrisma()` swapped in. Update them all in one task.

**Files:**
- Modify: `src/app/api/report/all/route.js`
- Modify: `src/app/api/report/public/route.js`
- Modify: `src/app/api/report/details/route.js`
- Modify: `src/app/api/report/hide/route.js`
- Modify: `src/app/api/report/unhide/route.js`

- [ ] **Step 1: Replace `src/app/api/report/all/route.js`**

```js
import { NextResponse } from "next/server";
import { getPrisma } from "@/app/utils/prisma";

export async function GET() {
  const prisma = await getPrisma();
  return NextResponse.json(await prisma.report.findMany({
    include: { images: true },
  }));
}
```

- [ ] **Step 2: Replace `src/app/api/report/public/route.js`**

```js
import { NextResponse } from "next/server";
import { getPrisma } from "@/app/utils/prisma";

export async function GET() {
  const prisma = await getPrisma();
  return NextResponse.json(await prisma.report.findMany({
    where: { hidden: false },
    include: { images: true },
  }));
}
```

- [ ] **Step 3: Replace `src/app/api/report/details/route.js`**

```js
import { NextResponse } from "next/server";
import { getPrisma } from "@/app/utils/prisma";

export async function POST(request) {
  const data = await request.json();
  const prisma = await getPrisma();
  return NextResponse.json(await prisma.report.findFirst({
    where: { id: data.id },
    include: { images: true },
  }));
}
```

- [ ] **Step 4: Replace `src/app/api/report/hide/route.js`**

```js
import { NextResponse } from "next/server";
import { getPrisma } from "@/app/utils/prisma";

export async function POST(request) {
  const data = await request.json();
  const prisma = await getPrisma();
  const hiddenReport = await prisma.report.update({
    where: { id: data.id },
    data: { hidden: true },
  });
  return NextResponse.json(hiddenReport);
}
```

- [ ] **Step 5: Replace `src/app/api/report/unhide/route.js`**

```js
import { NextResponse } from "next/server";
import { getPrisma } from "@/app/utils/prisma";

export async function POST(request) {
  const data = await request.json();
  const prisma = await getPrisma();
  const hiddenReport = await prisma.report.update({
    where: { id: data.id },
    data: { hidden: false },
  });
  return NextResponse.json(hiddenReport);
}
```

- [ ] **Step 6: Commit**

```bash
git add src/app/api/report/all/route.js src/app/api/report/public/route.js src/app/api/report/details/route.js src/app/api/report/hide/route.js src/app/api/report/unhide/route.js
git commit -m "feat: migrate report routes to getPrisma() and include images"
```

---

### Task 7: Update Login Route — Prisma Swap

**Files:**
- Modify: `src/app/api/login/route.js`

- [ ] **Step 1: Replace `src/app/api/login/route.js`**

```js
import { getPrisma } from "@/app/utils/prisma";
import { NextResponse } from "next/server";

export async function POST(request) {
  const { username, password } = await request.json();
  const prisma = await getPrisma();
  const user = await prisma.moderatorCredentials.findFirst({
    where: { username, password },
  });

  if (user) {
    return NextResponse.json({ valid: true });
  }
  return NextResponse.json({ valid: false });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/login/route.js
git commit -m "feat: migrate login route to getPrisma()"
```

---

### Task 8: Update save/route.js — R2 Upload + reportImage

**Files:**
- Modify: `src/app/api/report/save/route.js`

- [ ] **Step 1: Replace `src/app/api/report/save/route.js`**

```js
import { NextResponse } from "next/server";
import { getPrisma } from "@/app/utils/prisma";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export async function POST(request) {
  const formData = await request.formData();
  const data = Object.fromEntries(formData);
  const { lat, lon, timeOfReport, description } = data;

  const response = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?latlng=${Number.parseFloat(lat)},${Number.parseFloat(lon)}&key=${process.env.NEXT_PUBLIC_GOOGLE_API}`
  );
  const cityData = await response.json();

  const prisma = await getPrisma();
  const { env } = await getCloudflareContext({ async: true });

  const report = await prisma.report.create({
    data: {
      lat: Number.parseFloat(lat),
      lon: Number.parseFloat(lon),
      description,
      timeOfReport,
      location: cityData.results[1].formatted_address,
    },
  });

  const files = formData.getAll("files");
  for (const file of files) {
    const originalExtension = file.name.split(".").pop();
    const key = `${report.id}.${originalExtension}`;
    await env.BUCKET.put(key, file.stream(), {
      httpMetadata: { contentType: file.type },
    });
    const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`;
    await prisma.reportImage.create({
      data: { url: publicUrl, reportId: report.id },
    });
  }

  return NextResponse.json({ State: "Success" });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/report/save/route.js
git commit -m "feat: migrate save route to R2 native binding and reportImage"
```

---

### Task 9: Update sos/route.js — R2 URL + reportImage

The SOS GIF was previously hosted on Vercel Blob. Before updating the code, upload the GIF to R2.

**Files:**
- Modify: `src/app/api/hotlines/sos/route.js`

- [ ] **Step 1: Download the SOS GIF locally**

Download from the old URL:
```
https://3ufbik4jemsztogi.public.blob.vercel-storage.com/SOS-HP9PzARKPmGRAfYB3tL7YfPMM2PXir.gif
```
Save it as `SOS.gif`.

- [ ] **Step 2: Upload SOS.gif to the R2 bucket**

```bash
pnpm wrangler r2 object put project-sinag/SOS.gif --file=SOS.gif --content-type=image/gif
```

Expected output: `✅ Uploaded`

- [ ] **Step 3: Delete the local SOS.gif**

```bash
rm SOS.gif
```

- [ ] **Step 4: Replace `src/app/api/hotlines/sos/route.js`**

```js
import { getPrisma } from "@/app/utils/prisma";
import { NextResponse } from "next/server";

export async function POST(request) {
  const data = await request.json();
  const { lat, lon } = data;

  const response = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?latlng=${Number.parseFloat(lat)},${Number.parseFloat(lon)}&key=${process.env.NEXT_PUBLIC_GOOGLE_API}`
  );
  const cityData = await response.json();

  const prisma = await getPrisma();
  const sos = await prisma.report.create({
    data: {
      lat: Number.parseFloat(data.lat),
      lon: Number.parseFloat(data.lon),
      description: "EMERGENCY SOS",
      location: cityData.results[1].formatted_address,
    },
  });

  await prisma.reportImage.create({
    data: {
      url: `${process.env.R2_PUBLIC_URL}/SOS.gif`,
      reportId: sos.id,
    },
  });

  return NextResponse.json(
    await prisma.report.findFirst({
      where: { id: sos.id },
      include: { images: true },
    })
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add src/app/api/hotlines/sos/route.js
git commit -m "feat: migrate sos route to R2 public URL and reportImage"
```

---

### Task 10: Update next.config.mjs + .env Files

**Files:**
- Modify: `next.config.mjs`
- Modify: `.env`
- Modify: `.env.example`

- [ ] **Step 1: Replace `next.config.mjs`**

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "pub-*.r2.dev",
        port: "",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
```

- [ ] **Step 2: Update `.env`**

Replace the entire file contents:
```env
# Runtime — set these in the Cloudflare Pages dashboard for production
NEXT_PUBLIC_GOOGLE_API=""
NEXT_PUBLIC_GEONAMES_USERNAME=""
NEXT_PUBLIC_REPORTS_GOOGLE_MAP_ID=""
R2_PUBLIC_URL=""

# Local dev tooling only (not needed at runtime)
CLOUDFLARE_D1_TOKEN=""
```

- [ ] **Step 3: Update `.env.example`**

Replace the entire file contents:
```env
NEXT_PUBLIC_GOOGLE_API=""
NEXT_PUBLIC_GEONAMES_USERNAME=""
NEXT_PUBLIC_REPORTS_GOOGLE_MAP_ID=""
R2_PUBLIC_URL=""
CLOUDFLARE_D1_TOKEN=""
```

- [ ] **Step 4: Commit**

```bash
git add next.config.mjs .env.example
git commit -m "chore: update remotePatterns for R2 and clean up env files"
```

Note: `.env` is in `.gitignore` so it won't be committed — that's correct.

---

### Task 11: Build Verification

- [ ] **Step 1: Run the OpenNext build**

```bash
pnpm build
```

Expected: build succeeds with no errors. The `.open-next/` directory is created with `worker.js` and `assets/` inside.

If the build fails with a Prisma error about missing `DATABASE_URL`, verify that `prisma/schema.prisma` has `url = "file:./dev.db"` in the datasource block (not `env("DATABASE_URL")`).

If the build fails with a module resolution error for `@opennextjs/cloudflare`, run:
```bash
pnpm install
```
then retry.

- [ ] **Step 2: Run a local preview**

```bash
pnpm preview
```

Expected: Wrangler starts a local dev server (usually at `http://localhost:8787`). Open it in the browser and verify the feed page loads.

- [ ] **Step 3: Deploy to Cloudflare**

```bash
pnpm deploy
```

Expected: deployment succeeds and Wrangler prints the live URL (e.g., `https://project-sinag.workers.dev`).

- [ ] **Step 4: Set env vars in Cloudflare Pages dashboard**

In the Cloudflare dashboard → Workers & Pages → `project-sinag` → Settings → Environment Variables, add:
- `NEXT_PUBLIC_GOOGLE_API` — your Google Maps API key
- `NEXT_PUBLIC_GEONAMES_USERNAME` — your GeoNames username
- `NEXT_PUBLIC_REPORTS_GOOGLE_MAP_ID` — your Google Maps map ID
- `R2_PUBLIC_URL` — the `pub-<hash>.r2.dev` URL (enable public access on the `project-sinag` R2 bucket in the dashboard first)

- [ ] **Step 5: Redeploy after setting env vars**

```bash
pnpm deploy
```

- [ ] **Step 6: Smoke test the live deployment**

Visit the deployed URL and verify:
- Feed page loads and shows the map
- Submitting a report uploads an image and saves to D1
- SOS button creates an emergency report with the SOS GIF
- Moderator login works
- Hide/unhide report works

- [ ] **Step 7: Final commit**

```bash
git add -A
git commit -m "chore: cloudflare hosting migration complete"
```
