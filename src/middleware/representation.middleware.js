import { AppError } from "../utils/AppError.js";
export const requireJsonRepresentation = (req, res, next) => {
  if (req.path.startsWith("/docs")) return next();
  if (!req.accepts("application/json")) return next(new AppError("Only application/json is available", 406));
  if (["POST", "PUT", "PATCH"].includes(req.method) && req.get("content-type") && !req.is("application/json")) {
    return next(new AppError("Request body must use application/json", 415));
  }
  next();
};
