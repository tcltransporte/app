"use server"

import { AppContext } from "@/database"
import * as cteService from "@/app/services/cte.service"
import { ServiceResponse } from "@/libs/service"
import { getSession } from "@/libs/session"

export async function findAll(params) {
  const db = new AppContext()
  try {
    return await db.withTransaction(null, async (t) => {
      const result = await cteService.findAll(t, params || {})
      return ServiceResponse.success(result)
    })
  } catch (error) {
    return ServiceResponse.error(error)
  }
}

/**
 * @param {{ filename?: string, name?: string, xml: string }[]} items
 * @param {{ loadId?: number|string|null }} [options]
 */
export async function importFromXmls(items, options = {}) {
  try {
    const session = await getSession()
    const companyId = session?.company?.id
    if (companyId == null || companyId === '') {
      return ServiceResponse.badRequest('NO_COMPANY', 'Empresa não identificada na sessão.', {})
    }
    const companyBusinessId = session?.company?.companyBusiness?.id
    if (companyBusinessId == null || companyBusinessId === '') {
      return ServiceResponse.badRequest('NO_COMPANY_BUSINESS', 'Empresa matriz não identificada na sessão.', {})
    }
    const result = await cteService.importFromXmls({
      companyId,
      companyBusinessId,
      loadId: options?.loadId,
      items: Array.isArray(items) ? items : []
    })
    return ServiceResponse.success(result)
  } catch (error) {
    return ServiceResponse.error(error)
  }
}

/**
 * Atualiza em lote `Ctes.Origem` / `Ctes.Destino` a partir do XML (`cMunIni` / `cMunFim`) e da tabela `municipio`.
 * @param {{ batchSize?: number, maxRows?: number|null }} params
 */
export async function backfillOrigemDestinoFromXml(params = {}) {
  try {
    const session = await getSession()
    const companyId = session?.company?.id
    if (companyId == null || companyId === '') {
      return ServiceResponse.badRequest('NO_COMPANY', 'Empresa não identificada na sessão.', {})
    }
    const result = await cteService.backfillOrigemDestinoFromXml({
      companyId,
      batchSize: params?.batchSize,
      maxRows: params?.maxRows
    })
    return ServiceResponse.success(result)
  } catch (error) {
    return ServiceResponse.error(error)
  }
}
