import { AppError } from "../utils/AppError.js";

export const methodNotAllowed = (allow) => (_req, res, next) => {
  res.set("Allow", allow);
  next(new AppError("Method is not supported for this resource", 405));
};
