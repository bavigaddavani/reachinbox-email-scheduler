import express from 'express';
import type { Request, Response } from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { emailQueue } from './queue.js';
import { startWorker } from './worker.js';

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// 1. Schedule a new email
app.post('/api/emails/schedule', async (req: Request, res: Response) => {
  try {
    const { recipient, subject, body, scheduledFor } = req.body;
    const targetDate = new Date(scheduledFor);
    const delay = Math.max(0, targetDate.getTime() - Date.now());

    const record = await prisma.emailJob.create({
      data: {
        recipient,
        subject,
        body,
        scheduledFor: targetDate,
        status: 'SCHEDULED',
      },
    });

    await emailQueue.add(
      'send-email',
      { emailRecordId: record.id, recipient, subject, body },
      { delay, jobId: record.id }
    );

    console.log(`Email job queued: ${record.id}`);
    res.status(201).json(record);
  } catch (error: any) {
    console.error('Schedule error:', error);
    res.status(500).json({ error: error.message || 'Failed to schedule email' });
  }
});

// 2. View scheduled emails
app.get('/api/emails/scheduled', async (_req: Request, res: Response) => {
  try {
    const scheduled = await prisma.emailJob.findMany({
      where: { status: 'SCHEDULED' },
      orderBy: { scheduledFor: 'asc' },
    });
    res.json(scheduled);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch scheduled emails' });
  }
});

// 3. View sent emails
app.get('/api/emails/sent', async (_req: Request, res: Response) => {
  try {
    const sent = await prisma.emailJob.findMany({
      where: { status: 'SENT' },
      orderBy: { sentAt: 'desc' },
    });
    res.json(sent);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch sent emails' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  await startWorker();
  console.log(`Backend server running on http://localhost:${PORT}`);
});
