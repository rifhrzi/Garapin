import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/apiResponse';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Middleware that validates a route parameter is a valid UUID format.
 * Prevents invalid IDs from reaching the database layer.
 */
export function validateUUID(paramName: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const value = req.params[paramName] as string | undefined;
    if (!value || typeof value !== 'string' || !UUID_REGEX.test(value)) {
      return sendError(res, `Invalid ${paramName} format`, 400);
    }
    next();
  };
}
