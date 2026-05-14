"use server"

import { Op } from 'sequelize'
import { endOfDay, isValid, parseISO, startOfDay } from 'date-fns'
import { AppContext } from '@/database'
import * as cteRepository from '@/app/repositories/cte.repository'
import * as municipioRepository from '@/app/repositories/municipio.repository'
import * as cteNotaRepository from '@/app/repositories/cteNota.repository'
import * as financeRepository from '@/app/repositories/finance.repository'
import * as notaRepository from '@/app/repositories/nota.repository'
import * as partnerRepository from '@/app/repositories/partner.repository'
import {
  extractCteRouteIbgeMunicipalityCodes,
  extractDestinatarioDisplayFromXml,
  extractRemetenteDisplayFromXml,
  parseCteXml
} from '@/libs/cteXmlParser'

/** Contas a receber (mesmo código da página `/finances/receivements`). */
const RECEIVABLE_OPERATION_TYPE = 1

const MAX_DOCUMENT_NUMBER = 2147483647

function documentNumberFromCte(ctNumber, ctKey) {
  const n = Number(ctNumber)
  if (Number.isFinite(n) && n > 0 && n <= MAX_DOCUMENT_NUMBER) {
    return Math.floor(n)
  }
  const tail = parseInt(String(ctKey || '').replace(/\D/g, '').slice(-9), 10)
  if (Number.isFinite(tail) && tail > 0) return tail
  return 1
}

/**
 * Vencimento = data de emissão (meio-dia local) + dias de prazo do parceiro.
 * @param {Date|null|undefined} issuedAt
 * @param {number|string|null|undefined} daysDeadlinePayment
 */
function dueDateFromIssuedAtAndPartnerDeadline(issuedAt, daysDeadlinePayment) {
  const extra = Number(daysDeadlinePayment)
  const days = Number.isFinite(extra) && extra >= 0 ? Math.floor(extra) : 0
  const base = issuedAt instanceof Date && !Number.isNaN(issuedAt.getTime())
    ? issuedAt
    : new Date()
  const local = new Date(base.getFullYear(), base.getMonth(), base.getDate(), 12, 0, 0, 0)
  local.setDate(local.getDate() + days)
  return local
}

/** Mensagem útil a partir de erro Sequelize / tedious (evita só "SequelizeDatabaseError"). */
function formatSequelizeDbMessage(err) {
  if (!err) return 'Erro desconhecido'

  const noise = new Set(['SequelizeDatabaseError', 'SequelizeError', 'Error'])

  /** @param {unknown} e */
  function pickFromOne(e) {
    if (!e || typeof e !== 'object') return ''
    const o = /** @type {Record<string, unknown>} */ (e)
    const info = o.info
    if (info && typeof info === 'object') {
      const im = /** @type {Record<string, unknown>} */ (info).message
      if (typeof im === 'string' && im.trim()) return im.trim()
    }
    const m = o.message
    if (typeof m === 'string' && m.trim() && !noise.has(m.trim())) return m.trim()
    return ''
  }

  /** @param {unknown} e @param {Set<unknown>} seen */
  function walk(e, seen, depth) {
    if (!e || typeof e !== 'object' || depth > 8) return ''
    if (seen.has(e)) return ''
    seen.add(e)
    const o = /** @type {Record<string, unknown>} */ (e)
    const direct =
      pickFromOne(e)
      || (typeof o.sql === 'string' && o.sql ? `SQL: ${String(o.sql).slice(0, 500)}` : '')
    if (direct) return direct
    const chain = ['original', 'parent', 'cause', 'error']
    for (const k of chain) {
      const sub = o[k]
      const w = walk(sub, seen, depth + 1)
      if (w) return w
    }
    if (Array.isArray(o.errors)) {
      for (const sub of o.errors) {
        const w = walk(sub, seen, depth + 1)
        if (w) return w
      }
    }
    return ''
  }

  const msg = walk(err, new Set(), 0)
  if (msg) return msg.slice(0, 2000)

  const fallback = pickFromOne(err) || (typeof err.message === 'string' ? err.message.trim() : '')
  if (fallback && !noise.has(fallback)) return fallback.slice(0, 2000)

  const any = err.original ?? err.parent
  if (any && typeof any === 'object') {
    const o = /** @type {Record<string, unknown>} */ (any)
    for (const k of ['Message', 'text', 'sqlMessage', 'description']) {
      const v = o[k]
      if (typeof v === 'string' && v.trim().length > 2 && !noise.has(v.trim())) {
        return v.trim().slice(0, 2000)
      }
    }
    if (o.number != null || o.code != null) {
      const bits = [`SQL Server #${o.number ?? o.code}`]
      if (typeof o.state === 'number') bits.push(`state ${o.state}`)
      if (typeof o.class === 'number') bits.push(`class ${o.class}`)
      if (typeof o.message === 'string' && o.message.trim()) bits.push(o.message.trim())
      return bits.join(' — ').slice(0, 2000)
    }
    if (typeof o.sql === 'string' && o.sql.trim()) {
      return `Erro ao executar SQL (detalhe não retornado pelo driver). Trecho: ${String(o.sql).slice(0, 800)}`
    }
  }

  return String(/** @type {{ name?: string }} */ (err).name || err)
}

