import mongoose from 'mongoose';

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// lets route handlers be async without try/catch everywhere
export const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

export function assertObjectId(id, message = 'Not found.') {
  if (!mongoose.isValidObjectId(id)) throw new HttpError(404, message);
}

export const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
