"use server"

import * as dfeLoteDistRepository from "@/app/repositories/dfeLoteDist.repository"
import * as dfeRepositorioNFeRepository from "@/app/repositories/dfeRepositorioNFe.repository"
import * as manifestEventRepository from "@/app/repositories/manifestEvent.repository"
import { getSession } from "@/libs/session"
import { normalizeManifestation } from "@/libs/dfeManifestationType"
import zlib from 'zlib'

function digitsOnly(value) {
  return String(value ?? "").replace(/\D/g, "")
}

/**
 * NSU vindo do docZip / coluna / BIGINT no banco: só dígitos, forma canônica (sem zeros à esquerda)
 * para bater com `DFeLoteDist.Nsu` e evitar duplicata "00123" vs 123.
 */
function normalizeNsuForDist(raw) {
  if (raw == null || raw === "") return null
  const s = String(raw).replace(/\s/g, "")
  if (!/^\d+$/.test(s)) return null
  try {
    return String(BigInt(s))
  } catch {
    return null
  }
}

/** `ultNSU` no `distDFeInt` (15 dígitos, zeros à esquerda). */
function formatUltNSU15(nsuRaw) {
  const canon = normalizeNsuForDist(nsuRaw) ?? "0"
  if (canon.length > 15) return canon.slice(-15)
  return canon.padStart(15, "0")
}

/** nNF na chave de 44 dígitos: posições 26–34 (1-based), 9 dígitos. */
function numeroDocFromChNFe44Digits(chDigits44) {
  const d = String(chDigits44 ?? "").replace(/\D/g, "").slice(0, 44)
  if (d.length < 34) return null
  const slice9 = d.slice(25, 34)
  if (!/^\d{9}$/.test(slice9)) return null
  const n = parseInt(slice9, 10)
  return Number.isFinite(n) ? n : null
}

export async function findOne(transaction, id) {
  const session = await getSession()
  const item = await dfeLoteDistRepository.findOne(transaction, {
    where: { id, companyId: session.company.id }
  })

  if (!item)
    throw { code: "DISTRIBUTION_NOT_FOUND", message: "Distribuição não encontrada!" }

  return item
}

export async function getDecodedDoc(transaction, id) {
  const item = await findOne(transaction, id)
  if (!item || !item.docXml) return null

  return item.docXml
}

/**
 * @param {import('sequelize').Transaction} transaction
 * @param {number|string} distributionId
 */
export async function findManifestEventsByDistributionId(transaction, distributionId) {
  const record = await findOne(transaction, distributionId)
  const repoId = record.idDfeRepositorioNFe
  if (!repoId) {
    throw { code: "REPOSITORIO_NOT_LINKED", message: "Lote sem vínculo ao repositório. Pesquise na grade para processar." }
  }
  return manifestEventRepository.findAllByDfeRepositorioNFeId(transaction, repoId)
}

function parseDistributionXmlResponse(xmlResponse) {
  const cStatMatch = xmlResponse.match(/<cStat>([^<]+)<\/cStat>/)
  const xMotivoMatch = xmlResponse.match(/<xMotivo>([^<]+)<\/xMotivo>/)
  const cStat = cStatMatch ? cStatMatch[1] : null
  const xMotivo = xMotivoMatch ? xMotivoMatch[1] : "Erro desconhecido na distribuição"

  if (cStat && cStat !== "138") {
    throw new Error(xMotivo)
  }

  const docZipRegex = /<docZip\b([^>]*)>([\s\S]*?)<\/docZip>/g
  const attrRegex = /(\w+)="([^"]*)"/g
  let match

  const extractedDocs = []
  const schemaNames = new Set()

  while ((match = docZipRegex.exec(xmlResponse)) !== null) {
    const attrs = match[1] || ""
    const base64Content = (match[2] || "").trim()
    let nsu = null
    let schemaName = null
    let attrMatch

    while ((attrMatch = attrRegex.exec(attrs)) !== null) {
      const key = String(attrMatch[1] || "").toLowerCase()
      const value = attrMatch[2]
      if (key === "nsu") nsu = value
      if (key === "schema") schemaName = value
    }

    if (!schemaName || !base64Content) continue

    extractedDocs.push({ nsu, schemaName, base64Content })
    schemaNames.add(schemaName)
  }

  return {
    extractedDocs,
    uniqueSchemaNames: Array.from(schemaNames),
  }
}

