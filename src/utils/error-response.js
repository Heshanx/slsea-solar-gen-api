export const errorBody = (code, message, details = null) => ({
  success: false, error: { code, message, details }
});
export const statusCodeName = (status) => ({
  400: "INVALID_REQUEST", 401: "AUTHENTICATION_REQUIRED", 403: "ACCESS_DENIED",
  404: "RESOURCE_NOT_FOUND", 405: "METHOD_NOT_ALLOWED", 406: "NOT_ACCEPTABLE",
  409: "RESOURCE_CONFLICT", 412: "PRECONDITION_FAILED", 413: "PAYLOAD_TOO_LARGE",
  415: "UNSUPPORTED_MEDIA_TYPE", 428: "PRECONDITION_REQUIRED", 429: "RATE_LIMITED",
  503: "SERVICE_UNAVAILABLE"
}[status] || "INTERNAL_ERROR");
