export function notFoundHandler(req, res) {
  res.status(404).json({
    message: `Route not found: ${req.originalUrl}`,
  });
}

export function errorHandler(error, req, res, next) {
  const statusCode = error.statusCode || 500;

  res.status(statusCode).json({
    message: error.message || "Internal server error",
    details: error.details || null,
    stack: process.env.NODE_ENV === "production" ? undefined : error.stack,
  });
}

