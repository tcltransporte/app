"use server"

import * as costCenterRepository from "@/app/repositories/costCenter.repository"

export async function findAll(transaction, params = {}) {
  const where = {
    ...params.where
  }

  const result = await costCenterRepository.findAll(transaction, { ...params, where })
  return result
}
