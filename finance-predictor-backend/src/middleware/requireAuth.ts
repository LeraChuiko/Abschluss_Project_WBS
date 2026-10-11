import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export type AuthUser = { id: string; email: string; name: string };

export type AuthedRequest = Request & { user: AuthUser };

const secret = (): string => {
  const value = process.env.JWT_SECRET;
  if (!value) {
    throw new Error('JWT_SECRET is missing');
  }
  return value;
};

export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) {
    res.status(401).json({ message: 'Token fehlt' });
    return;
  }

  try {
    const payload = jwt.verify(token, secret()) as {
      sub?: string;
      email?: string;
      name?: string;
    };
    if (!payload.sub || !payload.email) {
      res.status(401).json({ message: 'Token ungültig' });
      return;
    }
    (req as AuthedRequest).user = {
      id: payload.sub,
      email: payload.email,
      name: payload.name ?? '',
    };
    next();
  } catch {
    res.status(401).json({ message: 'Token ungültig' });
    return;
  }
};
