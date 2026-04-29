"use server"

import { AppContext } from "@/database"
import * as dfeRepositorioNFeRepository from "@/app/repositories/dfeRepositorioNFe.repository"
import * as dfeLoteDistService from "@/app/services/dfe-repository.service"
import { getSession } from "@/libs/session"
import { normalizeManifestation, ManifestationType } from "@/libs/dfeManifestationType"
import { ServiceResponse } from "@/libs/service"
import { generateDanfePdfBase64 } from "@/libs/danfe"

/** Lista distribuição via `DfeRepositorioNFe`; antes chama `syncDistributionsToRepositorio` (vínculo em `DFeLoteDist`). */
export async function findAll(options) {
  const session = await getSession()
  const db = new AppContext()
  try {
    return await db.withTransaction(null, async (t) => {
      const repositorio = await dfeLoteDistService.syncDistributionsToRepositorio(t)
      const result = await dfeRepositorioNFeRepository.findAllDistributionList(t, {
        ...options,
        companyId: session.company.id,
      })
      return ServiceResponse.success({
        ...result,
        repositorio,
      })
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

export async function getDanfePdfBase64(id) {
  const db = new AppContext()
  try {
    return await db.withTransaction(null, async (t) => {
      const xml = await dfeLoteDistService.getDecodedDoc(t, id)
      if (!xml) {
        throw new Error('XML não disponível para gerar DANFE.')
      }
      const pdfBase64 = await generateDanfePdfBase64({ xmls: [xml] })
      return ServiceResponse.success({ pdfBase64 })
    })
  } catch (error) {
    return ServiceResponse.error(error)
  }
}

export async function getDanfePdfBase64Batch(ids) {
  const db = new AppContext()
  try {
    return await db.withTransaction(null, async (t) => {
      if (!Array.isArray(ids) || ids.length === 0) {
        throw new Error('Informe ao menos um XML para gerar DANFE.')
      }

      const xmls = []
      for (const id of ids) {
        const xml = await dfeLoteDistService.getDecodedDoc(t, id)
        if (!xml) {
          throw new Error(`XML não disponível para gerar DANFE (id: ${id}).`)
        }
        xmls.push(xml)
      }

      const pdfBase64 = await generateDanfePdfBase64({ xmls })
      return ServiceResponse.success({ pdfBase64 })
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
/** Busca na SEFAZ e grava em DFeLoteDist (repositório é processado na action `findAll`). */
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
