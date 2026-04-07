# Project Sinag

**Sinag** is a Filipino word meaning "ray of light" or "gleam" -- a fitting name for a platform that helps communities shine a light on disasters and incidents happening around them.

Project Sinag (System for Impact and Natural Disaster Damage Assessment Geomap) is a community-based, crowdsourced incident reporting web application. It allows anyone to submit geotagged reports of disasters, hazards, or incidents, and lets the broader community view those reports on an interactive map in real time. A built-in admin interface gives moderators the ability to review and hide reports that are inaccurate or inappropriate, keeping the feed reliable.

## Features

- Community report submission with geolocation, images, tags, and descriptions
- Public feed of active incident reports on an interactive map
- Admin moderation panel to review, hide, and unhide submitted reports
- Emergency hotlines reference page
- Built on Cloudflare infrastructure for global edge deployment

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Database:** Cloudflare D1 (SQLite) via Prisma
- **Deployment:** Cloudflare Workers using OpenNext
- **UI:** Tailwind CSS, Radix UI, shadcn/ui components
- **Maps:** Google Maps API (`@vis.gl/react-google-maps`)

## Getting Started

### Prerequisites

- Node.js and pnpm installed
- A database URL configured in your environment

### Setup

1. Copy the environment file and fill in the required values:

   ```bash
   cp .env.example .env
   ```

2. Push the Prisma schema to your database:

   ```bash
   pnpm dlx prisma db push
   ```

3. Start the development server:

   ```bash
   pnpm dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Developers

Project Sinag was created for the Blue Hacks 2025 Hackathon by first-year students from Ateneo de Manila University.

- Uy, Charles Joshua T.
- Pardo, John Jerome C.
- Celestino, Kenaz Reuel J.
- Rivera, Prince Angelo C.
