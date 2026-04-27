"use server"

import Sequelize, { Op } from 'sequelize'
import * as dfeLoteDistRepository from "@/app/repositories/dfeLoteDist.repository"
import * as manifestEventRepository from "@/app/repositories/manifestEvent.repository"
import { getSession } from "@/libs/session"
import { normalizeManifestation, ManifestationType } from "@/libs/dfeManifestationType"
import zlib from 'zlib'

/** Expressão SQL Server: data de emissão extraída do DocXml (resNFe, NFe, nfeProc). */
function docXmlDhEmiCoalesceSql() {
  const nsPrefix = 'declare namespace ns="http://www.portalfiscal.inf.br/nfe";'
  const resXPath = `DocXml.value('${nsPrefix} (/ns:resNFe/ns:dhEmi/text())[1]', 'datetimeoffset')`
  const nfeXPath = `DocXml.value('${nsPrefix} (/ns:NFe/ns:infNFe/ns:ide/ns:dhEmi/text())[1]', 'datetimeoffset')`
  const nfeProcXPath = `DocXml.value('${nsPrefix} (/ns:nfeProc/ns:NFe/ns:infNFe/ns:ide/ns:dhEmi/text())[1]', 'datetimeoffset')`
  return `COALESCE(${resXPath}, ${nfeXPath}, ${nfeProcXPath})`
}

const DFE_LOTE_DIST_SORTABLE_DB = new Set(['id', 'data', 'nsu', 'idSchema', 'userId', 'isUnPack', 'companyId'])

/** IdSchema da NF-e processada (procNFe): quando existir para uma chNFe, oculta o resumo (outro IdSchema) na listagem. */
const DFE_LOTE_DIST_FULL_NFE_SCHEMA_ID = 3

/**
 * SQL Server: chNFe extraída do XML (resNFe, protNFe, tag chNFe, Id NFe…).
 * @param {string} docXmlRef coluna qualificada, ex. `[dfeLoteDist].[DocXml]`
 */
function docXmlChNFeCoalesceSql(docXmlRef) {
  const ns = 'declare namespace ns="http://www.portalfiscal.inf.br/nfe";'
  const resCh = `${docXmlRef}.value('${ns} (/ns:resNFe/ns:chNFe/text())[1]', 'varchar(44)')`
  const protCh = `${docXmlRef}.value('${ns} (/ns:nfeProc/ns:protNFe/ns:infProt/ns:chNFe/text())[1]', 'varchar(44)')`
  const nfeCh = `${docXmlRef}.value('${ns} (/ns:NFe/ns:infNFe/ns:chNFe/text())[1]', 'varchar(44)')`
  const idAttr = `${docXmlRef}.value('${ns} (/ns:NFe/ns:infNFe/@Id)[1]', 'varchar(50)')`
  const fromId = `CASE WHEN UPPER(LEFT(${idAttr}, 3)) = N'NFE' AND LEN(${idAttr}) >= 47 THEN SUBSTRING(${idAttr}, 4, 44) ELSE NULL END`
  return `NULLIF(LTRIM(RTRIM(COALESCE(${resCh}, ${protCh}, ${nfeCh}, ${fromId}))), '')`
}

/** Evita duplicidade na grade: mesma chNFe → só linha com IdSchema = proc (3), se existir. */
function whereHideResumoWhenProcNfeExistsSql() {
  const main = '[dfeLoteDist]'
  const dup = '[dfeLoteDist_proc]'
  const chMain = docXmlChNFeCoalesceSql(`${main}.[DocXml]`)
  const chDup = docXmlChNFeCoalesceSql(`${dup}.[DocXml]`)
  return `(
    ${main}.[IdSchema] = ${DFE_LOTE_DIST_FULL_NFE_SCHEMA_ID}
    OR NOT EXISTS (
      SELECT 1
      FROM [DFeLoteDist] AS ${dup}
      WHERE ${dup}.[IDEmpresaFilial] = ${main}.[IDEmpresaFilial]
        AND ${dup}.[IdSchema] = ${DFE_LOTE_DIST_FULL_NFE_SCHEMA_ID}
        AND ${dup}.[Id] <> ${main}.[Id]
        AND ${chDup} IS NOT NULL
        AND ${chMain} IS NOT NULL
        AND ${chDup} = ${chMain}
    )
  )`
}

