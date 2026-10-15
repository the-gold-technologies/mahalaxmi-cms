# Mahalaxmi Enterprises CMS

An enterprise-grade Headless Content Management System (CMS) and Admin Dashboard built for **Mahalaxmi Enterprises** — Authorized Industrial Lube Distributor (ILD) for **Hindustan Petroleum Corporation Limited (HPCL)**.

This platform empowers administrative teams to manage product catalogs, technical documentation (TDS / MSDS), landing pages, corporate blogs, event galleries, distributor applications, customer inquiries, and search engine optimization (SEO) configurations across web properties.

---

## 📑 Table of Contents

- [Overview & Architecture](#overview--architecture)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Project Directory Structure](#project-directory-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Configuration](#environment-configuration)
  - [Database Setup & Seeding](#database-setup--seeding)
  - [Running the Application](#running-the-application)
- [Available Scripts](#available-scripts)
- [Core Functional Modules](#core-functional-modules)
  - [Product Catalog & Technical Specs](#product-catalog--technical-specs)
  - [Static & Marketing Pages](#static--marketing-pages)
  - [Inquiries & Distributor Leads](#inquiries--distributor-leads)
  - [Enterprise SEO Engine](#enterprise-seo-engine)
  - [Cloud Storage & Media Management](#cloud-storage--media-management)
- [API Endpoints Overview](#api-endpoints-overview)
- [Security & Production Deployment](#security--production-deployment)
- [License & Support](#license--support)

---

## 🏗 Overview & Architecture

Mahalaxmi Enterprises CMS operates as both a dedicated **Admin Dashboard UI** and a **Headless API Provider** for consumer-facing websites and mobile applications.

```
┌─────────────────────────────────┐       ┌─────────────────────────────────┐
│     Client Website / Frontend   │ <───> │   Mahalaxmi Enterprises CMS     │
│   (Next.js / React / Static)    │ REST  │  - Next.js 16 App Router        │
└─────────────────────────────────┘       │  - NextAuth.js v5 (Session JWT) │
                                          │  - Prisma ORM 6 & PostgreSQL    │
                                          │  - Cloudinary Storage (Media)   │
                                          │  - Nodemailer (SMTP Alerts)     │
                                          └─────────────────────────────────┘
```

---

## ✨ Key Features

### 🔐 Authentication & Session Security

- Secured with **NextAuth.js (v5 Beta)** using credentials-based JWT authentication.
- Strong password hashing with **bcryptjs**.
- Edge-compatible route middleware (`src/middleware.ts`) protecting administrative paths.

### 📦 Industrial Product Catalog Management

- Hierarchical product organization by categories and subcategories.
- Rich technical parameters: Applications, performance benefits, and special features.
- Dynamic **Properties Table Editor** for engineering metrics (Kinematic Viscosity, Flash Point, Pour Point, etc.).
- Direct integration for **Technical Data Sheets (TDS)** and **Material Safety Data Sheets (MSDS)** PDF uploads.

### 📄 Dynamic & Static Page Content Management

- **Home Page**: Interactive hero banner sliders, company background, product highlights, testimonial carousels, trusted client badges, and distributor locator CTA.
- **About Us**: Corporate milestones, vision/mission, and headquarter depot locations.
- **Contact Us**: Multi-depot regional office directory and dynamic contact form settings.
- **Events & Exhibitions**: Trade fair showcase, event meta information, and multi-image photo galleries.
- **Blogs & Technical Articles**: Full WYSIWYG rich-text editor (React Quill), categorized articles, read-time calculator, and related product links.
- **Privacy Policy & Legal**: Dynamic legal terms and regulatory disclosure management.

### 📬 Submissions & Lead Pipeline

- **Customer Inquiries**: Centralized inbox for product and technical inquiries with status tracking (`Pending`, `In Progress`, `Contacted`, `Resolved`).
- **Distributor Applications**: Comprehensive lead tracking for prospective regional distributors and stockists.
- **Automated Email Notifications**: Instant dispatch via SMTP for internal administrative alerts.

### 🚀 Search Engine Optimization (SEO) & Webmaster Tools

- **Granular Page SEO**: Custom Meta Titles, Meta Descriptions, Canonical URLs, and OpenGraph (OG) image management for every dynamic and static route.
- **JSON-LD Schema Markup**: Custom schema injection for local businesses, organizations, and products.
- **Webmaster Script Injection**: Google Analytics (GA4), Google Tag Manager (GTM), Google Search Console verification, and custom `<head>` / `<footer>` scripts.
- **Automated Sitemap & Robots.txt**: Dynamic generation of `/sitemap.xml` and `/robots.txt` based on published CMS records with admin override capabilities.

---

## 🛠 Tech Stack

| Category            | Technology                                                                                                                   |
| :------------------ | :--------------------------------------------------------------------------------------------------------------------------- |
| **Framework**       | [Next.js 16](https://nextjs.org/) (App Router, Turbopack/Webpack)                                                            |
| **Language**        | [TypeScript 5](https://www.typescriptlang.org/)                                                                              |
| **UI & Styling**    | [React 19](https://react.dev/), [Tailwind CSS v4](https://tailwindcss.com/), [Framer Motion](https://www.framer.com/motion/) |
| **Icons & Visuals** | [Lucide React](https://lucide.dev/), [Recharts](https://recharts.org/)                                                       |
| **ORM & Database**  | [Prisma ORM 6.19](https://www.prisma.io/), [PostgreSQL](https://www.postgresql.org/) / [Supabase](https://supabase.com/)     |
| **Authentication**  | [NextAuth.js v5](https://authjs.dev/)                                                                                        |
| **Media & Storage** | [Cloudinary SDK](https://cloudinary.com/), [Sharp](https://sharp.pixelplumbing.com/)                                         |
| **Email Service**   | [Nodemailer](https://nodemailer.com/)                                                                                        |
| **Editor**          | [React-Quill-New](https://github.com/zenoamaro/react-quill)                                                                  |
| **Code Quality**    | [ESLint 9](https://eslint.org/), [Prettier](https://prettier.io/)                                                            |

---

## 📁 Project Directory Structure

```plaintext
mahalaxmi-enterprises-cms/
├── prisma/
│   ├── schema.prisma            # Prisma ORM schema & relational data models
│   └── seed.js                  # Initial dataset and admin user seeder
├── public/                      # Static assets and icons
├── src/
│   ├── app/
│   │   ├── api/                 # REST API endpoints (public & protected)
│   │   │   ├── about-us/        # About page content API
│   │   │   ├── auth/            # NextAuth API route handlers
│   │   │   ├── blogs/           # Blog posts and blog categories CRUD
│   │   │   ├── contact-us/      # Contact configurations & headquarters
│   │   │   ├── dashboard/       # CMS analytics and overview statistics
│   │   │   ├── distributor-leads/# Dealership application ingestion
│   │   │   ├── enquiries/       # Inbound customer inquiries
│   │   │   ├── events/          # Expo & trade event APIs
│   │   │   ├── home/            # Homepage sections API
│   │   │   ├── nav-links/       # Navigation menu links API
│   │   │   ├── products/        # Products and category management
│   │   │   ├── profile/         # Admin profile updates
│   │   │   ├── seo/             # Global & per-page SEO metadata
│   │   │   └── upload/          # Cloudinary asset upload handler
│   │   ├── components/          # Dashboard-specific page layouts and widgets
│   │   ├── login/               # Secure administrative login portal
│   │   ├── navigation/          # Menu links and social media management
│   │   ├── robots.txt/          # Dynamic robots.txt route handler
│   │   ├── sitemap.xml/         # Dynamic sitemap.xml route handler
│   │   ├── seo/                 # Global SEO, Page SEO, and Sitemap controls
│   │   ├── settings/            # Admin credentials and preferences
│   │   ├── static-pages/        # Editors for Home, About, Contact, Events, Products
│   │   ├── submissions/         # Leads, Inquiries, and Dealership management
│   │   ├── globals.css          # Design system styles and Tailwind directives
│   │   ├── layout.tsx           # Global Root layout
│   │   └── page.tsx             # CMS Dashboard root redirection
│   ├── components/              # Shared reusable UI form components and inputs
│   ├── lib/
│   │   ├── apiCache.ts          # Request caching helpers
│   │   ├── cloudinaryCleanup.ts # Orphaned asset removal utilities
│   │   ├── mail.ts              # Nodemailer transport and email templates
│   │   ├── prisma.ts            # Singleton Prisma client connection pool
│   │   └── utils.ts             # String manipulation and class merging utilities
│   ├── auth.config.ts           # NextAuth route configuration and callbacks
│   ├── auth.ts                  # NextAuth initialization
│   └── middleware.ts            # Route protection and session validation
├── .env.example                 # Environment template file
├── next.config.ts               # Next.js configuration and image domains
├── package.json                 # Project dependencies and npm scripts
├── tsconfig.json                # TypeScript compiler configuration
└── README.md                    # Project documentation
```

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed locally:

- **Node.js**: `v18.18.0` or higher (Node.js 20+ LTS recommended)
- **npm**: `v9.0.0` or higher (or `pnpm` / `yarn`)
- **PostgreSQL**: A running instance locally or a hosted database (e.g., Supabase, Neon, AWS RDS)
- **Cloudinary Account**: For media asset management (Images & PDFs)
- **SMTP Server**: For email alerts (Mailtrap for staging, SendGrid/AWS SES for production)

---

### Installation

1. **Clone the repository:**

   ```bash
   git clone <repository-url>
   cd mahalaxmi-enterprises-cms
   ```

2. **Install project dependencies:**
   ```bash
   npm install
   ```

---

### Environment Configuration

Create a local environment file `.env` by copying `.env.example`:

```bash
cp .env.example .env
```

Populate `.env` with your credentials:

```ini
# =========================================================================
# Mahalaxmi Enterprises CMS - Environment Configuration
# =========================================================================

# Database Connection (PostgreSQL)
DATABASE_URL="postgresql://<DB_USER>:<DB_PASSWORD>@<DB_HOST>:<DB_PORT>/<DB_NAME>?schema=public"
DIRECT_URL="postgresql://<DB_USER>:<DB_PASSWORD>@<DB_HOST>:<DB_PORT>/<DB_NAME>?schema=public"

# NextAuth Authentication
AUTH_SECRET="generate-a-strong-random-secret-key-here"
NEXTAUTH_URL="http://localhost:3001"
ALLOWED_ORIGINS="http://localhost:3000,http://localhost:3001"

# Public Website Origin
NEXT_PUBLIC_WEBSITE_URL="http://localhost:3000"

# Cloudinary Storage
NEXT_CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_cloudinary_api_key"
CLOUDINARY_API_SECRET="your_cloudinary_api_secret"
CLOUDINARY_URL="cloudinary://your_cloudinary_api_key:your_cloudinary_api_secret@your_cloud_name"

# SMTP Mail Dispatch Configuration
SMTP_HOST="smtp.example.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="your_smtp_username"
SMTP_PASS="your_smtp_password"
SMTP_FROM="Mahalaxmi Enterprises <no-reply@example.com>"
ADMIN_NOTIFICATION_EMAIL="admin@example.com"
```

> 💡 **Tip:** Generate a secure `AUTH_SECRET` using OpenSSL:
>
> ```bash
> openssl rand -base64 32
> ```

---

### Database Setup & Seeding

1. **Synchronize the database schema:**

   ```bash
   npx prisma db push
   ```

2. **Generate the Prisma Client:**

   ```bash
   npx prisma generate
   ```

3. **Seed the initial database content and admin user:**

   ```bash
   npm run seed
   ```

   The seeder initializes:
   - Default Administrator Account:
     - **Email:** `admin@mahalaxmi.com`
     - **Password:** `Admin@123` _(Please change immediately via Profile Settings)_
   - Default global brand identity and navigation menu.
   - Comprehensive industrial product catalog and initial technical specs.
   - Static pages (Home, About, Contact, Events, Blogs).

---

### Running the Application

Launch the development server:

```bash
npm run dev
```

The CMS Admin portal will be accessible at:
👉 **[http://localhost:3001](http://localhost:3001)** (or your configured `NEXTAUTH_URL` port).

---

## 📜 Available Scripts

| Command                | Description                                                             |
| :--------------------- | :---------------------------------------------------------------------- |
| `npm run dev`          | Starts the Next.js development server with Webpack.                     |
| `npm run build`        | Generates the Prisma client and builds the optimized production bundle. |
| `npm run start`        | Starts the production server.                                           |
| `npm run lint`         | Runs ESLint to check for code consistency and errors.                   |
| `npm run format`       | Runs Prettier to format all codebase files automatically.               |
| `npm run format:check` | Checks code formatting without modifying files.                         |
| `npm run seed`         | Executes the database seeding script (`prisma/seed.js`).                |
| `npx prisma studio`    | Opens the Prisma visual database inspector in your browser.             |

---

## 🧩 Core Functional Modules

### Product Catalog & Technical Specs

- **Category Hierarchy**: Maintain product categories with cover images, descriptions, and display sorting.
- **Product Parameters**: Manage titles, container images, descriptions, application domains, and product benefits.
- **Properties Table Editor**: Define custom technical properties, ASTM test methods, and quantitative values per product.
- **Specification Attachments**: Direct PDF file uploads for TDS and MSDS documents served via secure CDN URLs.

### Static & Marketing Pages

- **Hero Sections**: Manage interactive multi-slide hero banners with heading overlays, CTA buttons, and responsive background images.
- **Corporate Depots & Offices**: Manage headquarter details, map embeds, branch depots, and localized contact personnel.
- **Testimonials & Clients**: Curate client reviews, partner corporate logos, and HPCL certifications.

### Inquiries & Distributor Leads

- **Customer Inquiries**: Ingest lead details from the public contact forms with full metadata, company names, budget tiers, and interested product categories.
- **Dealership Applications**: Review prospective distributors' experience, firm registration, annual turnover, and regional coverage.
- **Status Workflow**: Track inquiries through defined stages with administrative notes.

### Enterprise SEO Engine

- **Global Metadata**: Configure fallback site titles, meta descriptions, and default OpenGraph social cards.
- **Dynamic Per-Page Control**: Overwrite metadata, set canonical URLs, and toggle `noindex`/`nofollow` directives.
- **Analytics & Tracking**: Embed Google Analytics (GA4), Google Tag Manager, Search Console meta verification, and custom tracking tags.
- **Sitemap & Robots**: Live-generated `/sitemap.xml` and `/robots.txt` reflecting only published and indexable entries.

### Cloud Storage & Media Management

- Automated optimization and delivery through Cloudinary.
- Clean-up utilities to prune unlinked media when images or PDFs are replaced.

---

## 🌐 API Endpoints Overview

The CMS exposes RESTful API endpoints consumed by external client websites:

### Public Read / Submission Endpoints

| Method | Endpoint                   | Description                                        |
| :----- | :------------------------- | :------------------------------------------------- |
| `GET`  | `/api/home`                | Returns all homepage sections and configuration.   |
| `GET`  | `/api/about-us`            | Returns corporate details and depot locations.     |
| `GET`  | `/api/contact-us`          | Returns contact settings and headquarter info.     |
| `GET`  | `/api/products`            | Lists products with category filtering and search. |
| `GET`  | `/api/products/categories` | Lists active product categories.                   |
| `GET`  | `/api/blogs`               | Lists published blog posts.                        |
| `GET`  | `/api/blogs/categories`    | Lists blog post categories.                        |
| `GET`  | `/api/events`              | Lists corporate expos and trade fair events.       |
| `GET`  | `/api/nav-links`           | Returns site navigation menus and social links.    |
| `GET`  | `/api/seo`                 | Returns global SEO configuration and script tags.  |
| `GET`  | `/api/seo/pages/[...slug]` | Returns page-specific SEO meta tags and schema.    |
| `GET`  | `/sitemap.xml`             | Returns dynamic XML sitemap for search engines.    |
| `GET`  | `/robots.txt`              | Returns robots directives and sitemap reference.   |
| `POST` | `/api/enquiries`           | Ingests new user product and general inquiries.    |
| `POST` | `/api/distributor-leads`   | Ingests new regional distributor applications.     |

### Protected CMS Administrative Endpoints

_(Requires an active NextAuth administrative session)_

| Method | Endpoint                 | Description                                                     |
| :----- | :----------------------- | :-------------------------------------------------------------- |
| `GET`  | `/api/dashboard/stats`   | Fetches aggregated inquiry, product, and lead statistics.       |
| `POST` | `/api/upload`            | Uploads images or PDF documents to Cloudinary.                  |
| `POST` | `/api/products`          | Creates or updates product catalog entries.                     |
| `POST` | `/api/blogs`             | Creates or updates blog posts.                                  |
| `POST` | `/api/events`            | Creates or updates company events.                              |
| `PUT`  | `/api/enquiries`         | Updates status of user inquiries (`Pending`, `Resolved`, etc.). |
| `PUT`  | `/api/distributor-leads` | Updates status of distributor dealership leads.                 |
| `PUT`  | `/api/profile`           | Updates admin credentials and profile details.                  |

---

## 🔒 Security & Production Deployment

### Production Checklist

1. **Rotate Credentials**: Update the default administrator email and password immediately after initial database seeding.
2. **Environment Variables**:
   - Ensure `AUTH_SECRET` is set to a cryptographically secure 32+ byte string.
   - Configure `ALLOWED_ORIGINS` to only whitelist trusted frontend domain origins.
   - Set `NEXTAUTH_URL` to your production CMS domain (e.g., `https://cms.yourdomain.com`).
3. **Database Connection Pooling**:
   - When deploying to serverless platforms (e.g., Vercel), use connection pooling URLs via `DATABASE_URL` (PgBouncer / Supabase Pooler) and `DIRECT_URL` for Prisma migrations.
4. **HTTPS Enforced**:
   - Run behind reverse proxies (Nginx, Cloudflare, Vercel) with SSL/TLS termination.

---

## 📄 License & Support

This project is proprietary software developed for **Mahalaxmi Enterprises**.  
All rights reserved. Unauthorized copying, distribution, or reproduction of this codebase is strictly prohibited.