/** @returns {{ chNFeDigits: string, numeroDoc: number, emitente: string, destinatario: string, dhEmi: Date, cnpj: string|null, ie: string|null, valorNf: number|null }} */
function extractRepositorioPayloadFromDocXml(docXml) {
  const chRaw = dfeLoteDistRepository.extractChNFeFromDocXml(docXml)
  const chNFeDigits = digitsOnly(chRaw).slice(0, 44)

  let numeroDoc = numeroDocFromChNFe44Digits(chNFeDigits) ?? 0
  if (numeroDoc === 0) {
    const nNfMatch = docXml.match(/<nNF>(\d+)<\/nNF>/i)
    if (nNfMatch) numeroDoc = parseInt(nNfMatch[1], 10) || 0
  }

  let cnpj = null
  let ie = null
  let valorNf = null

  const resNFeBlock = docXml.match(/<resNFe\b[^>]*>([\s\S]*?)<\/resNFe>/i)
  if (resNFeBlock) {
    const inner = resNFeBlock[1]
    const cnpjRaw = inner.match(/<CNPJ>([^<]+)<\/CNPJ>/i)?.[1]
    const cnpjDigits = cnpjRaw ? digitsOnly(cnpjRaw).slice(0, 14) : ''
    if (cnpjDigits) cnpj = cnpjDigits
    const ieRaw = inner.match(/<IE>([^<]*)<\/IE>/i)?.[1]
    if (ieRaw != null && String(ieRaw).trim() !== '') ie = String(ieRaw).trim().slice(0, 20)
    const vRaw = inner.match(/<vNF>([^<]+)<\/vNF>/i)?.[1]
    if (vRaw != null && String(vRaw).trim() !== '') {
      const n = Number(String(vRaw).trim().replace(/\s/g, '').replace(',', '.'))
      if (Number.isFinite(n)) valorNf = n
    }
  } else {
    const emitBlock = docXml.match(/<emit[^>]*>([\s\S]*?)<\/emit>/i)
    if (emitBlock) {
      const cnpjRaw = emitBlock[1].match(/<CNPJ>([^<]+)<\/CNPJ>/i)?.[1]
      const cnpjDigits = cnpjRaw ? digitsOnly(cnpjRaw).slice(0, 14) : ''
      if (cnpjDigits) cnpj = cnpjDigits
      const ieRaw = emitBlock[1].match(/<IE>([^<]*)<\/IE>/i)?.[1]
      if (ieRaw != null && String(ieRaw).trim() !== '') ie = String(ieRaw).trim().slice(0, 20)
    }
    const vTot = docXml.match(/<ICMSTot>[\s\S]*?<vNF>([^<]+)<\/vNF>/i)?.[1]
    if (vTot != null && String(vTot).trim() !== '') {
      const n = Number(String(vTot).trim().replace(/\s/g, '').replace(',', '.'))
      if (Number.isFinite(n)) valorNf = n
    }
  }

  let emitente = ''
  const emitBlock = docXml.match(/<emit[^>]*>([\s\S]*?)<\/emit>/i)
  if (emitBlock) {
    const xNome = emitBlock[1].match(/<xNome>([^<]*)<\/xNome>/i)
    const cnpj = emitBlock[1].match(/<CNPJ>([^<]*)<\/CNPJ>/i)
    emitente = (xNome?.[1] || cnpj?.[1] || '').trim().slice(0, 100)
  }
  if (!emitente) {
    const iEmit = docXml.match(/<IEmit[^>]*>([\s\S]*?)<\/IEmit>/i)
    if (iEmit) {
      const xNome = iEmit[1].match(/<xNome>([^<]*)<\/xNome>/i)
      const cnpj = iEmit[1].match(/<CNPJ>([^<]*)<\/CNPJ>/i)
      emitente = (xNome?.[1] || cnpj?.[1] || '').trim().slice(0, 100)
    }
  }
  if (!emitente) {
    const firstNome = docXml.match(/<xNome>([^<]{1,100})<\/xNome>/i)
    emitente = (firstNome?.[1] || '—').trim().slice(0, 100)
  }

  let destinatario = ''
  const destBlock = docXml.match(/<dest[^>]*>([\s\S]*?)<\/dest>/i)
  if (destBlock) {
    const xNome = destBlock[1].match(/<xNome>([^<]*)<\/xNome>/i)
    const doc = destBlock[1].match(/<CNPJ>([^<]*)<\/CNPJ>/i) || destBlock[1].match(/<CPF>([^<]*)<\/CPF>/i)
    destinatario = (xNome?.[1] || doc?.[1] || '').trim().slice(0, 100)
  }
  if (!destinatario) {
    const iDest = docXml.match(/<IDest[^>]*>([\s\S]*?)<\/IDest>/i)
    if (iDest) {
      const xNome = iDest[1].match(/<xNome>([^<]*)<\/xNome>/i)
      const doc = iDest[1].match(/<CNPJ>([^<]*)<\/CNPJ>/i) || iDest[1].match(/<CPF>([^<]*)<\/CPF>/i)
      destinatario = (xNome?.[1] || doc?.[1] || '').trim().slice(0, 100)
    }
  }
  if (!destinatario) destinatario = '—'

  const dhEmiMatch = docXml.match(/<dhEmi>([^<]+)<\/dhEmi>/i)
  let dhEmi = new Date()
  if (dhEmiMatch?.[1]) {
    const parsed = new Date(dhEmiMatch[1])
    if (!Number.isNaN(parsed.getTime())) dhEmi = parsed
  }

  return {
    chNFeDigits,
    numeroDoc,
    emitente: emitente || '—',
    destinatario,
    dhEmi,
    cnpj,
    ie,
    valorNf,
  }
}