const SORT_FIELD_MAP = {
  id: 'id',
  ctNumber: 'ctNumber',
  ctSeries: 'ctSeries',
  ctKey: 'ctKey',
  issuedAt: 'issuedAt',
  amountToReceive: 'amountToReceive',
  totalServiceAmount: 'totalServiceAmount',
  statusCode: 'statusCode',
  customerId: 'customerId',
  movementId: 'movementId'
}

export async function findAll(transaction, params = {}) {
  const {
    page = 1,
    limit = 50,
    sortBy = 'issuedAt',
    sortOrder = 'DESC',
    filters = {},
    range = {},
    companyId
  } = params || {}

  const where = {}
  const search = String(filters?.search || '').trim()
  const numericSearch = Number(search)
  const ctNumber = String(filters?.ctNumber || '').trim()
  const ctKey = String(filters?.ctKey || '').trim()
  const statusCode = String(filters?.statusCode || '').trim()
  const movementId = String(filters?.movementId || '').trim()
  const description = String(filters?.description || '').trim()

  if (companyId != null && companyId !== '') {
    where.companyBranchId = companyId
  }

  if (search) {
    where[Op.or] = [
      { ctKey: { [Op.like]: `%${search}%` } },
      { description: { [Op.like]: `%${search}%` } },
      ...(Number.isNaN(numericSearch) ? [] : [{ ctNumber: numericSearch }])
    ]
  }

  if (ctNumber) {
    const parsed = Number(ctNumber)
    if (!Number.isNaN(parsed)) {
      where.ctNumber = parsed
    }
  }

  if (ctKey) {
    where.ctKey = { [Op.like]: `%${ctKey}%` }
  }

  if (statusCode) {
    const parsed = Number(statusCode)
    if (!Number.isNaN(parsed)) {
      where.statusCode = parsed
    }
  }

  if (movementId) {
    const parsed = Number(movementId)
    if (!Number.isNaN(parsed)) {
      where.movementId = parsed
    }
  }

  if (description) {
    where.description = { [Op.like]: `%${description}%` }
  }

  const rangeField = String(range?.field || 'issuedAt').trim()
  const rangeStart = String(range?.start || '').trim()
  const rangeEnd = String(range?.end || '').trim()
  if (!rangeField || rangeField === 'issuedAt') {
    if (rangeStart && rangeEnd) {
      const a = parseISO(rangeStart)
      const b = parseISO(rangeEnd)
      if (isValid(a) && isValid(b)) {
        where.issuedAt = { [Op.between]: [startOfDay(a), endOfDay(b)] }
      }
    } else if (rangeStart) {
      const a = parseISO(rangeStart)
      if (isValid(a)) where.issuedAt = { [Op.gte]: startOfDay(a) }
    } else if (rangeEnd) {
      const b = parseISO(rangeEnd)
      if (isValid(b)) where.issuedAt = { [Op.lte]: endOfDay(b) }
    }
  }

  const normalizedSortBy = SORT_FIELD_MAP[sortBy] || 'issuedAt'
  const normalizedSortOrder = String(sortOrder).toUpperCase() === 'ASC' ? 'ASC' : 'DESC'
  const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 200)
  const safePage = Math.max(Number(page) || 1, 1)

  const result = await cteRepository.findAll(transaction, {
    where,
    limit: safeLimit,
    offset: (safePage - 1) * safeLimit,
    order: [[normalizedSortBy, normalizedSortOrder]],
    include: [
      {
        association: 'destinatario',
        attributes: ['id', 'name', 'surname', 'cpfCnpj']
      }
    ]
  })

  const rows = (result.rows || []).map((row) => {
    const remetenteFromXml = extractRemetenteDisplayFromXml(row.xml)
    const destinatarioFromXml = extractDestinatarioDisplayFromXml(row.xml)
    const { xml: _xml, ...rest } = row
    return { ...rest, remetenteFromXml, destinatarioFromXml }
  })

  return {
    rows,
    count: result.count || 0
  }
}

