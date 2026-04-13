"use server"

import { AppContext } from "@/database"
import * as financeService from "@/app/services/finance.service"
import { ServiceResponse } from "@/libs/service"

export async function create(data) {
  const db = new AppContext()
  try {
    return await db.withTransaction(null, async (t) => {
      const result = await financeService.create(t, data)
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
      const result = await financeService.update(t, id, data)
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
      const result = await financeService.findOne(t, id)
      return ServiceResponse.success(result)
    })
  } catch (error) {
    return ServiceResponse.error(error)
  }
}

export async function findAllBankMovements(params) {
  const db = new AppContext()
  try {
    return await db.withTransaction(null, async (t) => {
      const result = await financeService.findAllBankMovements(t, params)
      return ServiceResponse.success(result)
    })
  } catch (error) {
    return ServiceResponse.error(error)
  }
}

export async function createBankMovement(data) {
  const db = new AppContext()
  try {
    return await db.withTransaction(null, async (t) => {
      const result = await financeService.createBankMovement(t, data)
      return ServiceResponse.success(result)
    })
  } catch (error) {
    return ServiceResponse.error(error)
  }
}

export async function findBankBalances() {
  const db = new AppContext()
  try {
    return await db.withTransaction(null, async (t) => {
      const result = await financeService.findBankBalances(t)
      return ServiceResponse.success(result)
    })
  } catch (error) {
    return ServiceResponse.error(error)
  }
}
