"use server"

import { AppContext } from "@/database"
import * as paymentService from "@/app/services/payment.service"
import { ServiceResponse } from "@/libs/service"

import * as financeService from "@/app/services/finance.service"

export async function executePayment(data) {
  const db = new AppContext()
  try {
    return await db.withTransaction(null, async (t) => {
      const result = await paymentService.executePayment(t, data)
      return ServiceResponse.success(result)
    })
  } catch (error) {
    return ServiceResponse.error(error)
  }
}

export async function getPaymentFormData() {
  const db = new AppContext()
  try {
    return await db.withTransaction(null, async (t) => {
      const result = await paymentService.getPaymentFormData(t)
      return ServiceResponse.success(result)
    })
  } catch (error) {
    return ServiceResponse.error(error)
  }
}

export async function fetchHistory(ids) {
  const db = new AppContext()
  try {
    return await db.withTransaction(null, async (t) => {
      // 1. Fetch all entries to calculate total and show in list
      const allEntriesResult = await financeService.findAllEntries(t, {
        where: { id: ids },
        limit: ids.length
      })

      const entries = allEntriesResult.items || allEntriesResult.rows || []
      const totalValue = entries.reduce((acc, curr) => acc + (Number(curr.installmentValue) || 0), 0)

      // 2. Fetch history for the first ID (to check if it's already paid)
      const firstId = ids[0]
      const paymentHistory = await financeService.findEntryPaymentHistory(t, firstId)

      let response = {
        payment: paymentHistory?.payment || null,
        batchMode: ids.length > 1,
        selectedEntries: entries,
        totalValue: totalValue
      }

      // 3. If no payment is found, it's a new checkout, so we need form data (methods)
      if (!response.payment) {
        const formData = await paymentService.getPaymentFormData(t)
        response.methods = formData.methods
      }


      return ServiceResponse.success(response)
    })
  } catch (error) {
    return ServiceResponse.error(error)
  }
}

