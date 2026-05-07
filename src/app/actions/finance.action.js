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


export async function traceBankMovement(id) {
  const db = new AppContext()
  try {
    return await db.withTransaction(null, async (t) => {
      const result = await financeService.traceBankMovement(t, id)
      return ServiceResponse.success(result)
    })
  } catch (error) {
    return ServiceResponse.error(error)
  }
}

export async function reverseSettlementFromBankMovement(movementId) {
  const db = new AppContext()
  try {
    return await db.withTransaction(null, async (t) => {
      const result = await financeService.reverseSettlementFromBankMovement(t, movementId)
      return ServiceResponse.success(result)
    })
  } catch (error) {
    return ServiceResponse.error(error)
  }
}

export async function reverseSettlementFromPayment(paymentId) {
  const db = new AppContext()
  try {
    return await db.withTransaction(null, async (t) => {
      const result = await financeService.reverseSettlementFromPayment(t, paymentId)
      return ServiceResponse.success(result)
    })
  } catch (error) {
    return ServiceResponse.error(error)
  }
}

export async function reverseSettlementsFromEntries(entryIds) {
  const db = new AppContext()
  try {
    return await db.withTransaction(null, async (t) => {
      const result = await financeService.reverseSettlementsFromEntries(t, entryIds)
      return ServiceResponse.success(result)
    })
  } catch (error) {
    return ServiceResponse.error(error)
  }
}

export async function approveConciliationBatch(payload) {
  const db = new AppContext()
  try {
    return await db.withTransaction(null, async (t) => {
      const movementIds = Array.isArray(payload) ? payload : payload?.movementIds
      const result = await financeService.approveConciliationBatch(t, movementIds, {
        realDate: payload?.realDate,
        bankAccountId: payload?.bankAccountId
      })
      return ServiceResponse.success(result)
    })
  } catch (error) {
    return ServiceResponse.error(error)
  }
}

export async function approveConciliationMovement(data) {
  const db = new AppContext()
  try {
    return await db.withTransaction(null, async (t) => {
      const result = await financeService.approveConciliationMovement(t, data)
      return ServiceResponse.success(result)
    })
  } catch (error) {
    return ServiceResponse.error(error)
  }
}
export async function createBankTransfer(data) {
  const db = new AppContext()
  try {
    return await db.withTransaction(null, async (t) => {
      const result = await financeService.createBankTransfer(t, data)
      return ServiceResponse.success(result)
    })
  } catch (error) {
    return ServiceResponse.error(error)
  }
}

export async function findCashClosuresByDate(params) {
  const db = new AppContext()
  try {
    return await db.withTransaction(null, async (t) => {
      const result = await financeService.findCashClosuresByDate(t, params || {})
      return ServiceResponse.success(result)
    })
  } catch (error) {
    return ServiceResponse.error(error)
  }
}

export async function openCashClosure(data) {
  const db = new AppContext()
  try {
    return await db.withTransaction(null, async (t) => {
      const result = await financeService.openCashClosure(t, data || {})
      return ServiceResponse.success(result)
    })
  } catch (error) {
    return ServiceResponse.error(error)
  }
}

export async function closeCashClosure(data) {
  const db = new AppContext()
  try {
    return await db.withTransaction(null, async (t) => {
      const result = await financeService.closeCashClosure(t, data || {})
      return ServiceResponse.success(result)
    })
  } catch (error) {
    return ServiceResponse.error(error)
  }
}
