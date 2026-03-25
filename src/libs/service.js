export const ServiceStatus = Object.freeze({
  SUCCESS: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  INTERNAL_SERVER_ERROR: 500
})

const createResponse = (status, body, header = {}) => ({ 
  header: { status, ...header }, 
  body 
})

export const ServiceResponse = {
  success: (body) =>
    createResponse(ServiceStatus.SUCCESS, body),

  badRequest: (code, message, body) =>
    createResponse(ServiceStatus.BAD_REQUEST, body, { code, message }),

  unauthorized: (code, message, body) =>
    createResponse(ServiceStatus.UNAUTHORIZED, body, { code, message }),

  error: (err_or_code, message, body) => {
    if (typeof err_or_code === 'object') {
      // If it's already a formatted response, return it as is
      if (err_or_code.header) return err_or_code;

      const status = err_or_code.status || ServiceStatus.INTERNAL_SERVER_ERROR;
      const message = err_or_code.message || "Ocorreu um erro interno.";
      const code = err_or_code.code || "INTERNAL_ERROR";
      return createResponse(status, { ...err_or_code.body }, { code, message });
    }

    return createResponse(ServiceStatus.INTERNAL_SERVER_ERROR, body, { code: err_or_code, message });
  }
}

export function sanitize(data) {
  if (Array.isArray(data)) {
    return data.map(sanitize)
  }

  if (data !== null && typeof data === 'object' && !(data instanceof Date)) {
    const sanitized = {}
    for (const key in data) {
      sanitized[key] = sanitize(data[key])
    }
    return sanitized
  }

  if (data === '' || data === 'Invalid date') {
    return null
  }

  return data
}