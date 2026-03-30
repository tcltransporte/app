"use server"

import { AppContext } from "@/database"
import * as companyService from "@/app/services/settings/company.service"

export async function findOne() {
  const db = new AppContext()
  return await db.withTransaction(null, async (t) => {
    return await companyService.findOne(t)
  })
}

export async function saveStatusConfig(data) {
  const db = new AppContext()
  return await db.withTransaction(null, async (t) => {
    return await companyService.saveStatusConfig(t, data)
  })
}

export async function findAllStatuses() {
  const db = new AppContext()
  return await db.withTransaction(null, async (t) => {
    return await companyService.findAllStatuses(t)
  })
}

export async function getStatusesConfig() {
  const db = new AppContext()
  return await db.withTransaction(null, async (t) => {
    return await companyService.getStatusesConfig(t)
  })
}

export async function destroyStatus(id) {
  const db = new AppContext()
  return await db.withTransaction(null, async (t) => {
    return await companyService.destroyStatus(t, id)
  })
}

export async function findAllowedTransitions(fromStatusIds, typeId) {
  const db = new AppContext()
  return await db.withTransaction(null, async (t) => {
    return await companyService.findAllowedTransitions(t, fromStatusIds, typeId)
  })
}

export async function findAllStatusTypes() {
  const db = new AppContext()
  return await db.withTransaction(null, async (t) => {
    return await companyService.findAllStatusTypes(t)
  })
}

export async function findAllStatusRelationships() {
  const db = new AppContext()
  return await db.withTransaction(null, async (t) => {
    return await companyService.findAllStatusRelationships(t)
  })
}

export async function findAllTypes() {
  const db = new AppContext()
  return await db.withTransaction(null, async (t) => {
    return await companyService.findAllTypes(t)
  })
}
