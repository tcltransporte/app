"use server"

import { AppContext } from "@/database"
import * as documentTypeService from "@/app/services/documentType.service"

export async function findAll() {
  const db = new AppContext()
  return await db.withTransaction(null, async (t) => {
    return await documentTypeService.findAll(t)
  })
}
