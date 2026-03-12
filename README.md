# Zuari Hive - Idea Ticketing System

## Overview
A full-stack application for managing, reviewing, and tracking organizational ideas.
Built with React (Vite), Node.js (Express), and PostgreSQL (via Prisma ORM).

## Requirements
- Node.js (v18+ recommended)
- PostgreSQL (running locally or in the cloud)

## Getting Started

### 1. Database Setup
Ensure you have a PostgreSQL database running.

Rename `backend/.env.example` to `backend/.env` and update the `DATABASE_URL` with your Postgres connection string:
```bash
DATABASE_URL="postgresql://postgres:password@localhost:5432/zuari_hive"
```

### 2. Backend Setup
Navigate into the backend directory and install dependencies:
```bash
cd backend
npm install
```

Generate the Prisma Client and push the schema to your database:
```bash
npx prisma generate
npx prisma db push
```

**(Optional) Data Migration:** If you are migrating from the old SQLite database, you can run the provided migration script:
```bash
node scripts/migrate-data.js
```

Start the backend server:
```bash
npm run dev
```

### 3. Frontend Setup
Navigate into the frontend directory and install dependencies:
```bash
cd frontend
npm install
```

Start the frontend development server:
```bash
npm run dev
```

## Production Deployment (AWS Lightsail)
This application is designed to be easily deployed to AWS Lightsail or similar VPS environments.

1. **Database:** Create a managed PostgreSQL database in AWS Lightsail, or run a Dockerized Postgres container.
2. **Environment Variables:** Set the `DATABASE_URL` environment variable in your production environment to point to your secure Postgres database. Make sure to use `?sslmode=require` if mandated by your cloud provider.
3. **Migrations:** Run `npx prisma migrate deploy` in your CI/CD pipeline or start script to apply database changes safely in production.
4. **App Hosting:** Deploy the Node.js backend using PM2 or Docker, and serve the built React frontend (`npm run build` in the frontend folder) via Nginx or a static host.
