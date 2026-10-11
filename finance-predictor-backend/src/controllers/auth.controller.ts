import type { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.ts';
import type { AuthedRequest } from '../middleware/requireAuth.ts';

const tokenFor = (user: { id: string; email: string; name: string }): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is missing');
  }
  return jwt.sign({ sub: user.id, email: user.email, name: user.name }, secret, {
    expiresIn: '7d',
  });
};

const publicUser = (doc: { id: string; email: string; name?: string }) => ({
  id: doc.id,
  email: doc.email,
  name: doc.name ?? '',
});

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const email = String(req.body.email).toLowerCase().trim();
    const existing = await User.findOne({ email });
    if (existing) {
      res.status(409).json({ message: 'E-Mail ist bereits registriert' });
      return;
    }

    const passwordHash = await bcrypt.hash(req.body.password, 10);
    const doc = await User.create({
      email,
      passwordHash,
      name: req.body.name ?? '',
    });
    const user = publicUser({ id: String(doc._id), email: doc.email, name: doc.name });
    res.status(201).json({ token: tokenFor(user), user });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const email = String(req.body.email).toLowerCase().trim();
    const doc = await User.findOne({ email });
    if (!doc) {
      res.status(401).json({ message: 'E-Mail oder Passwort ist falsch' });
      return;
    }

    const ok = await bcrypt.compare(req.body.password, doc.passwordHash);
    if (!ok) {
      res.status(401).json({ message: 'E-Mail oder Passwort ist falsch' });
      return;
    }

    const user = publicUser({ id: String(doc._id), email: doc.email, name: doc.name });
    res.status(200).json({ token: tokenFor(user), user });
  } catch (error) {
    next(error);
  }
};

export const me = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = (req as AuthedRequest).user;
    const doc = await User.findById(id);
    if (!doc) {
      res.status(401).json({ message: 'Token ungültig' });
      return;
    }
    res.status(200).json(publicUser({ id: String(doc._id), email: doc.email, name: doc.name }));
  } catch (error) {
    next(error);
  }
};
