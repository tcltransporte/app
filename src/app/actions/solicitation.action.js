"use server"

import { AppContext } from "@/database"
import * as solicitationService from "@/app/services/solicitation.service"

export async function exportTable(options) {
  const db = new AppContext()
  return await db.withTransaction(null, async (t) => {
    return await solicitationService.exportTable(t, options)
  })
}

export async function findAll(options) {
  const db = new AppContext()
  return await db.withTransaction(null, async (t) => {
    return await solicitationService.findAll(t, options)
  })
}

export async function findOne(id) {
  const db = new AppContext()
  return await db.withTransaction(null, async (t) => {
    return await solicitationService.findOne(t, id)
  })
}

export async function create(data) {
  const db = new AppContext()
  return await db.withTransaction(null, async (t) => {
    return await solicitationService.create(t, data)
  })
}

export async function update(id, data) {
  const db = new AppContext()
  return await db.withTransaction(null, async (t) => {
    return await solicitationService.update(t, id, data)
  })
}

export async function toStatus(id, statusId, description = null) {
  const db = new AppContext()
  return await db.withTransaction(null, async (t) => {
    return await solicitationService.toStatus(t, id, statusId, description)
  })
}

export async function destroy(id) {
  const db = new AppContext()
  return await db.withTransaction(null, async (t) => {
    return await solicitationService.destroy(t, id)
  })
}

export async function findAllowedTransitions(fromStatusIds) {
  const db = new AppContext()
  return await db.withTransaction(null, async (t) => {
    return await solicitationService.findAllowedTransitions(t, fromStatusIds)
  })
}

export async function saveDocuments(solicitationId, documents = []) {
  const db = new AppContext()
  return await db.withTransaction(null, async (t) => {
    return await solicitationService.saveDocuments(t, solicitationId, documents)
  })
}

export async function generateDocuments(solicitationIds = []) {
  const db = new AppContext()
  return await db.withTransaction(null, async (t) => {
    return await solicitationService.generateDocuments(t, solicitationIds)
  })
}
