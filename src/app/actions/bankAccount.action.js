"use server"

import { AppContext } from "@/database"
import * as bankAccountService from "@/app/services/bankAccount.service"
import { ServiceResponse } from "@/libs/service"

export async function findAll(options) {
  const db = new AppContext()
  try {
    return await db.withTransaction(null, async (t) => {
      const result = await bankAccountService.findAll(t, options)
      return ServiceResponse.success(result)
    })
  } catch (error) {
    return ServiceResponse.error(error)
  }
}

