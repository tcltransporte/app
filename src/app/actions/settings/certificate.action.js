"use server"

import { AppContext } from "@/database"
import * as certificateService from "@/app/services/settings/certificate.service"
import { ServiceResponse } from "@/libs/service"

export async function findOne() {
  const db = new AppContext()
  try {
    return await db.withTransaction(null, async (t) => {
      const result = await certificateService.findOne(t)
      return ServiceResponse.success({ certificate: result })
    })
  } catch (error) {
    return ServiceResponse.error(error)
  }
}

export async function submit(data) {
  const db = new AppContext()
  try {
    return await db.withTransaction(null, async (t) => {
      const result = await certificateService.submit(t, {
        file: data.file,
        password: data.password,
      })
      return ServiceResponse.success(result)
    })
  } catch (error) {
    return ServiceResponse.error(error)
  }
}

export async function destroy() {
  const db = new AppContext()
  try {
    return await db.withTransaction(null, async (t) => {
      const result = await certificateService.destroy(t)
      return ServiceResponse.success(result)
    })
  } catch (error) {
    return ServiceResponse.error(error)
  }
}
