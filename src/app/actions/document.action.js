"use server"

import { AppContext } from "@/database"
import * as documentService from "@/app/services/document.service"
import * as financeService from "@/app/services/finance.service"
import { ServiceResponse } from "@/libs/service"

export async function findAll(options) {
  const db = new AppContext()
  try {
    return await db.withTransaction(null, async (t) => {
      const result = await documentService.findAll(t, options)
      return ServiceResponse.success(result)
    })
  } catch (error) {
    return ServiceResponse.error(error)
  }
}

export async function findOne(id) {
  const db = new AppContext()
  try {
    return await db.withTransaction(null, async (t) => {
      const result = await documentService.findOne(t, id)
      return ServiceResponse.success(result)
    })
  } catch (error) {
    return ServiceResponse.error(error)
  }
}

export async function update(id, data) {
  const db = new AppContext()
  try {
    return await db.withTransaction(null, async (t) => {
      const result = await documentService.update(t, id, data)
      return ServiceResponse.success(result)
    })
  } catch (error) {
    return ServiceResponse.error(error)
  }
}

export async function create(data) {
  const db = new AppContext()
  try {
    return await db.withTransaction(null, async (t) => {
      const result = await documentService.create(t, data)
      return ServiceResponse.success(result)
    })
  } catch (error) {
    return ServiceResponse.error(error)
  }
}

export async function generateFinance(ids, financeEntries = []) {
  const db = new AppContext()
  try {
    return await db.withTransaction(null, async (t) => {
      // 1. Prepare data (document service)
      const titleData = await documentService.prepareFinanceTitleData(t, ids, financeEntries)

      // 2. Create finance entry (finance service)
      const financeResult = await financeService.create(t, titleData)

      // 3. Link records (document service)
      await documentService.linkFinanceTitle(t, ids, financeResult.id)

      return ServiceResponse.success({ id: financeResult.id })
    })
  } catch (error) {
    return ServiceResponse.error(error)
  }
}

export async function transmit(id) {
  const db = new AppContext()
  try {
    return await db.withTransaction(null, async (t) => {
      await documentService.transmit(t, id)
      return ServiceResponse.success({ message: "Transmissão inicializada" })
    })
  } catch (error) {
    return ServiceResponse.error(error)
  }
}
