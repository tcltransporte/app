"use server"

import * as bankRepository from "@/app/repositories/bank.repository"

export async function findAll(transaction, params = {}) {
  const result = await bankRepository.findAll(transaction, params)
  return result
}
