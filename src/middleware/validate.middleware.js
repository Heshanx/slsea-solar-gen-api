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

    // Keep parsed values separate from Express request properties.
    req.validated = result.data;

    next();
  };
};