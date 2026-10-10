import { AppError } from "../utils/AppError.js";

export const validate = (schema) => {
  return (req, res, next) => {
    const result = schema.safeParse({
      body: req.body ?? {},
      params: req.params ?? {},
      query: req.query ?? {}
    });

    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message
      }));

      return next(
        new AppError("Validation failed", 400, {
          validationErrors: errors
        })
      );
    }

    req.validated = result.data;

    if (result.data.body !== undefined) {
      req.body = result.data.body;
    }

    if (result.data.params !== undefined) {
      Object.assign(req.params, result.data.params);
    }

    next();
  };
};