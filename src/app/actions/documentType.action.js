"use server"

import { AppContext } from "@/database"
import * as documentTypeService from "@/app/services/documentType.service"
import { ServiceResponse } from "@/libs/service"

export async function findAll() {
  const db = new AppContext()
  try {
    return await db.withTransaction(null, async (t) => {
      const result = await documentTypeService.findAll(t)
      return ServiceResponse.success(result)
    })
  } catch (error) {
    return ServiceResponse.error(error)
  }
}
