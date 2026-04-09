"use server"

import { AppContext } from "@/database"
import * as paymentService from "@/app/services/payment.service"
import { ServiceResponse } from "@/libs/service"

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
