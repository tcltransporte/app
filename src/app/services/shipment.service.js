import { Op } from 'sequelize'
import { endOfDay, isValid, parseISO, startOfDay } from 'date-fns'
import { getSession } from '@/libs/session'
import * as shipmentRepository from '@/app/repositories/shipment.repository'
import * as shipmentLookupRepository from '@/app/repositories/shipment-lookup.repository'
import * as freightLetterRepository from '@/app/repositories/freightLetter.repository'
import * as freightLetterService from '@/app/services/freightLetter.service'

const SHIPMENT_INCLUDES = [
  {
    association: 'customer',
    attributes: ['id', 'name', 'surname', 'cpfCnpj']
  },
  {
    association: 'receiver',
    attributes: ['id', 'name', 'surname', 'cpfCnpj']
  },
  {
    association: 'expediter',
    attributes: ['id', 'name', 'surname', 'cpfCnpj']
  },
  {
    association: 'thirdPartyPayer',
    attributes: ['id', 'name', 'surname', 'cpfCnpj']
  },
  {
    association: 'freightLetters',
    include: [
      { association: 'componentType', attributes: ['id', 'description'] },
      { association: 'payee', attributes: ['id', 'name', 'surname', 'cpfCnpj'] }
    ]
  }
]

function parseOptionalNumber(value) {
  if (value === '' || value == null) return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

function parseOptionalDate(value) {
  if (!value) return null
  const d = value instanceof Date ? value : new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

function trimMax(value, max) {
  const s = String(value ?? '').trim()
  if (!s) return null
  return s.length > max ? s.slice(0, max) : s
}

const SORT_FIELD_MAP = {
  id: 'id',
  tripId: 'tripId',
  transportDocumentId: 'transportDocumentId',
  departureDate: 'departureDate',
  deliveryDate: 'deliveryDate',
  description: 'description',
  weight: 'weight',
  freightValue: 'freightValue',
  sequenceOrder: 'sequenceOrder',
  deliveryQuantity: 'deliveryQuantity'
}

export async function findAll(transaction, params = {}) {
  const {
    page = 1,
    limit = 50,
    sortBy = 'departureDate',
    sortOrder = 'DESC',
    filters = {},
    range = {},
    companyId
  } = params || {}

  const where = {}
  const search = String(filters?.search || '').trim()
  const numericSearch = Number(search)
  const tripId = String(filters?.tripId || '').trim()
  const transportDocumentId = String(filters?.transportDocumentId || '').trim()
  const description = String(filters?.description || '').trim()
  const customerId = String(filters?.customerId || '').trim()

  if (companyId != null && companyId !== '') {
    where.companyBranchId = companyId
  }

  if (search) {
    where[Op.or] = [
      { description: { [Op.like]: `%${search}%` } },
      { proPred: { [Op.like]: `%${search}%` } },
      { observation: { [Op.like]: `%${search}%` } },
      ...(Number.isNaN(numericSearch) ? [] : [
        { id: numericSearch },
        { tripId: numericSearch },
        { transportDocumentId: numericSearch }
      ])
    ]
  }

  if (tripId) {
    const parsed = Number(tripId)
    if (!Number.isNaN(parsed)) where.tripId = parsed
  }

  if (transportDocumentId) {
    const parsed = Number(transportDocumentId)
    if (!Number.isNaN(parsed)) where.transportDocumentId = parsed
  }

  if (description) {
    where.description = { [Op.like]: `%${description}%` }
  }

  if (customerId) {
    const parsed = Number(customerId)
    if (!Number.isNaN(parsed)) where.customerId = parsed
  }

  const rangeField = String(range?.field || 'departureDate').trim()
  const rangeStart = String(range?.start || '').trim()
  const rangeEnd = String(range?.end || '').trim()

  const applyDateRange = (field) => {
    if (rangeStart && rangeEnd) {
      const a = parseISO(rangeStart)
      const b = parseISO(rangeEnd)
      if (isValid(a) && isValid(b)) {
        where[field] = { [Op.between]: [startOfDay(a), endOfDay(b)] }
      }
    } else if (rangeStart) {
      const a = parseISO(rangeStart)
      if (isValid(a)) where[field] = { [Op.gte]: startOfDay(a) }
    } else if (rangeEnd) {
      const b = parseISO(rangeEnd)
      if (isValid(b)) where[field] = { [Op.lte]: endOfDay(b) }
    }
  }

  if (rangeField === 'deliveryDate') {
    applyDateRange('deliveryDate')
  } else if (rangeField === 'departureDate' || !rangeField) {
    if (rangeStart || rangeEnd) {
      applyDateRange('departureDate')
    }
  }

  const normalizedSortBy = SORT_FIELD_MAP[sortBy] || 'departureDate'
  const normalizedSortOrder = String(sortOrder).toUpperCase() === 'ASC' ? 'ASC' : 'DESC'
  const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 200)
  const safePage = Math.max(Number(page) || 1, 1)

  return await shipmentRepository.findAll(transaction, {
    where,
    limit: safeLimit,
    offset: (safePage - 1) * safeLimit,
    order: [[normalizedSortBy, normalizedSortOrder]],
    include: SHIPMENT_INCLUDES
  })
}

function buildWritablePayload(data, { session, isCreate }) {
  const customerId = Number(data?.customerId)
  if (!customerId || Number.isNaN(customerId)) {
    throw { code: 'VALIDATION', message: 'Remetente é obrigatório' }
  }

  const payload = {
    customerId,
    tripId: parseOptionalNumber(data.tripId),
    transportDocumentId: parseOptionalNumber(data.transportDocumentId),
    deliveryQuantity: parseOptionalNumber(data.deliveryQuantity),
    weight: parseOptionalNumber(data.weight),
    freightValue: parseOptionalNumber(data.freightValue),
    freightLetterValue: parseOptionalNumber(data.freightLetterValue),
    description: trimMax(data.description, 60),
    proPred: trimMax(data.proPred, 60),
    ncmId: parseOptionalNumber(data.ncmId),
    paymentTypeId: parseOptionalNumber(data.paymentTypeId),
    icmsCalculationTypeId: parseOptionalNumber(data.icmsCalculationTypeId),
    serviceTypeId: parseOptionalNumber(data.serviceTypeId),
    servicePayerTypeId: parseOptionalNumber(data.servicePayerTypeId),
    thirdPartyPayerId: parseOptionalNumber(data.thirdPartyPayerId),
    refCteKey: trimMax(data.refCteKey, 44),
    departureDate: parseOptionalDate(data.departureDate),
    deliveryDate: parseOptionalDate(data.deliveryDate),
    receiverId: parseOptionalNumber(data.receiverId),
    expediterId: parseOptionalNumber(data.expediterId),
    originMunicipalityId: parseOptionalNumber(data.originMunicipalityId),
    destinationMunicipalityId: parseOptionalNumber(data.destinationMunicipalityId),
    sequenceOrder: parseOptionalNumber(data.sequenceOrder),
    observation: trimMax(data.observation, 300),
    updateUserId: session?.user?.id || null,
    updatedAt: new Date()
  }

  if (isCreate) {
    const companyBranchId = session?.company?.id
    if (companyBranchId == null || companyBranchId === '') {
      throw { code: 'NO_COMPANY', message: 'Empresa não identificada na sessão.' }
    }
    payload.companyBranchId = Number(companyBranchId)
    payload.isValid = true
    payload.insertUserId = session?.user?.id || null
    payload.insertedAt = new Date()
  }

  return payload
}

async function assertShipmentAccess(transaction, id) {
  const session = await getSession()
  const companyId = session?.company?.id
  if (companyId == null || companyId === '') {
    throw { code: 'NO_COMPANY', message: 'Empresa não identificada na sessão.' }
  }

  const row = await shipmentRepository.findOne(transaction, id)
  if (!row) {
    throw { code: 'NOT_FOUND', message: 'Romaneio não encontrado' }
  }
  if (Number(row.companyBranchId) !== Number(companyId)) {
    throw { code: 'FORBIDDEN', message: 'Romaneio não pertence à filial da sessão' }
  }
  return row
}

export async function findOne(transaction, id) {
  await assertShipmentAccess(transaction, id)
  return await shipmentRepository.findOne(transaction, id, {
    include: SHIPMENT_INCLUDES
  })
}

function sumFreightComponents(components = []) {
  return (components || []).reduce((sum, row) => sum + (Number(row.value) || 0), 0)
}

async function syncFreightLetters(transaction, loadId, tripId, components = []) {
  const { rows: existing } = await freightLetterRepository.findAll(transaction, {
    attributes: ['id'],
    where: { loadId }
  })

  const keepIds = new Set(
    (components || [])
      .map((c) => Number(c.id))
      .filter((id) => Number.isFinite(id) && id > 0)
  )

  for (const row of existing || []) {
    if (!keepIds.has(Number(row.id))) {
      await freightLetterRepository.destroy(transaction, { where: { id: row.id } })
    }
  }

  const resolvedTripId = parseOptionalNumber(tripId) || Number(loadId)

  for (const comp of components || []) {
    const typeId = Number(comp.freightLetterComponentTypeId)
    if (!typeId || Number.isNaN(typeId)) continue

    const payload = {
      loadId: Number(loadId),
      tripId: resolvedTripId,
      freightLetterComponentTypeId: typeId,
      value: Number(comp.value) || 0,
      discountValue: Number(comp.discountValue) || 0,
      operatorId: 2,
      statusId: 1,
      effectiveDate: comp.effectiveDate ? new Date(comp.effectiveDate) : new Date(),
      isSynchronized: false,
      payeeId: parseOptionalNumber(comp.payeeId),
      description: comp.description || null,
      operatorProtocol: comp.operatorProtocol || null,
      cardNumber: comp.cardNumber || null
    }

    if (comp.id) {
      await freightLetterService.update(transaction, comp.id, payload)
    } else {
      await freightLetterService.create(transaction, payload)
    }
  }

  return sumFreightComponents(components)
}

export async function getFormLookups(transaction) {
  const [
    paymentTypes,
    serviceTypes,
    servicePayerTypes,
    icmsCalculationTypes,
    componentTypes
  ] = await Promise.all([
    shipmentLookupRepository.findPaymentTypes(transaction),
    shipmentLookupRepository.findServiceTypes(transaction),
    shipmentLookupRepository.findServicePayerTypes(transaction),
    shipmentLookupRepository.findIcmsCalculationTypes(transaction),
    freightLetterService.findAllComponentTypes(transaction)
  ])

  return {
    paymentTypes,
    serviceTypes,
    servicePayerTypes,
    icmsCalculationTypes,
    componentTypes
  }
}

export async function searchNcm(transaction, search = '') {
  return await shipmentLookupRepository.searchNcm(transaction, search)
}

export async function findNcmById(transaction, id) {
  return await shipmentLookupRepository.findNcmById(transaction, id)
}

export async function create(transaction, data = {}) {
  const session = await getSession()
  const components = data.freightComponents || []
  const payload = buildWritablePayload(data, { session, isCreate: true })
  const freightSum = sumFreightComponents(components)
  if (freightSum > 0) payload.freightValue = freightSum

  const created = await shipmentRepository.create(transaction, payload)

  if (components.length) {
    await syncFreightLetters(transaction, created.id, payload.tripId, components)
  }

  const row = await shipmentRepository.findOne(transaction, created.id, {
    include: SHIPMENT_INCLUDES
  })
  return row || created
}

export async function update(transaction, id, data = {}) {
  const session = await getSession()
  await assertShipmentAccess(transaction, id)
  const components = data.freightComponents
  const payload = buildWritablePayload(data, { session, isCreate: false })

  if (Array.isArray(components)) {
    const freightSum = await syncFreightLetters(transaction, id, payload.tripId ?? data.tripId, components)
    if (freightSum > 0) payload.freightValue = freightSum
  }

  const row = await shipmentRepository.update(transaction, id, payload, {
    include: SHIPMENT_INCLUDES
  })
  if (!row) {
    throw { code: 'NOT_FOUND', message: 'Romaneio não encontrado' }
  }
  return row
}