/**
 * Se já existir `DfeRepositorioNFe` com a mesma chNFe (44 dígitos) na empresa, atualiza esse registro e o lote;
 * caso contrário cria um novo e grava `DFeLoteDist.IdDfeRepositorioNFe`.
 * Vários lotes podem apontar para o mesmo repositório (ex.: resumo + proc); não zera FK dos demais.
 * `repoIdByCh44` (opcional): cache do mesmo `syncDistributionsToRepositorio` para mesma chNFe criada/atualizada
 * nesta transação ainda não visível em um segundo `SELECT` (ex.: isolamento com snapshot).
 * @param {import('sequelize').Transaction} transaction
 * @param {number} idStatus de DfeRepositorioStatus (pré-resolvido)
 * @param {Map<string, number>|null} [repoIdByCh44]
 * @returns {Promise<{ linked: boolean }>}
 */
async function linkOneLoteRowToRepositorio(transaction, session, lote, idStatus, repoIdByCh44 = null) {
  const docXml = lote?.docXml
  if (!lote?.id || !docXml) return { linked: false }
  if (lote.idDfeRepositorioNFe) return { linked: false }

  const payload = extractRepositorioPayloadFromDocXml(docXml)
  const ch = digitsOnly(dfeLoteDistRepository.extractChNFeFromDocXml(docXml)).slice(0, 44)
  if (!ch || ch.length < 44) return { linked: false }

  const chKey = ch.slice(0, 44)
  const chPadded = dfeRepositorioNFeRepository.chNFeAsNchar44(ch)

  let existingRepo = null
  const cachedId = repoIdByCh44?.get(chKey)
  if (cachedId != null && !Number.isNaN(Number(cachedId))) {
    existingRepo = { id: Number(cachedId) }
  }
  if (!existingRepo) {
    existingRepo = await dfeRepositorioNFeRepository.findOneByCompanyAndChNFe(transaction, {
      companyId: session.company.id,
      chNFeDigits: ch,
    })
  }

  if (existingRepo) {
    await dfeRepositorioNFeRepository.updateById(transaction, {
      id: existingRepo.id,
      data: {
        idLoteDistDFe: lote.id,
        chNFe: chPadded,
        numeroDoc: payload.numeroDoc,
        emitente: payload.emitente,
        destinatario: payload.destinatario,
        dhEmi: payload.dhEmi,
        cnpj: payload.cnpj,
        ie: payload.ie,
        valorNf: payload.valorNf,
      },
    })
    const n = await dfeLoteDistRepository.updateById(transaction, {
      id: lote.id,
      data: { idDfeRepositorioNFe: existingRepo.id },
    })
    if (n !== 1) {
      throw new Error(`Esperado gravar IdDfeRepositorioNFe no lote ${lote.id}; linhas afetadas: ${n}.`)
    }
    if (repoIdByCh44) repoIdByCh44.set(chKey, Number(existingRepo.id))
    return { linked: true }
  }

  const repo = await dfeRepositorioNFeRepository.create(transaction, {
    idLoteDistDFe: lote.id,
    numeroDoc: payload.numeroDoc,
    chNFe: chPadded,
    emitente: payload.emitente,
    destinatario: payload.destinatario,
    dhEmi: payload.dhEmi,
    cnpj: payload.cnpj,
    ie: payload.ie,
    valorNf: payload.valorNf,
    idStatus,
    isExportada: false,
    companyId: session.company.id,
  })

  const n = await dfeLoteDistRepository.updateById(transaction, {
    id: lote.id,
    data: { idDfeRepositorioNFe: repo.id },
  })
  if (n !== 1) {
    throw new Error(`Esperado gravar IdDfeRepositorioNFe no lote ${lote.id}; linhas afetadas: ${n}.`)
  }
  if (repoIdByCh44) repoIdByCh44.set(chKey, Number(repo.id))
  return { linked: true }
}

