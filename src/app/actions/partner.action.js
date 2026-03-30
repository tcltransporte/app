"use server"

import { AppContext } from "@/database"
import * as partnerService from "@/app/services/partner.service"

export async function exportTable(options) {
  const db = new AppContext()
  return await db.withTransaction(null, async (t) => {
    return await partnerService.exportTable(t, options)
  })
}

export async function findAll(options) {
  const db = new AppContext()
  return await db.withTransaction(null, async (t) => {
    return await partnerService.findAll(t, options)
  })
}

export async function findOne(id) {
  const db = new AppContext()
  return await db.withTransaction(null, async (t) => {
    return await partnerService.findOne(t, id)
  })
}

export async function create(data) {
  const db = new AppContext()
  return await db.withTransaction(null, async (t) => {
    return await partnerService.create(t, data)
  })
}

export async function update(id, data) {
  const db = new AppContext()
  return await db.withTransaction(null, async (t) => {
    return await partnerService.update(t, id, data)
  })
}

export async function destroy(id) {
  const db = new AppContext()
  return await db.withTransaction(null, async (t) => {
    return await partnerService.destroy(t, id)
  })
}
