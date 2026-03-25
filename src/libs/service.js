export const ServiceStatus = Object.freeze({
  SUCCESS: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  INTERNAL_SERVER_ERROR: 500
})

const createResponse = (header, body) => ({
  header,
  body
})

export const ServiceResponse = {
  success: (body) =>
    createResponse({ status: ServiceStatus.SUCCESS }, body),

  badRequest: (code, message, body) =>
    createResponse({ status: ServiceStatus.BAD_REQUEST }, { ...body, code, message }),

  unauthorized: (code, message, body) =>
    createResponse({ status: ServiceStatus.UNAUTHORIZED }, { ...body, code, message }),

  error: (error) => {

    const status = error.header?.status || ServiceStatus.INTERNAL_SERVER_ERROR;

    const code = error.body?.code || "INTERNAL_ERROR";
    const message = error.body?.message || error.message || "Ocorreu um erro interno!";

    return createResponse({ status }, { ...error.body, code, message });

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