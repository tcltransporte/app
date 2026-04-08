"use server"

import * as accountPlanRepository from "@/app/repositories/accountPlan.repository"
import { getSession } from "@/libs/session"

export async function findAll(transaction, params = {}) {
  const session = await getSession()

  const where = {
    ...params.where,
    companyId: session.company.id,
    isActive: true
  }

  const result = await accountPlanRepository.findAll(transaction, { ...params, where })
  return result
}