async function upsertSyncedDistributionDocs(transaction, { db, session, extractedDocs, uniqueSchemaNames }) {
  const existingSchemas = await db.findAllSchemas(transaction, uniqueSchemaNames)
  const schemaMap = new Map(existingSchemas.map(s => [s.schema, s.id]))

  const missingSchemaNames = uniqueSchemaNames.filter(name => !schemaMap.has(name))
  if (missingSchemaNames.length > 0) {
    const createdSchemas = await db.bulkCreateSchemas(transaction, missingSchemaNames.map(name => ({ schema: name, descricao: name })))
    createdSchemas.forEach(s => schemaMap.set(s.schema, s.id))
  }

  const companyId = session.company.id
  const prepared = extractedDocs
    .map((doc) => {
      const buffer = Buffer.from(doc.base64Content, "base64")
      const decompressed = zlib.gunzipSync(buffer).toString("utf8")
      const nsuNorm = normalizeNsuForDist(doc.nsu)
      const idSchema = schemaMap.get(doc.schemaName)
      return { doc, decompressed, nsuNorm, idSchema }
    })
    .filter((r) => r.nsuNorm && r.idSchema != null)

  if (prepared.length === 0) return { count: 0 }

  const nsuKeys = [...new Set(prepared.map((r) => r.nsuNorm))]
  const existingRows = await dfeLoteDistRepository.findAllByCompanyAndNsus(transaction, {
    companyId,
    nsus: nsuKeys,
  })

  /** Um `Id` por NSU canônico (menor id se houver duplicata legada). */
  const byNsu = new Map()
  for (const row of existingRows) {
    const key = normalizeNsuForDist(row.nsu)
    if (!key) continue
    const prev = byNsu.get(key)
    if (!prev || Number(row.id) < Number(prev.id)) byNsu.set(key, row)
  }

  const userId = session?.user?.id
  let count = 0

  for (const r of prepared) {
    const payload = {
      nsu: r.nsuNorm,
      idSchema: r.idSchema,
      docXml: r.decompressed,
      companyId,
      data: new Date(),
      isUnPack: true,
    }

    const hit = byNsu.get(r.nsuNorm)
    if (hit) {
      await db.updateById(transaction, { id: hit.id, data: payload })
      count += 1
    } else {
      if (!userId) {
        throw new Error("Usuário da sessão obrigatório para gravar novo DFeLoteDist na sincronização.")
      }
      const created = await db.create(transaction, {
        ...payload,
        userId,
        idDfeRepositorioNFe: null,
      })
      byNsu.set(r.nsuNorm, { id: created.id, nsu: r.nsuNorm })
      count += 1
    }
  }

  return { count }
}

