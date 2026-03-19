export const ServiceStatus = Object.freeze({
  SUCCESS: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  INTERNAL_SERVER_ERROR: 500
})

const createResponse = (status, body) => ({ status, ...body })

export const ServiceResponse = {
  success: (body) =>
    createResponse(ServiceStatus.SUCCESS, body),

  badRequest: (code, message, body) =>
    createResponse(ServiceStatus.BAD_REQUEST, { code, message, body }),

  unauthorized: (code, message, body) =>
    createResponse(ServiceStatus.UNAUTHORIZED, { code, message, body }),

  error: (err) => {
    const status = err.status || ServiceStatus.INTERNAL_SERVER_ERROR
    const message = err.message || "Ocorreu um erro interno."
    const code = err.code || "INTERNAL_ERROR"
    return createResponse(status, { code, message, ...err.body })
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