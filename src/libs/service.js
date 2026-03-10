import { NextResponse } from "next/server"

const result = (status, body = {}) => ({
  status,
  ...body
})

export const ServiceStatus = Object.freeze({
  OK: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  INTERNAL_SERVER_ERROR: 500
})

export const ServiceResponse = {

  ok: (data) =>
    result(ServiceStatus.OK, data),

  badRequest: (code, message, data) =>
    result(ServiceStatus.BAD_REQUEST, { code, message, ...data }),

  unauthorized: (code, message, data) =>
    result(ServiceStatus.UNAUTHORIZED, { code, message, ...data }),

  error: (error) => {

    // erro controlado
    if (error?.status) {
      return result(error.status, {
        code: error.code,
        message: error.message
      })
    }

    return result(ServiceStatus.INTERNAL_SERVER_ERROR, {
      code: "INTERNAL_SERVER_ERROR",
      message: error.message
    })

  },

  json: (result) => {
    const { status, ...body } = result
    return NextResponse.json(body, { status })
  },

}

export const ServiceRequest = {

  run: async (promise) => {

    const result = await promise

    if (result.status !== ServiceStatus.OK) {

      throw result

    }

    return result

  }

}