async function resolveSchemaMap(transaction, uniqueSchemaNames) {
  const existingSchemas = await dfeLoteDistRepository.findAllSchemas(transaction, uniqueSchemaNames)
  const schemaMap = new Map(existingSchemas.map(s => [s.schema, s.id]))

  const missingSchemaNames = uniqueSchemaNames.filter(name => !schemaMap.has(name))
  if (missingSchemaNames.length > 0) {
    const createdSchemas = await dfeLoteDistRepository.bulkCreateSchemas(
      transaction,
      missingSchemaNames.map(name => ({ schema: name, descricao: name }))
    )
    createdSchemas.forEach(s => schemaMap.set(s.schema, s.id))
  }

  return schemaMap
  
}

export async function syncDistributions(transaction) {

  const session = await getSession()
  const db = dfeLoteDistRepository

  const lastNsu = await db.findLastNSU(transaction, {
    where: { companyId: session.company.id, idDFeLoteDistOrigem: null },
  })

  // Parse certificate if string
  let certificate = session.company.certificate
  if (typeof certificate === 'string') {
    try {
      certificate = JSON.parse(certificate)
    } catch (e) {
      certificate = {}
    }
  }

  const tpAmb = escapeXmlText(process.env.NFE_TP_AMB ?? "1")
  const cUFAutor = escapeXmlText(process.env.NFE_CUF_AUTOR ?? "52")
  const cnpjEmit = escapeXmlText(digitsOnly(session.company.cnpj))
  const ultNSU = escapeXmlText(formatUltNSU15(lastNsu))

  const body =
    `<distDFeInt versao="1.00" xmlns="http://www.portalfiscal.inf.br/nfe">` +
    `<tpAmb>${tpAmb}</tpAmb>` +
    `<cUFAutor>${cUFAutor}</cUFAutor>` +
    `<CNPJ>${cnpjEmit}</CNPJ>` +
    `<distNSU><ultNSU>${ultNSU}</ultNSU></distNSU>` +
    `</distDFeInt>`

  const response = await fetch(`${process.env.SPED_DFE_API}/dfe/nfe/distribuicao-dfe`, {
    method: "POST",
    headers: {
      "content-type": "application/xml",
      "x-cert-base64": certificate.base64 || "",
      "x-cert-password": certificate.password || "",
    },
    body
  })

  if (!response.ok) {
    throw new Error(`Erro ao conectar com o serviço de distribuição: ${response.statusText}`)
  }

  const xmlResponse = await response.text()

  const { extractedDocs, uniqueSchemaNames } = parseDistributionXmlResponse(xmlResponse)

  if (extractedDocs.length === 0) return { count: 0 }

  return upsertSyncedDistributionDocs(transaction, {
    db,
    session,
    extractedDocs,
    uniqueSchemaNames,
  })
}

/**
 * Vincula ao repositório linhas `DFeLoteDist` com `IdDfeRepositorioNFe` NULL (schemas/XML habituais **ou** já existe repositório com a mesma chNFe extraída do `DocXml`).
 * A chNFe (44 dígitos) define se cria `DfeRepositorioNFe` ou apenas atualiza o registro existente e aponta `IdLoteDistDFe`.
 * Sem chNFe válida no XML, o lote permanece pendente.
 * @param {import('sequelize').Transaction} transaction
 * @returns {Promise<{ count: number, scanned: number }>}
 */
export async function syncDistributionsToRepositorio(transaction) {
  const session = await getSession()
  const idStatus = await dfeRepositorioNFeRepository.findDefaultRepositorioStatusId(transaction)

  const pending = await dfeLoteDistRepository.findAllPendingForRepositorioLink(transaction, {
    companyId: session.company.id,
  })

  /** Chave 44 dígitos → Id do repositório já criado/atualizado nesta execução (evita 2× create na mesma chNFe). */
  const repoIdByCh44 = new Map()
  let linked = 0
  for (const lote of pending) {
    const { linked: ok } = await linkOneLoteRowToRepositorio(transaction, session, lote, idStatus, repoIdByCh44)
    if (ok) linked += 1
  }

  return { count: linked, scanned: pending.length }
}

/**
 * @param {import('sequelize').Transaction} transaction
 * @param {number|string} id
 */
