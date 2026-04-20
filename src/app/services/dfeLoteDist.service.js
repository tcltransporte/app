"use server"

import Sequelize, { Op } from 'sequelize'
import * as dfeLoteDistRepository from "@/app/repositories/dfeLoteDist.repository"
import { getSession } from "@/libs/session"
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

  const body = `
    <Distribuicao>
      <ufAutor>GO</ufAutor>
      <documento>23353299000163</documento>
      <ultNSU>${lastNsu}</ultNSU>
    </Distribuicao>
  `

  const response = await fetch("http://localhost:5100/dfe/nfe/distribuition", {
    method: "POST",
    headers: {
      "content-type": "application/xml",
      "x-cert-base64": "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",
      "x-cert-password": "p123456",
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
