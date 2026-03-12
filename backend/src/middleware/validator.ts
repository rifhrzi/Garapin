import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { sendError } from '../utils/apiResponse';

export function validate(schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = schema.parse(req[source]);
      req[source] = data;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.errors.map((zodError) => ({
          field: zodError.path.join('.'),
          message: zodError.message,
        }));
        return sendError(res, 'Validation failed', 422, formattedErrors);
      }
      next(error);
    }
  };
}
