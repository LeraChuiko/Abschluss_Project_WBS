import type { Request } from 'express';
import mongoose from 'mongoose';
import type { AuthedRequest } from '../middleware/requireAuth.ts';

export const ownerId = (req: Request): string => (req as AuthedRequest).user.id;

export const byOwner = (userId: string): { userId: mongoose.Types.ObjectId } => ({
  userId: new mongoose.Types.ObjectId(userId),
});

export const owned = (
  req: Request,
  extra: Record<string, unknown> = {},
): Record<string, unknown> => ({
  ...extra,
  ...byOwner(ownerId(req)),
});