export async function findAll(transaction, { page = 1, limit = 50, filters = {}, range = {}, sortBy = 'dhEmi', sortOrder = 'ASC' }) {
  const session = await getSession()
  const offset = (page - 1) * limit

  const where = {
    companyId: session.company.id
  }

  if (filters.nsu) {
    where.nsu = filters.nsu
  }

  if (filters.idSchema) {
    where.idSchema = filters.idSchema
  }

  if (filters.isUnPack !== undefined && filters.isUnPack !== null && filters.isUnPack !== '') {
    where.isUnPack = filters.isUnPack === 'true' || filters.isUnPack === true
  }

  // Range filter for date
  if (range.start && range.end) {
    const field = range.field || 'data'

    if (field === 'dhEmi') {
      const start = range.start.split('T')[0] + ' 00:00:00'
      const end = range.end.split('T')[0] + ' 23:59:59'

      const sqlValue = docXmlDhEmiCoalesceSql()

      where[Op.and] = [
        ...(where[Op.and] || []),
        Sequelize.where(
          Sequelize.literal(`CAST(${sqlValue} AS DATETIME)`),
          { [Op.between]: [start, end] }
        )
      ]
    } else {
      where.data = { [Op.between]: [new Date(range.start), new Date(range.end)] }
    }
  }

  // XML content filters
  if (filters.cnpj || filters.xNome || filters.vNF) {
    const xmlConditions = [];
    const docXmlCol = Sequelize.cast(Sequelize.col('docXml'), 'NVARCHAR(MAX)');

    if (filters.cnpj) {
      xmlConditions.push(Sequelize.where(docXmlCol, { [Op.like]: `%<CNPJ>${filters.cnpj}</CNPJ>%` }));
    }
    if (filters.xNome) {
      xmlConditions.push(Sequelize.where(docXmlCol, { [Op.like]: `%<xNome>%${filters.xNome}%</xNome>%` }));
    }
    if (filters.vNF) {
      xmlConditions.push(Sequelize.where(docXmlCol, { [Op.like]: `%<vNF>${filters.vNF}</vNF>%` }));
    }

    where[Op.and] = [...(where[Op.and] || []), ...xmlConditions];
  }

  where[Op.and] = [
    ...(where[Op.and] || []),
    Sequelize.literal(whereHideResumoWhenProcNfeExistsSql()),
  ]

  const dir = String(sortOrder || 'ASC').toUpperCase() === 'DESC' ? 'DESC' : 'ASC'
  let order
  if (sortBy === 'dhEmi') {
    order = [[Sequelize.literal(`CAST(${docXmlDhEmiCoalesceSql()} AS DATETIME)`), dir]]
  } else if (DFE_LOTE_DIST_SORTABLE_DB.has(sortBy)) {
    order = [[sortBy, dir]]
  } else {
    order = [[Sequelize.literal(`CAST(${docXmlDhEmiCoalesceSql()} AS DATETIME)`), 'ASC']]
  }

  const result = await dfeLoteDistRepository.findAll(transaction, {
    where,
    limit,
    offset,
    order,
    include: [
      { association: 'schemaInfo' },
      { association: 'lastManifestEvent', attributes: ['id', 'manifestationCode'] }
    ]
  })

  return { items: result.rows, total: result.count, page, limit, filters, range, sortBy, sortOrder }
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
  await findOne(transaction, distributionId)
  return manifestEventRepository.findAllByDistributionId(transaction, distributionId)
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

async function upsertSyncedDistributionDocs(transaction, { db, session, extractedDocs, uniqueSchemaNames, idDFeLoteDistOrigem = null }) {
  const existingSchemas = await db.findAllSchemas(transaction, uniqueSchemaNames)
  const schemaMap = new Map(existingSchemas.map(s => [s.schema, s.id]))

  const missingSchemaNames = uniqueSchemaNames.filter(name => !schemaMap.has(name))
  if (missingSchemaNames.length > 0) {
    const createdSchemas = await db.bulkCreateSchemas(transaction, missingSchemaNames.map(name => ({ schema: name, descricao: name })))
    createdSchemas.forEach(s => schemaMap.set(s.schema, s.id))
  }

  const origem =
    idDFeLoteDistOrigem != null && idDFeLoteDistOrigem !== ""
      ? Number(idDFeLoteDistOrigem)
      : null

  const syncedData = extractedDocs.map(doc => {
    const buffer = Buffer.from(doc.base64Content, "base64")
    const decompressed = zlib.gunzipSync(buffer).toString("utf8")

    return {
      nsu: doc.nsu,
      idSchema: schemaMap.get(doc.schemaName),
      docXml: decompressed,
      companyId: session.company.id,
      data: new Date(),
      isUnPack: true,
      ...(origem != null && !Number.isNaN(origem) ? { idDFeLoteDistOrigem: origem } : {}),
    }
  })

  await db.bulkCreate(transaction, syncedData)
  return { count: syncedData.length }
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
    where: { companyId: session.company.id }
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

  const body = `
    <Distribuition>
      <ufAutor>GO</ufAutor>
      <documento>${session.company.cnpj}</documento>
      <ultNSU>${lastNsu}</ultNSU>
    </Distribuition>
  `

  const response = await fetch(`${process.env.SERVICE_API}/dfe/nfe/distribuition`, {
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

function digitsOnly(value) {
  return String(value ?? "").replace(/\D/g, "")
}

/**
 * @param {import('sequelize').Transaction} transaction
 * @param {number|string} id
 */
export async function syncDistributionsById(transaction, id) {
  const session = await getSession()
  const current = await findOne(transaction, id)

  const chNFeDigits = digitsOnly(extractChNFeFromDocXml(current.docXml))
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

  const response = await fetch(`${process.env.SERVICE_API}/dfe/nfe/distribuicao-dfe`, {
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
    const parsedChNFe = digitsOnly(extractChNFeFromDocXml(decompressed))

    return {
      ...doc,
      decompressed,
      parsedChNFe
    }
  })

  const selectedDoc =
    parsedDocs.find(d => d.parsedChNFe && d.parsedChNFe === normalizedCurrentChNFe)
    || parsedDocs[0]

  await dfeLoteDistRepository.updateById(transaction, {
    id: current.id,
    data: {
      nsu: current.nsu,
      idSchema: schemaMap.get(selectedDoc.schemaName) || current.idSchema,
      docXml: selectedDoc.decompressed,
      data: new Date(),
      isUnPack: true
    }
  })

  return { count: 1 }
}

export async function createManifestEvent(transaction, {
  distributionId,
  manifestationCode,
  success,
  message = null,
}) {
  const session = await getSession()

  const row = await manifestEventRepository.create(transaction, {
    distributionId,
    manifestationCode,
    success,
    message,
    occurredAt: new Date(),
    userId: session?.user?.id || null,
  })

  await dfeLoteDistRepository.updateById(transaction, {
    id: distributionId,
    data: { lastManifestEventId: row.id },
  })

  return row
}

function extractChNFeFromDocXml(docXml) {
  if (!docXml || typeof docXml !== "string") return null
  const chTag = docXml.match(/<chNFe>([^<]+)<\/chNFe>/i)
  if (chTag?.[1]) return chTag[1].trim()
  const idAttr = docXml.match(/<infNFe[^>]*\bId\s*=\s*["']NFe(\d{44})["']/i)
  if (idAttr?.[1]) return idAttr[1]
  return null
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

  const chNFe = extractChNFeFromDocXml(record.docXml)
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

  const response = await fetch(`${process.env.SERVICE_API}/dfe/nfe/manifestation`, {
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
    distributionId: id,
    manifestationCode: code,
    success: true,
    message: xMotivo,
  })

  await syncDistributionsById(transaction, id)

  switch (code) {
    case ManifestationType.Awareness.code: {
      operations.push('SYNC_DISTRIBUTIONS_BY_ID')
      break
    }
    default: {
      break
    }
  }

  return {
    ...result,
    operations,
  }

}
