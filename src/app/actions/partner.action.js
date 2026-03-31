"use server"

import { AppContext } from "@/database"
import * as partnerService from "@/app/services/partner.service"
import { ServiceResponse } from "@/libs/service"
import { handleGoogleSheetsExport, handleExcelExport } from "@/libs/export-helper"

export async function exportTable(options) {
  const db = new AppContext()
  try {
    return await db.withTransaction(null, async (t) => {
      const {
        format = 'excel',
        filters = {},
        range = {},
        sortBy = 'surname',
        sortOrder = 'ASC',
        columns = []
      } = options || {}

      const result = await partnerService.findAll(t, { filters, range, sortBy, sortOrder, page: 1, limit: 10000 })

      const plainItems = (result.items || []).map(item =>
        typeof item.get === 'function' ? item.get({ plain: true }) : item
      );

      let exported;
      if (format === 'sheets') {
        exported = await handleGoogleSheetsExport({
          items: plainItems,
          columns,
          title: 'Exportação de Parceiros'
        });
      } else {
        exported = await handleExcelExport({
          items: plainItems,
          columns
        });
      }

      return ServiceResponse.success(exported)
    })
  } catch (error) {
    return ServiceResponse.error(error)
  }
}

export async function findAll(options) {
  const db = new AppContext()
  try {
    return await db.withTransaction(null, async (t) => {
      const result = await partnerService.findAll(t, options)
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
      const result = await partnerService.findOne(t, id)
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
      const result = await partnerService.create(t, data)
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
      const result = await partnerService.update(t, id, data)
      return ServiceResponse.success(result)
    })
  } catch (error) {
    return ServiceResponse.error(error)
  }
}

export async function destroy(id) {
  const db = new AppContext()
  try {
    return await db.withTransaction(null, async (t) => {
      const result = await partnerService.destroy(t, id)
      return ServiceResponse.success(result)
    })
  } catch (error) {
    return ServiceResponse.error(error)
  }
}
