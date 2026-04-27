"use server"

import { AppContext } from "@/database"
import * as dfeLoteDistService from "@/app/services/dfeLoteDist.service"
import { normalizeManifestation, ManifestationType } from "@/libs/dfeManifestationType"
import { ServiceResponse } from "@/libs/service"

export async function findAll(options) {
  const db = new AppContext()
  try {
    return await db.withTransaction(null, async (t) => {
      const result = await dfeLoteDistService.findAll(t, options)
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
      const result = await dfeLoteDistService.findOne(t, id)
      return ServiceResponse.success(result)
    })
  } catch (error) {
    return ServiceResponse.error(error)
  }
}

export async function getDecodedDoc(id) {
  const db = new AppContext()
  try {
    return await db.withTransaction(null, async (t) => {
      const result = await dfeLoteDistService.getDecodedDoc(t, id)
      return ServiceResponse.success(result)
    })
  } catch (error) {
    return ServiceResponse.error(error)
  }
}

export async function findManifestEvents(distributionId) {
  const db = new AppContext()
  try {
    return await db.withTransaction(null, async (t) => {
      const result = await dfeLoteDistService.findManifestEventsByDistributionId(t, distributionId)
      return ServiceResponse.success(result)
    })
  } catch (error) {
    return ServiceResponse.error(error)
  }
}
export async function sync() {
  const db = new AppContext()
  try {
    return await db.withTransaction(null, async (t) => {
      const result = await dfeLoteDistService.syncDistributions(t)
      return ServiceResponse.success(result)
    })
  } catch (error) {
    return ServiceResponse.error(error)
  }
}

export async function manifest(id, manifestation) {
  
  const resolved = normalizeManifestation(manifestation)

  if (!resolved) {
    return ServiceResponse.badRequest("INVALID_MANIFESTATION", `Informe um tipo válido: ${ManifestationType.Confirmation.code} (Confirmação), ${ManifestationType.Awareness.code} (Ciência), ${ManifestationType.UnknownOperation.code} (Desconhecimento) ou ${ManifestationType.OperationNotPerformed.code} (Operação não Realizada).`)
  }

  const db = new AppContext()
  
  try {
    
    return await db.withTransaction(null, async (t) => {
      
      const result = await dfeLoteDistService.manifest(t, id, resolved)
      return ServiceResponse.success(result)

    })
  } catch (error) {
    return ServiceResponse.error(error)
  }
}
