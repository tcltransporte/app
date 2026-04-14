"use server"

import { AppContext } from "@/database"
import * as bankService from "@/app/services/bank.service"
import { ServiceResponse } from "@/libs/service"

export async function findAll(options) {
  const db = new AppContext()
  try {
    return await db.withTransaction(null, async (t) => {
      const result = await bankService.findAll(t, options)
      return ServiceResponse.success(result)
    })
  } catch (error) {
    return ServiceResponse.error(error)
  }
}
