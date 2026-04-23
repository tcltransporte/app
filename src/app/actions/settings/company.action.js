"use server"

import { AppContext } from "@/database"
import * as companyService from "@/app/services/settings/company.service"
import { ServiceResponse } from "@/libs/service"

export async function findOne() {
  const db = new AppContext()
  try {
    return await db.withTransaction(null, async (t) => {
      const result = await companyService.findOne(t)
      return ServiceResponse.success(result)
    })
  } catch (error) {
    return ServiceResponse.error(error)
  }
}

export async function updateCompany(data) {
  const db = new AppContext()
  try {
    return await db.withTransaction(null, async (t) => {
      const result = await companyService.updateCompany(t, data)
      return ServiceResponse.success(result)
    })
  } catch (error) {
    return ServiceResponse.error(error)
  }
}

export async function saveStatusConfig(data) {
  const db = new AppContext()
  try {
    return await db.withTransaction(null, async (t) => {
      const result = await companyService.saveStatusConfig(t, data)
      return ServiceResponse.success(result)
    })
  } catch (error) {
    return ServiceResponse.error(error)
  }
}

export async function findAllStatuses() {
  const db = new AppContext()
  try {
    return await db.withTransaction(null, async (t) => {
      const result = await companyService.findAllStatuses(t)
      return ServiceResponse.success(result)
    })
  } catch (error) {
    return ServiceResponse.error(error)
  }
}

export async function getStatusesConfig() {
  const db = new AppContext()
  try {
    return await db.withTransaction(null, async (t) => {
      const result = await companyService.getStatusesConfig(t)
      return ServiceResponse.success(result)
    })
  } catch (error) {
    return ServiceResponse.error(error)
  }
}

export async function destroyStatus(id) {
  const db = new AppContext()
  try {
    return await db.withTransaction(null, async (t) => {
      const result = await companyService.destroyStatus(t, id)
      return ServiceResponse.success(result)
    })
  } catch (error) {
    return ServiceResponse.error(error)
  }
}

export async function findAllowedTransitions(fromStatusIds, typeId) {
  const db = new AppContext()
  try {
    return await db.withTransaction(null, async (t) => {
      const result = await companyService.findAllowedTransitions(t, fromStatusIds, typeId)
      return ServiceResponse.success(result)
    })
  } catch (error) {
    return ServiceResponse.error(error)
  }
}

export async function findAllStatusTypes() {
  const db = new AppContext()
  try {
    return await db.withTransaction(null, async (t) => {
      const result = await companyService.findAllStatusTypes(t)
      return ServiceResponse.success(result)
    })
  } catch (error) {
    return ServiceResponse.error(error)
  }
}

export async function findAllStatusRelationships() {
  const db = new AppContext()
  try {
    return await db.withTransaction(null, async (t) => {
      const result = await companyService.findAllStatusRelationships(t)
      return ServiceResponse.success(result)
    })
  } catch (error) {
    return ServiceResponse.error(error)
  }
}

export async function findAllTypes() {
  const db = new AppContext()
  try {
    return await db.withTransaction(null, async (t) => {
      const result = await companyService.findAllTypes(t)
      return ServiceResponse.success(result)
    })
  } catch (error) {
    return ServiceResponse.error(error)
  }
}

export async function findAll(params = {}) {
  const db = new AppContext()
  try {
    return await db.withTransaction(null, async (t) => {
      const result = await companyService.findAll(t, params)
      return ServiceResponse.success(result)
    })
  } catch (error) {
    return ServiceResponse.error(error)
  }
}