export async function syncDistributionsById(transaction, manifestedLoteId) {
  const session = await getSession()
  const current = await findOne(transaction, manifestedLoteId)

  const chNFeDigits = digitsOnly(dfeLoteDistRepository.extractChNFeFromDocXml(current.docXml))
  if (!chNFeDigits) {
    throw new Error("Chave da NF-e (chNFe) não encontrada no documento.")
  }

  const cnpj = digitsOnly(session.company.cnpj)
  if (!cnpj) {
    throw new Error("CNPJ da empresa não encontrado na sessão.")
  }

  const tpAmb = process.env.NFE_TP_AMB ?? "1"
  const cUFAutor = process.env.NFE_CUF_AUTOR ?? "52"

  // Parse certificate if string
  let certificate = session.company.certificate
  if (typeof certificate === 'string') {
    try {
      certificate = JSON.parse(certificate)
    } catch (e) {
      certificate = {}
    }
  }

  const body = `<distDFeInt xmlns="http://www.portalfiscal.inf.br/nfe" versao="1.01">
<tpAmb>${escapeXmlText(tpAmb)}</tpAmb>
<cUFAutor>${escapeXmlText(cUFAutor)}</cUFAutor>
<CNPJ>${escapeXmlText(cnpj)}</CNPJ>
<consChNFe>
<chNFe>${escapeXmlText(chNFeDigits)}</chNFe>
</consChNFe>
</distDFeInt>`

  const response = await fetch(`${process.env.SPED_DFE_API}/dfe/nfe/distribuicao-dfe`, {
    method: "POST",
    headers: {
      "content-type": "application/xml",
      "x-cert-base64": certificate.base64 || "",
      "x-cert-password": certificate.password || "",
    },
    body
  })

  if (!response.ok) {
    throw new Error(`Erro ao conectar com o serviço de distribuição: ${response.statusText}`)
  }

  const xmlResponse = await response.text()
  const { extractedDocs, uniqueSchemaNames } = parseDistributionXmlResponse(xmlResponse)
  if (extractedDocs.length === 0) return { count: 0 }
  const schemaMap = await resolveSchemaMap(transaction, uniqueSchemaNames)

  const normalizedCurrentChNFe = digitsOnly(chNFeDigits)
  const parsedDocs = extractedDocs.map(doc => {
    const buffer = Buffer.from(doc.base64Content, "base64")
    const decompressed = zlib.gunzipSync(buffer).toString("utf8")
    const parsedChNFe = digitsOnly(dfeLoteDistRepository.extractChNFeFromDocXml(decompressed))

    return {
      ...doc,
      decompressed,
      parsedChNFe
    }
  })

  const selectedDoc =
    parsedDocs.find(d => d.parsedChNFe && d.parsedChNFe === normalizedCurrentChNFe)
    || parsedDocs[0]

  const returnedNsu = normalizeNsuForDist(selectedDoc.nsu ?? current.nsu)
  if (!returnedNsu) {
    throw new Error("NSU não encontrado na resposta da distribuição (docZip / lote atual).")
  }

  const idSchema = schemaMap.get(selectedDoc.schemaName) ?? current.idSchema
  if (idSchema == null) {
    throw new Error(`Schema não resolvido para o documento: ${selectedDoc.schemaName ?? ""}`)
  }

  const payloadCommon = {
    nsu: returnedNsu,
    idSchema,
    docXml: selectedDoc.decompressed,
    data: new Date(),
    isUnPack: true,
  }

  const nsuForWhere = (() => {
    try {
      return BigInt(returnedNsu)
    } catch {
      return returnedNsu
    }
  })()

  const byNsu = await dfeLoteDistRepository.findOne(transaction, {
    where: { companyId: session.company.id, nsu: nsuForWhere },
  })

  let targetRow = null

  if (byNsu) {
    if (Number(byNsu.id) === Number(manifestedLoteId)) {
      await dfeLoteDistRepository.updateById(transaction, {
        id: byNsu.id,
        data: { ...payloadCommon, idDFeLoteDistOrigem: null },
      })
    } else {
      await dfeLoteDistRepository.updateById(transaction, {
        id: byNsu.id,
        data: { ...payloadCommon, idDFeLoteDistOrigem: manifestedLoteId },
      })
    }
    targetRow = await dfeLoteDistRepository.findOne(transaction, {
      where: { id: byNsu.id, companyId: session.company.id },
    })
  } else {
    const userId = session?.user?.id
    if (!userId) {
      throw new Error("Usuário da sessão obrigatório para gravar novo DFeLoteDist após manifestação.")
    }
    targetRow = await dfeLoteDistRepository.create(transaction, {
      ...payloadCommon,
      userId,
      idDFeLoteDistOrigem: manifestedLoteId,
      companyId: session.company.id,
      idDfeRepositorioNFe: null,
    })
  }

  if (targetRow && !targetRow.idDfeRepositorioNFe) {
    const idStatus = await dfeRepositorioNFeRepository.findDefaultRepositorioStatusId(transaction)
    await linkOneLoteRowToRepositorio(transaction, session, targetRow, idStatus)
  }

  return { count: 1 }
}

