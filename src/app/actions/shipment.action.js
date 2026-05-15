"use server"

import { AppContext } from "@/database"
import * as shipmentService from "@/app/services/shipment.service"
import { ServiceResponse } from "@/libs/service"

export async function findAll(params) {
  const db = new AppContext()
  try {
    return await db.withTransaction(null, async (t) => {
      const result = await shipmentService.findAll(t, params || {})
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
      const result = await shipmentService.findOne(t, id)
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
      const result = await shipmentService.create(t, data || {})
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
      const result = await shipmentService.update(t, id, data || {})
      return ServiceResponse.success(result)
    })
  } catch (error) {
    return ServiceResponse.error(error)
  }
}

export async function getFormLookups() {
  const db = new AppContext()
  try {
    return await db.withTransaction(null, async (t) => {
      const result = await shipmentService.getFormLookups(t)
      return ServiceResponse.success(result)
    })
  } catch (error) {
    return ServiceResponse.error(error)
  }
}

export async function searchNcm(search) {
  const db = new AppContext()
  try {
    return await db.withTransaction(null, async (t) => {
      const result = await shipmentService.searchNcm(t, search)
      return ServiceResponse.success(result)
    })
  } catch (error) {
    return ServiceResponse.error(error)
  }
}

export async function findNcmById(id) {
  const db = new AppContext()
  try {
    return await db.withTransaction(null, async (t) => {
      const result = await shipmentService.findNcmById(t, id)
      return ServiceResponse.success(result)
    })
  } catch (error) {
    return ServiceResponse.error(error)
  }
}
