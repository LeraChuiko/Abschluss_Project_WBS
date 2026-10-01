import type { Request, Response } from 'express';

// Simple check: is the server running? No database needed.
export const getHealth = (_req: Request, res: Response): void => {
  res.status(200).json({ ok: true });
};
