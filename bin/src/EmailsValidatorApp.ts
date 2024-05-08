import * as path from 'path';
import mongoose from 'mongoose';
import { Worker } from 'worker_threads';

import MongoDB from '@app/lib/helpers/MongoDB';
import { EmailsValidationQueueModel } from '@app/lib/models';

const MAX_THREADS_NUM: number = parseInt(process.env.MAX_THREADS_NUM as string, 10) || 10;

type Maybe<T> = T | null | undefined;

class App {
  private db: Maybe<mongoose.Connection> = null;
  private isInitialized: boolean = false;
  private runningTasksCounter: number = 0;

  public constructor() {
    console.info(`EmailsValidatorApp instance created; MAX_THREADS_NUM = ${MAX_THREADS_NUM}`);
  }

  public init(): Promise<typeof this> {
    return new Promise((resolve) => {
      if (!this.isInitialized) {
        this.db = MongoDB.connect(process.env.MONGODB_URL as string);

        this.db?.once('open', () => {
          this.isInitialized = true;
          resolve(this);
        });

        process.on('SIGINT', () => {
          console.info('SIGINT signal received.');
          this.stop();
        });
      } else {
        resolve(this);
      }
    });
  }

  public start(): typeof this {
    if (!this.isInitialized) {
      throw new Error('Prior initialization is required.');
    }

    EmailsValidationQueueModel
      .watch(
        [{
          $match: {
            $or: [
              { operationType: 'insert' },
              {
                $and: [
                  { operationType: 'update' },
                  { 'updateDescription.updatedFields.checkedAt': { $exists: true, $eq: null } },
                ],
              },
            ],
          },
        }],
        // { fullDocument: 'updateLookup' }
      )
      .on('change', () => {
        this.enqueueTasks();
      });

    this.enqueueTasks();

    return this;
  }

  public stop(): void {
    if (!this.isInitialized) {
      throw new Error('Prior initialization is required.');
    }

    console.info('Stopping the application...');

    MongoDB.disconnect();
  }
  
  private async enqueueTasks(): Promise<void> {
    while (this.runningTasksCounter < MAX_THREADS_NUM) {
      this.runningTasksCounter++;
      const record: Maybe<{ _id: string, email: string }> = await EmailsValidationQueueModel
        .findOneAndUpdate(
          { $or: [
            { fetchedAt: { $exists: false } },
            { fetchedAt: null },
            { // anything that was fetched >= 10 minutes ago and didn't get status update is obviously stuck and may need some recheck
              fetchedAt: { $lt: new Date(Date.now() - 1000 * 60 * 10) },
              $or: [
                { checkedAt: { $exists: false } },
                { checkedAt: null },
              ],
            },
          ] },
          { $set: { fetchedAt: new Date() } },
        )
        .sort({ createdAt: 1 })
        .lean();

      if (record) {
        const worker = new Worker(path.resolve(__dirname, './EmailsValidatorWorker.ts'), {
          workerData: { email: record.email },
        });
        worker.on('message', async (data) => {
          await EmailsValidationQueueModel.updateOne(
            { _id: record._id },
            { checkedAt: new Date(), isValid: data.isValid },
          );
          this.runningTasksCounter--;
          this.enqueueTasks();
        });
      } else {
        this.runningTasksCounter--;
        console.log('NO MORE TASKS TO ENQUEUE FOR NOW');
        break;
      }
    }
  }

}

export default new App();
