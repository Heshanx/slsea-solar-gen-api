export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;

  const response = {
    success: false,
    error: {
      message: err.message || "Internal server error"
    }
  };

  if (err.details) {
    response.error.details = err.details;
  }

  if (process.env.NODE_ENV === "development") {
    response.error.stack = err.stack;
  }

  res.status(statusCode).json(response);
};