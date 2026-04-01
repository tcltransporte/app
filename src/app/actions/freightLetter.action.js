"use server"

import { AppContext } from "@/database"
import * as freightLetterService from "@/app/services/freightLetter.service"
import { ServiceResponse } from "@/libs/service"

export async function findAllComponentTypes() {
  const db = new AppContext()
  try {
    return await db.withTransaction(null, async (t) => {
      const result = await freightLetterService.findAllComponentTypes(t)
      return ServiceResponse.success(result)
    })
  } catch (error) {
    return ServiceResponse.error(error)
  }
}
