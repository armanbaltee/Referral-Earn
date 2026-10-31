import type { NextFunction, Request, Response } from 'express';
import type { AnyZodObject, ZodEffects } from 'zod';

type ZodSchema = AnyZodObject | ZodEffects<AnyZodObject>;

interface ValidateTargets {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

export function validate(targets: ValidateTargets) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    if (targets.body) {
      req.body = await targets.body.parseAsync(req.body);
    }
    if (targets.query) {
      req.query = (await targets.query.parseAsync(req.query)) as typeof req.query;
    }
    if (targets.params) {
      req.params = await targets.params.parseAsync(req.params);
    }
    next();
  };
}
