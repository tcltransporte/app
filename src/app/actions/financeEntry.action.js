"use server"

import { AppContext } from "@/database"
import * as financeService from "@/app/services/finance.service"
import { ServiceResponse } from "@/libs/service"

export async function findAll(options) {
  const db = new AppContext()
  try {
    return await db.withTransaction(null, async (t) => {
      const result = await financeService.findAllEntries(t, options)
      return ServiceResponse.success(result)
    })
  } catch (error) {
    return ServiceResponse.error(error)
  }
}

export async function findEntry(id) {
  const db = new AppContext()
  try {
    return await db.withTransaction(null, async (t) => {
      const result = await financeService.findEntry(t, id)
      return ServiceResponse.success(result)
    })
  } catch (error) {
    return ServiceResponse.error(error)
  }
}

export async function updateEntry(id, data) {
  const db = new AppContext()
  try {
    return await db.withTransaction(null, async (t) => {
      const result = await financeService.updateEntry(t, id, data)
      return ServiceResponse.success(result)
    })
  } catch (error) {
    return ServiceResponse.error(error)
  }
}

export async function findEntryPaymentHistory(id) {
  const db = new AppContext()
  try {
    return await db.withTransaction(null, async (t) => {
      const result = await financeService.findEntryPaymentHistory(t, id)
      return ServiceResponse.success(result)
    })
  } catch (error) {
    return ServiceResponse.error(error)
  }
}

export async function deleteEntry(id) {
  const db = new AppContext()
  try {
    return await db.withTransaction(null, async (t) => {
      const result = await financeService.deleteEntry(t, id)
      return ServiceResponse.success(result)
    })
  } catch (error) {
    return ServiceResponse.error(error)
  }
}

export async function deleteEntriesBatch(entryIds) {
  const db = new AppContext()
  try {
    return await db.withTransaction(null, async (t) => {
      const result = await financeService.deleteEntriesBatch(t, entryIds)
      return ServiceResponse.success(result)
    })
  } catch (error) {
    return ServiceResponse.error(error)
  }
}
