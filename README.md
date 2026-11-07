# ReachInbox Full-Stack Email Scheduler

A persistent, delayed email scheduling platform with asynchronous task scheduling, queue recovery across server restarts, and reliable delivery dispatch.

## Architecture & Features
- **Frontend**: React + TypeScript + Vite dashboard with 3 primary views (Schedule Form, Scheduled List, Sent List).
- **Backend**: Express.js REST API in TypeScript handling scheduling, validation, and delay calculations.
- **Job Queue**: BullMQ + Redis (Upstash) using Redis Sorted Sets (`ZSET`) for delayed task persistence across server restarts.
- **Worker**: Dedicated `ioredis` connection instance, Nodemailer with Ethereal SMTP test transporter, and auto-generated preview links.
- **Database**: SQLite via Prisma ORM for relational state tracking (`SCHEDULED`, `SENT`, `FAILED`).

## Quick Start

### 1. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env and insert your Upstash Redis credentials
npx prisma generate
npx prisma db push
npm run dev
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.
