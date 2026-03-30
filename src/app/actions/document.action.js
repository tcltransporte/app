"use server"

import { AppContext } from "@/database"
import * as documentService from "@/app/services/document.service"

export async function findAll(options) {
  const db = new AppContext()
  return await db.withTransaction(null, async (t) => {
    return await documentService.findAll(t, options)
  })
}

export async function findOne(id) {
  const db = new AppContext()
  return await db.withTransaction(null, async (t) => {
    return await documentService.findOne(t, id)
  })
}

export async function update(id, data) {
  const db = new AppContext()
  return await db.withTransaction(null, async (t) => {
    return await documentService.update(t, id, data)
  })
}

export async function create(data) {
  const db = new AppContext()
  return await db.withTransaction(null, async (t) => {
    return await documentService.create(t, data)
  })
}

export async function generateFinance(ids, financeEntries = []) {
  const db = new AppContext()
  return await db.withTransaction(null, async (t) => {
    return await documentService.generateFinance(t, ids, financeEntries)
  })
}

export async function transmit(id) {
  const db = new AppContext()
  return await db.withTransaction(null, async (t) => {
    return await documentService.transmit(t, id)
  })
}
