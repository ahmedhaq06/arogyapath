import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { AppError } from './error.middleware';

export function validate(schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const data = schema.parse(req[source]);
      req[source] = data;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const fields: Record<string, string> = {};
        err.errors.forEach((e) => {
          const path = e.path.join('.');
          fields[path] = e.message;
        });
        next(new AppError(400, 'VALIDATION_ERROR', 'Some fields are invalid.', fields));
      } else {
        next(err);
      }
    }
  };
}
