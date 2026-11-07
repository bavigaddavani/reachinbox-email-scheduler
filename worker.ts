import { Worker, Job } from 'bullmq';
import nodemailer from 'nodemailer';
import { PrismaClient } from '@prisma/client';
import { createRedisConnection } from './queue.js';

const prisma = new PrismaClient();

async function createEtherealTransporter() {
  const testAccount = await nodemailer.createTestAccount();
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
}

export const startWorker = async () => {
  console.log('Initializing Ethereal email transporter...');
  const transporter = await createEtherealTransporter();
  console.log('Ethereal ready.');

  const worker = new Worker(
    'email-queue',
    async (job: Job) => {
      const { emailRecordId, recipient, subject, body } = job.data;
      console.log(`Processing email job ${job.id} for ${recipient}...`);

      try {
        const info = await transporter.sendMail({
          from: '"ReachInbox Scheduler" <scheduler@test.local>',
          to: recipient,
          subject,
          text: body,
          html: `<p>${body}</p>`,
        });

        const previewUrl = nodemailer.getTestMessageUrl(info) || null;

        await prisma.emailJob.update({
          where: { id: emailRecordId },
          data: {
            status: 'SENT',
            sentAt: new Date(),
            previewUrl,
          },
        });

        console.log(`Dispatched to ${recipient}. Preview URL: ${previewUrl}`);
      } catch (err) {
        console.error(`Failed to send email to ${recipient}:`, err);
        await prisma.emailJob.update({
          where: { id: emailRecordId },
          data: { status: 'FAILED' },
        });
        throw err;
      }
    },
    {
      connection: createRedisConnection(),
      concurrency: 5,
    }
  );

  worker.on('ready', () => {
    console.log('>>> BullMQ worker is READY and actively processing jobs! <<<');
  });

  worker.on('error', (err) => {
    console.error('BullMQ Worker Error:', err.message);
  });

  worker.on('failed', (job, err) => {
    console.error(`Job ${job?.id} failed:`, err);
  });
};
