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

  error: ({status = ServiceStatus.INTERNAL_SERVER_ERROR, code, message, body}) =>
    createResponse(status, { code, message, ...body })

}