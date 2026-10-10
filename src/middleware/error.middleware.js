export const errorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  const isOperational = err.isOperational === true;

  const parserErrors = {
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

  const response = {
    success: false,
    error: {
      message:
        parserError?.message ??
        (statusCode === 500
          ? "Internal server error"
          : err.message || "Request failed")
    }
  };

  if (isOperational && err.details != null) {
    response.error.details = err.details;
  }

  if (process.env.NODE_ENV === "development") {
    response.error.stack = err.stack;
  }

  if (statusCode === 500) {
    console.error("Unhandled API error:", err);
  }

  return res.status(statusCode).json(response);
};
