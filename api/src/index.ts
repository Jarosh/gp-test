import express from 'express';
import { Request, Response } from 'express';
import mongoose from 'mongoose';
import crypto from 'crypto';
import dotenvSafe from 'dotenv-safe';
import cookieParser from 'cookie-parser';
import cors from 'cors';

import MongoDB from '@app/lib/helpers/MongoDB';
import { EmailsValidationQueueModel } from '@app/lib/models';

const PORT: number = parseInt(process.env.PORT as string, 10)
  || parseInt(process.argv[2] as string)
  || 3000;

dotenvSafe.config({
  allowEmptyValues: false,
});

const app: express.Express = express();
const db: mongoose.Connection = MongoDB.connect(process.env.MONGODB_URL as string);

db.on('error', () => console.error('MongoDB connection failed'));

app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

app.use((req: Request, res: Response, next: () => void) => {
  const sessuid = req.cookies.sessuid;
  if (!sessuid) {
    const newSessuid: string = crypto.createHash('md5').update(Math.random().toFixed(12)).digest('hex');
    res.cookie(
      'sessuid',
      newSessuid,
      {
        maxAge: 1000 * 60 * 60 * 24 * 30,
        httpOnly: true,
        sameSite: 'none',
      },
    );
    req.cookies.sessuid = newSessuid;
  }
  next();
});

app.listen(PORT, (): void => {
  console.log(`API server started on port ${PORT}`);
});

app.get(
  '/api/v1/emails/validator',
  async (req: Request, res: Response): Promise<void> => {
    const tsFrom: number = parseInt(req.query.tsFrom as string, 10);
    const criteria: { sessions: {}, $or?: {}[] } = { sessions: { $all: [req.cookies.sessuid] } };
    if (tsFrom) {
      criteria['$or'] = [
        { createdAt: { $gte: new Date(tsFrom) } },
        { checkedAt: { $gte: new Date(tsFrom) } },
      ];
    }
    res.send(await EmailsValidationQueueModel.find(
      criteria,
      { checkedAt: 1, email: 1, isValid: 1 },
    ));
  },
);

app.post(
  '/api/v1/emails/validator',
  async (req: Request<{}, {}, { emails: string[] }>, res: Response): Promise<void> => {
    await EmailsValidationQueueModel.updateMany(
      { email: { $in: req.body.emails } },
      { $addToSet: { sessions: req.cookies.sessuid } },
    );
    
    await EmailsValidationQueueModel.insertMany(
      req.body.emails
        .filter((i: string) => i.match(/.*@.*/g))
        .map((i: string) => ({
          _id: new mongoose.Types.ObjectId(),
          createdAt: Date.now(),
          email: i.trim(),
          sessions: [req.cookies.sessuid],
        })),
      { ordered: false }, // non-prod-ready shitty hack to cut some corners
    ).catch(() => {});

    res.send({});
  },
);
