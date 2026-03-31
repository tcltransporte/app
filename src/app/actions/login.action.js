"use server"

import { AppContext } from "@/database"
import * as loginService from "@/app/services/login.service"
import { ServiceResponse } from "@/libs/service"

export async function signIn(data) {
  const db = new AppContext()
  try {
    return await db.withTransaction(null, async (t) => {
      const result = await loginService.signIn(t, data)
      return ServiceResponse.success(result)
    })
  } catch (error) {
    return ServiceResponse.error(error)
  }
}

export async function signOut() {
  const db = new AppContext()
  try {
    return await db.withTransaction(null, async (t) => {
      await loginService.signOut(t)
      return ServiceResponse.success()
    })
  } catch (error) {
    return ServiceResponse.error(error)
  }
}
