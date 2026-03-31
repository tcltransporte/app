"use server"

import { AppContext } from "@/database"
import * as solicitationService from "@/app/services/solicitation.service"
import * as documentService from "@/app/services/document.service"
import * as financeService from "@/app/services/finance.service"
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
        sortBy = 'date',
        sortOrder = 'DESC',
        columns = []
      } = options || {}

      const result = await solicitationService.findAll(t, { filters, range, sortBy, sortOrder, page: 1, limit: 10000 });

      // Convert to plain objects to ensure all properties are accessible by helpers
      const plainItems = (result.items || []).map(item =>
        typeof item.get === 'function' ? item.get({ plain: true }) : item
      );

      let exported;
      if (format === 'sheets') {
        exported = await handleGoogleSheetsExport({
          items: plainItems,
          columns,
          title: 'Exportação de Solicitações'
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
      const result = await solicitationService.findAll(t, options)
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
      const result = await solicitationService.findOne(t, id)
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
      const result = await solicitationService.create(t, data)
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
      const result = await solicitationService.update(t, id, data)
      return ServiceResponse.success(result)
    })
  } catch (error) {
    return ServiceResponse.error(error)
  }
}

export async function toStatus(id, statusId, description = null) {
  const db = new AppContext()
  try {
    return await db.withTransaction(null, async (t) => {
      const result = await solicitationService.toStatus(t, id, statusId, description)
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
      const result = await solicitationService.destroy(t, id)
      return ServiceResponse.success(result)
    })
  } catch (error) {
    return ServiceResponse.error(error)
  }
}

export async function findAllowedTransitions(fromStatusIds) {
  const db = new AppContext()
  try {
    return await db.withTransaction(null, async (t) => {
      const result = await solicitationService.findAllowedTransitions(t, fromStatusIds)
      return ServiceResponse.success(result)
    })
  } catch (error) {
    return ServiceResponse.error(error)
  }
}

export async function saveDocuments(solicitationId, documents = []) {
  const db = new AppContext()
  try {
    return await db.withTransaction(null, async (t) => {
      const solicitation = await solicitationService.findOneForDocuments(t, solicitationId)

      const newDocIds = []
      for (const doc of documents) {
        const payload = {
          documentModelId: doc.documentModelId,
          invoiceTypeId: doc.invoiceTypeId,
          invoiceNumber: doc.invoiceNumber || 0,
          invoiceDate: doc.invoiceDate ? new Date(doc.invoiceDate) : new Date(),
          invoiceValue: doc.invoiceValue || 0,
          items: doc.items,
          services: doc.services,
        }
        if (doc.id) {
          await documentService.update(t, doc.id, payload)
        } else {
          const result = await documentService.create(t, {
            ...payload,
            solicitationId,
            partnerId: solicitation.partnerId,
          })
          doc.id = result.id
          newDocIds.push(doc.id)
          await documentService.transmit(t, doc.id)
        }

        // Link document to solicitation
        await solicitationService.linkDocument(t, solicitationId, doc.id)
      }

      // Generate Finance if there are new documents
      if (newDocIds.length > 0) {
        const titleData = await documentService.prepareFinanceTitleData(t, newDocIds, solicitation.payments)
        const financeResult = await financeService.create(t, titleData)
        await documentService.linkFinanceTitle(t, newDocIds, financeResult.id)
      }

      return ServiceResponse.success({ message: 'Documentos salvos com sucesso!' })
    })
  } catch (error) {
    return ServiceResponse.error(error)
  }
}

export async function generateDocuments(solicitationIds = []) {
  const db = new AppContext()
  try {
    return await db.withTransaction(null, async (t) => {
      const result = await solicitationService.generateDocuments(t, solicitationIds)
      return ServiceResponse.success(result)
    })
  } catch (error) {
    return ServiceResponse.error(error)
  }
}
