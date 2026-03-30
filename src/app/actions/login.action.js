"use server"

import { AppContext } from "@/database"
import * as loginService from "@/app/services/login.service"

export async function signIn(data) {
  const db = new AppContext()
  return await db.withTransaction(null, async (t) => {
    return await loginService.signIn({ transaction: t }, data)
  })
}

export async function signOut() {
  const db = new AppContext()
  return await db.withTransaction(null, async (t) => {
    return await loginService.signOut({ transaction: t })
  })
}