/**
 * Atualiza `Origem` / `Destino` em `Ctes` a partir de `cMunIni` / `cMunFim` no XML, resolvendo `codigo_municipio` em `municipio`.
 * @param {{ companyId?: number|string, batchSize?: number, maxRows?: number|null }} params
 */
export async function backfillOrigemDestinoFromXml(params = {}) {
  const companyBranchId = params.companyId
  const batchSize = Math.min(Math.max(Number(params.batchSize) || 150, 1), 500)
  const maxRows = params.maxRows != null && params.maxRows !== '' ? Number(params.maxRows) : null

  const summary = {
    scanned: 0,
    updated: 0,
    batches: 0,
    unresolvedIni: 0,
    unresolvedFim: 0
  }

  const db = new AppContext()
  let offset = 0

  while (true) {
    if (maxRows != null && Number.isFinite(maxRows) && offset >= maxRows) break

    const limit =
      maxRows != null && Number.isFinite(maxRows)
        ? Math.min(batchSize, maxRows - offset)
        : batchSize
    if (limit <= 0) break

    const { batch, batchSummary } = await db.withTransaction(null, async (t) => {
      const rows = await cteRepository.findBatchWithXml(t, {
        limit,
        offset,
        companyBranchId
      })
      if (!rows.length) {
        return { batch: [], batchSummary: null }
      }

      const ibges = new Set()
      for (const row of rows) {
        const { cMunIni, cMunFim } = extractCteRouteIbgeMunicipalityCodes(row.xml)
        if (cMunIni) ibges.add(cMunIni)
        if (cMunFim) ibges.add(cMunFim)
      }
      const ibgeMap = await municipioRepository.findCodigoMunicipioMapByIbgeList(t, [...ibges])

      const local = {
        scanned: 0,
        updated: 0,
        unresolvedIni: 0,
        unresolvedFim: 0
      }

      for (const row of rows) {
        local.scanned += 1
        const { cMunIni, cMunFim } = extractCteRouteIbgeMunicipalityCodes(row.xml)

        const patch = /** @type {{ originCityId?: number, destinationCityId?: number }} */ ({})
        if (cMunIni) {
          const id = ibgeMap.get(cMunIni)
          if (id != null) patch.originCityId = id
          else local.unresolvedIni += 1
        }

        if (cMunFim) {
          const id = ibgeMap.get(cMunFim)
          if (id != null) patch.destinationCityId = id
          else local.unresolvedFim += 1
        }

        if (patch.originCityId != null || patch.destinationCityId != null) {
          const n = await cteRepository.updateOrigemDestino(t, row.id, patch)
          if (n > 0) local.updated += 1
        }
      }

      return { batch: rows, batchSummary: local }
    })

    if (!batch.length) break

    summary.batches += 1
    summary.scanned += batchSummary.scanned
    summary.updated += batchSummary.updated
    summary.unresolvedIni += batchSummary.unresolvedIni
    summary.unresolvedFim += batchSummary.unresolvedFim

    offset += batch.length
    if (batch.length < limit) break
  }

  return summary
}

/**
 * Importa vários XMLs de CT-e. Cada arquivo roda numa transação própria (commit ou rollback isolado).
 * Ignora chaves já existentes para a filial. Cria conta a receber + vínculos `CteNotas` quando aplicável.
 * @param {{ companyId: number|string, companyBusinessId: number|string, items: { filename?: string, name?: string, xml: string }[] }} params
 */
