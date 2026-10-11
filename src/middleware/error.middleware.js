import { errorBody, statusCodeName } from "../utils/error-response.js";

export const errorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  const isOperational = err.isOperational === true;
  if (err.code === "25006") {
    return res.status(503).json(errorBody("DATABASE_READ_ONLY",
      "This environment uses a read-only database connection; use the isolated development database for writes"));
  }

  const parserErrors = {
    "charset.unsupported": {
      statusCode: 415,
      message: "Unsupported JSON character encoding"
    },
    "encoding.unsupported": {
      statusCode: 415,
      message: "Unsupported content encoding"
    },
    "entity.parse.failed": {
      statusCode: 400,
      message: "Invalid JSON request body"
    },
    "entity.too.large": {
      statusCode: 413,
      message: "Request body too large"
    }
  };

  const parserError = parserErrors[err.type];
  const rawStatusCode = Number(err.statusCode);

  const statusCode = parserError
    ? parserError.statusCode
    : isOperational &&
        Number.isInteger(rawStatusCode) &&
        rawStatusCode >= 400 &&
        rawStatusCode <= 599
      ? rawStatusCode
      : 500;

  const response = errorBody(
    err.code && isOperational ? err.code : statusCodeName(statusCode),
    parserError?.message ?? (statusCode === 500 ? "Internal server error" : err.message || "Request failed"),
    isOperational ? err.details ?? null : null
  );
  if (["23505", "23503", "23514", "23502", "22003", "22007", "22008"].includes(err.code)) {
    const constraintStatus = err.code === "23505" ? 409 : 400;
    return res.status(constraintStatus).json(errorBody(statusCodeName(constraintStatus),
      err.code === "23505" ? "Resource identifier already exists" : "Invalid resource relationship or field value"));
  }
  if (statusCode === 500) {
    console.error("Unhandled API error:", err);
  }

  return res.status(statusCode).json(response);
};
