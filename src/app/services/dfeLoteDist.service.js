"use server"

import Sequelize, { Op } from 'sequelize'
import * as dfeLoteDistRepository from "@/app/repositories/dfeLoteDist.repository"
import { getSession } from "@/libs/session"
import { normalizeManifestation } from "@/libs/dfeManifestationType"
import zlib from 'zlib'

export async function findAll(transaction, { page = 1, limit = 50, filters = {}, range = {}, sortBy = 'id', sortOrder = 'DESC' }) {
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

      // Namespace declaration inside XQuery (equivalent to WITH XMLNAMESPACES)
      const nsPrefix = 'declare namespace ns="http://www.portalfiscal.inf.br/nfe";'

      // Separate XQuery paths as 'union' (|) is NOT supported in this SQL Server version
      const resXPath = `DocXml.value('${nsPrefix} (/ns:resNFe/ns:dhEmi/text())[1]', 'datetimeoffset')`
      const nfeXPath = `DocXml.value('${nsPrefix} (/ns:NFe/ns:infNFe/ns:ide/ns:dhEmi/text())[1]', 'datetimeoffset')`

      // Combine using COALESCE to find the date in either path
      const sqlValue = `COALESCE(${resXPath}, ${nfeXPath})`

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

  const result = await dfeLoteDistRepository.findAll(transaction, {
    where,
    limit,
    offset,
    order: [[sortBy, sortOrder]],
    include: [{ association: 'schemaInfo' }]
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

  const cStatMatch = xmlResponse.match(/<cStat>([^<]+)<\/cStat>/)
  const xMotivoMatch = xmlResponse.match(/<xMotivo>([^<]+)<\/xMotivo>/)
  const cStat = cStatMatch ? cStatMatch[1] : null
  const xMotivo = xMotivoMatch ? xMotivoMatch[1] : 'Erro desconhecido na distribuição'

  if (cStat && cStat !== '138') {
    throw new Error(xMotivo)
  }

  // Regex to extract docZip nodes
  // <docZip NSU="000000000002033" schema="procEventoNFe_v1.00.xsd">...</docZip>
  const docZipRegex = /<docZip NSU="(\d+)" schema="([^"]+)">([^<]+)<\/docZip>/g
  let match

  const extractedDocs = []
  const schemaNames = new Set()

  while ((match = docZipRegex.exec(xmlResponse)) !== null) {
    const nsu = match[1]
    const schemaName = match[2]
    const base64Content = match[3]

    extractedDocs.push({ nsu, schemaName, base64Content })
    schemaNames.add(schemaName)
  }

  if (extractedDocs.length === 0) return { count: 0 }

  // Bulk handle schemas
  const uniqueSchemaNames = Array.from(schemaNames)
  const existingSchemas = await db.findAllSchemas(transaction, uniqueSchemaNames)
  const schemaMap = new Map(existingSchemas.map(s => [s.schema, s.id]))

  const missingSchemaNames = uniqueSchemaNames.filter(name => !schemaMap.has(name))
  if (missingSchemaNames.length > 0) {
    const createdSchemas = await db.bulkCreateSchemas(transaction, missingSchemaNames.map(name => ({ schema: name, descricao: name })))
    createdSchemas.forEach(s => schemaMap.set(s.schema, s.id))
  }

  const syncedData = extractedDocs.map(doc => {
    // Decompress
    const buffer = Buffer.from(doc.base64Content, 'base64')
    const decompressed = zlib.gunzipSync(buffer).toString('utf8')

    return {
      nsu: doc.nsu,
      idSchema: schemaMap.get(doc.schemaName),
      docXml: decompressed,
      companyId: session.company.id,
      data: new Date(),
      isUnPack: true
    }
  })

  await db.bulkCreate(transaction, syncedData)

  return { count: syncedData.length }
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

  return { cStat, xMotivo, code, chNFe, label }
}