export async function createManifestEvent(transaction, {
  dfeRepositorioNFeId,
  loteId,
  manifestationCode,
  success,
  message = null,
}) {
  const session = await getSession()

  const row = await manifestEventRepository.create(transaction, {
    dfeRepositorioNFeId,
    /** Bancos legados: ManifestEvent.DistributionId = DFeLoteDist.Id (até o alter remover a coluna). */
    distributionId: loteId,
    manifestationCode,
    success,
    message,
    occurredAt: new Date(),
    userId: session?.user?.id || null,
  })

  await dfeRepositorioNFeRepository.updateById(transaction, {
    id: dfeRepositorioNFeId,
    data: { lastManifestEventId: row.id },
  })

  return row
}

function escapeXmlText(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

export async function manifest(transaction, id, manifestation) {
  const session = await getSession()

  const resolved = normalizeManifestation(manifestation)
  if (!resolved) {
    throw new Error("Tipo de manifestação inválido.")
  }
  const { code, label } = resolved

  const record = await findOne(transaction, id)
  if (!record) throw new Error("Registro não encontrado.")

  const repoId = record.idDfeRepositorioNFe
  if (!repoId) {
    throw new Error("Distribuição sem repositório vinculado. Atualize a lista (Pesquisar) e tente novamente.")
  }

  const chNFe = dfeLoteDistRepository.extractChNFeFromDocXml(record.docXml)
  if (!chNFe) {
    throw new Error("Chave da NF-e (chNFe) não encontrada no documento.")
  }

  let certificate = session.company.certificate
  if (typeof certificate === "string") {
    try {
      certificate = JSON.parse(certificate)
    } catch (e) {
      certificate = {}
    }
  }

  const body = `
<Manifestation>
  <documento>${session.company.cnpj}</documento>
  <code>${escapeXmlText(code)}</code>
  <chNFE>${escapeXmlText(chNFe)}</chNFE>
</Manifestation>
`.trim()

  const response = await fetch(`${process.env.SPED_DFE_API}/dfe/nfe/manifestation`, {
    method: "POST",
    headers: {
      "content-type": "application/xml",
      "x-cert-base64": certificate.base64 || "",
      "x-cert-password": certificate.password || "",
    },
    body,
  })

  if (!response.ok) {
    throw new Error(`Erro ao enviar manifestação: ${response.statusText}`)
  }

  const xmlResponse = await response.text()

  const cStatMatch = xmlResponse.match(/<cStat>([^<]+)<\/cStat>/)
  const xMotivoMatch = xmlResponse.match(/<xMotivo>([^<]+)<\/xMotivo>/)
  const cStat = cStatMatch ? cStatMatch[1] : null
  const xMotivo = xMotivoMatch ? xMotivoMatch[1] : "Resposta recebida sem motivo detalhado."

  if (cStat && !["128", "135", "136"].includes(cStat)) {
    throw new Error(xMotivo)
  }

  const result = { cStat, xMotivo, code, chNFe, label }
  const operations = ['MANIFEST']

  await createManifestEvent(transaction, {
    dfeRepositorioNFeId: repoId,
    loteId: id,
    manifestationCode: code,
    success: true,
    message: xMotivo,
  })

  await syncDistributionsById(transaction, id)
  operations.push('SYNC_DISTRIBUTIONS_BY_ID')

  return {
    ...result,
    operations,
  }

}
