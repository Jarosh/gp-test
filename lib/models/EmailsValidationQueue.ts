import { model, Schema } from 'mongoose';

interface IEmailsValidationQueue {
  _id: string;
  createdAt: Date;
  fetchedAt: Date;
  checkedAt: Date;
  email: string;
  isValid: boolean;
  sessions: string[];
}

const EmailsValidationQueueSchema: Schema = new Schema({
  _id: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    required: true
  },
  fetchedAt: {
    type: Date,
    default: null
  },
  checkedAt: {
    type: Date,
    default: null,
    index: true
  },
  email: {
    type: String,
    required: true,
    index: true,
    unique: true
  },
  isValid: {
    type: Boolean,
    default: null
  },
  sessions: {
    type: [String],
    default: []
  }
});

const EmailsValidationQueueModel = model('EmailsValidationQueue', EmailsValidationQueueSchema, 'EmailsValidationQueue');

EmailsValidationQueueModel.createIndexes();

export {
  IEmailsValidationQueue,
  EmailsValidationQueueSchema,
  EmailsValidationQueueModel
};
