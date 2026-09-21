import type { Request, Response, NextFunction } from 'express';

// Last middleware in app.ts. Turns thrown errors into JSON { message }.
export const errorHandler = (
  err: Error & { status?: number },
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  const statusCode = err.status || 500;
  const message = err.message || 'Internal server error';

  res.status(statusCode).json({ message });
};