export async function importFromXmls(params = {}) {
  const { companyId, companyBusinessId, items = [] } = params
  if (companyId == null || companyId === '') {
    throw new Error('Empresa não informada para importação')
  }
  if (companyBusinessId == null || companyBusinessId === '') {
    throw new Error('Empresa matriz não informada para importação')
  }

  const summary = {
    created: 0,
    skipped: 0,
    receivablesCreated: 0,
    cteNotasLinked: 0,
    failed: /** @type {{ filename: string, message: string }[]} */ ([])
  }

  const db = new AppContext()

  for (const item of items) {
    const filename = String(item.filename || item.name || 'arquivo.xml')
    try {
      await db.withTransaction(null, async (t) => {
        const xml = String(item.xml || '').trim()
        if (!xml) {
          throw new Error('XML vazio')
        }
        const parsed = parseCteXml(xml)
        const existing = await cteRepository.findOneByCtKey(t, companyId, parsed.ctKey)
        if (existing) {
          summary.skipped += 1
          return
        }

        const tomadorDigits = parsed.tomadorCpfCnpjDigits
        if (!tomadorDigits) {
          throw new Error('Tomador (CNPJ/CPF) não encontrado no XML (toma3/toma4)')
        }

        const partner = await partnerRepository.findOneByCompanyBusinessAndDocumentDigits(
          t,
          companyBusinessId,
          tomadorDigits
        )
        if (!partner) {
          throw new Error(`Parceiro não cadastrado para o documento do tomador (${tomadorDigits})`)
        }

        /** `IDCliente` = destinatário do CT-e (`<dest>`), quando houver parceiro cadastrado. */
        let customerId = null
        const destDigits = parsed.destinatarioCpfCnpjDigits
        if (destDigits) {
          const destinatarioPartner = await partnerRepository.findOneByCompanyBusinessAndDocumentDigits(
            t,
            companyBusinessId,
            destDigits
          )
          if (destinatarioPartner) customerId = destinatarioPartner.id
        }

        const totalValue = Number(parsed.amountToReceive) > 0
          ? Number(parsed.amountToReceive)
          : Number(parsed.totalServiceAmount)
        if (!Number.isFinite(totalValue) || totalValue <= 0) {
          throw new Error('Valor a receber (vRec) ou valor do serviço (vTPrest) inválido ou ausente no XML')
        }

        const issuedAt = parsed.issuedAt instanceof Date && !Number.isNaN(parsed.issuedAt.getTime())
          ? parsed.issuedAt
          : new Date()

        const dueDate = dueDateFromIssuedAtAndPartnerDeadline(issuedAt, partner.daysDeadlinePayment)
        const documentNumber = documentNumberFromCte(parsed.ctNumber, parsed.ctKey)
        const descBase = `CT-e ${parsed.ctNumber ?? ''}/${parsed.ctSeries != null ? parsed.ctSeries : ''}`.trim()
        const titleDescription = `${descBase} — ${parsed.ctKey}`.slice(0, 1000)

        const {
          tomadorCpfCnpjDigits: _t,
          remetenteCpfCnpjDigits: _r,
          destinatarioCpfCnpjDigits: _d,
          referencedNfeKeys,
          cMunIni: _cMunIni,
          cMunFim: _cMunFim,
          ...cteAttrs
        } = parsed

        let originCityId = null
        let destinationCityId = null
        if (parsed.cMunIni) {
          originCityId = await municipioRepository.findCodigoMunicipioByIbge(t, parsed.cMunIni)
        }
        if (parsed.cMunFim) {
          destinationCityId = await municipioRepository.findCodigoMunicipioByIbge(t, parsed.cMunFim)
        }

        const titleRecord = await financeRepository.create(t, {
          partnerId: partner.id,
          documentNumber,
          totalValue,
          movementDate: issuedAt,
          issueDate: issuedAt,
          description: titleDescription,
          operationType: RECEIVABLE_OPERATION_TYPE,
          companyId,
          entries: [
            {
              installmentNumber: 1,
              installmentValue: totalValue,
              dueDate,
              systemDate: new Date(),
              description: `CT-e ${parsed.ctKey}`.slice(0, 1000)
            }
          ]
        })

        const createdCte = await cteRepository.create(t, {
          ...cteAttrs,
          companyBranchId: companyId,
          movementId: titleRecord.id,
          customerId,
          payerId: partner.id,
          ...(originCityId != null ? { originCityId } : {}),
          ...(destinationCityId != null ? { destinationCityId } : {})
        })

        const notas = await notaRepository.findAllByNfKeys(t, referencedNfeKeys || [])
        for (const nota of notas) {
          const { inserted } = await cteNotaRepository.createIfNotExists(t, {
            cteId: createdCte.id,
            notaId: nota.id
          })
          if (inserted) summary.cteNotasLinked += 1
        }

        summary.created += 1
        summary.receivablesCreated += 1
      })
    } catch (err) {
      summary.failed.push({
        filename,
        message: formatSequelizeDbMessage(err)
      })
    }
  }

  return summary
}
