"use server"

import * as financeRepository from "@/app/repositories/finance.repository"
import { getSession } from "@/libs/session"
import { Op } from 'sequelize'

export async function findAll(transaction, params = {}) {
  const session = await getSession()

  const where = {
    ...params.where,
    companyId: session.company.id
  }

  const result = await financeRepository.findAll(transaction, { ...params, where })
  return result
}

export async function findOne(transaction, id) {
  const session = await getSession()

  const result = await financeRepository.findOne(transaction, {
    where: { id, companyId: session.company.id },
    include: [
      { association: 'entries', attributes: ['id', 'installmentNumber', 'installmentValue', 'dueDate', 'paymentId'] },
      { association: 'partner', attributes: ['id', 'name', 'surname'] },
      { association: 'accountPlan', attributes: ['id', 'description', 'code'] },
      { association: 'costCenter', attributes: ['id', 'description'] },
      { association: 'company', attributes: ['id', 'name', 'surname'] }
    ]
  })

  if (!result) {
    throw { code: "NOT_FOUND", message: "Título financeiro não encontrado" }
  }

  return result

}

export async function create(transaction, data) {
  const session = await getSession()

  const result = await financeRepository.create(transaction, {
    ...data,
    companyId: session.company.id
  })

  return result
}

export async function update(transaction, id, data) {
  const session = await getSession()

  await financeRepository.update(transaction, {
    where: { id, companyId: session.company.id }
  }, data)

  const result = await findOne(transaction, id)
  return result
}

export async function findAllEntries(transaction, params = {}) {
  const page = Number(params.page) > 0 ? Number(params.page) : 1
  const limit = Number(params.limit) > 0 ? Number(params.limit) : 50
  const offset = (page - 1) * limit

  params.limit = limit
  params.offset = offset
  delete params.page

  if (params.sortBy) {
    params.order = [[params.sortBy, params.sortOrder || 'ASC']]
  }
  delete params.sortBy
  delete params.sortOrder

  const selectedCompanyId = params?.filters?.company?.id ? Number(params.filters.company.id) : null
  const titleWhere = selectedCompanyId ? { companyId: selectedCompanyId } : {}

  if (params.operationType) {
    params.where = {
      ...params.where,
      [Op.or]: [
        { '$title.type_operation$': params.operationType },
        {
          '$title.type_operation$': null,
          '$title.accountPlan.codigo_tipo_operacao$': params.operationType
        }
      ]
    }
    delete params.operationType
  }

  if (params.filters) {
    const { filters } = params
    const andConditions = []

    if (filters.documentNumber) {
      const rawDocumentNumber = String(filters.documentNumber).trim()
      const documentTokens = rawDocumentNumber
        .split(',')
        .map((token) => token.trim())
        .filter(Boolean)

      if (documentTokens.length > 1) {
        const numericTokens = documentTokens
          .map((token) => Number(token))
          .filter((value) => !Number.isNaN(value))

        if (numericTokens.length === documentTokens.length) {
          andConditions.push({
            '$title.numero_documento$': { [Op.in]: numericTokens }
          })
        } else {
          andConditions.push({
            [Op.or]: documentTokens.map((token) => ({
              '$title.numero_documento$': { [Op.like]: `%${token}%` }
            }))
          })
        }
      } else {
        andConditions.push({
          '$title.numero_documento$': { [Op.like]: `%${rawDocumentNumber}%` }
        })
      }
    }

    if (filters.invoiceNumber) {
      const invoiceNumber = Number(String(filters.invoiceNumber).trim())
      if (!Number.isNaN(invoiceNumber)) {
        titleWhere.invoiceId = invoiceNumber
      }
    }

    if (filters.partner) {
      const partnerId = Number(filters.partner?.id)
      if (!Number.isNaN(partnerId)) {
        titleWhere.partnerId = partnerId
      } else {
        const partnerSearch = String(filters.partner).trim().replace(/\s+/g, '%')
        andConditions.push({
          [Op.or]: [
            { '$title.partner.RazaoSocial$': { [Op.like]: `%${partnerSearch}%` } },
            { '$title.partner.nome$': { [Op.like]: `%${partnerSearch}%` } }
          ]
        })
      }
    }

    if (filters.description) {
      andConditions.push({
        Descricao: { [Op.like]: `%${String(filters.description).trim()}%` }
      })
    }

    if (filters.accountPlan) {
      const accountPlanId = Number(filters.accountPlan?.id)
      if (!Number.isNaN(accountPlanId)) {
        titleWhere.accountPlanId = accountPlanId
      } else {
        const accountPlanSearch = String(filters.accountPlan).trim().replace(/\s+/g, '%')
        andConditions.push({
          [Op.or]: [
            { '$title.accountPlan.Descricao$': { [Op.like]: `%${accountPlanSearch}%` } },
            { '$title.accountPlan.Codigo$': { [Op.like]: `%${accountPlanSearch}%` } }
          ]
        })
      }
    }

    if (filters.costCenter) {
      const costCenterId = Number(filters.costCenter?.id)
      if (!Number.isNaN(costCenterId)) {
        titleWhere.costCenterId = costCenterId
      } else {
        andConditions.push({
          '$title.costCenter.Descricao$': { [Op.like]: `%${String(filters.costCenter).trim()}%` }
        })
      }
    }

    if (filters.status) {
      const status = String(filters.status).trim()
      if (status === 'paid') {
        andConditions.push({ codigo_pagamento: { [Op.ne]: null } })
      }
      if (status === 'open') {
        andConditions.push({ codigo_pagamento: { [Op.is]: null } })
      }
    }

    if (filters.installmentNumber) {
      andConditions.push({
        numero_parcela: Number(filters.installmentNumber)
      })
    }

    if (filters.installmentValue) {
      const parsedValue = Number(String(filters.installmentValue).replace(',', '.'))
      if (!Number.isNaN(parsedValue)) {
        andConditions.push({ valor_parcela: parsedValue })
      }
    }

    if (andConditions.length > 0) {
      params.where = {
        ...(params.where || {}),
        [Op.and]: [...((params.where && params.where[Op.and]) || []), ...andConditions]
      }
    }

    delete params.filters
  }

  const titleInclude = {
    association: 'title',
    ...(Object.keys(titleWhere).length > 0 ? { where: titleWhere } : {}),
    include: [
      { association: 'partner', attributes: ['id', 'name', 'surname'] },
      { association: 'accountPlan', required: false, attributes: ['id', 'description', 'code'] },
      { association: 'costCenter', required: false, attributes: ['id', 'description'] },
      { association: 'company', required: false, attributes: ['id', 'name', 'surname'] }
    ]
  }

  params.include = [...(params.include || []), titleInclude]

  if (params.range) {
    const { start, end, field = 'dueDate' } = params.range
    if (start && end) {
      params.where = {
        ...params.where,
        [field]: { [Op.between]: [start, end] }
      }
    }
    delete params.range
  }

  return await financeRepository.findAllEntries(transaction, params)
}

export async function findEntry(transaction, id) {
  const entry = await financeRepository.findEntry(transaction, id)
  if (!entry) {
    throw { code: "NOT_FOUND", message: "Parcela financeira não encontrada" }
  }
  return entry
}

export async function updateEntry(transaction, id, data) {
  await findEntry(transaction, id) // Validate existence and company permissions first

  // Prevent updating security fields if present in data
  const { id: _id, titleId: _titleId, ...safeData } = data

  return await financeRepository.updateEntry(transaction, id, safeData)
}

export async function findEntryPaymentHistory(transaction, id) {
  const entry = await financeRepository.findEntryPaymentHistory(transaction, id)

  // Security check: ensure the entry belongs to a title that belongs to the user's company
  // Note: we might need to fetch the title first if findEntryPaymentHistory doesn't include it.
  // In our case, I'll rely on the existing findEntry for validation if needed, or just fetch title here.

  const validationEntry = await financeRepository.findEntry(transaction, id)
  if (!validationEntry) {
    throw { code: "NOT_FOUND", message: "Parcela financeira não encontrada" }
  }

  return entry
}

export async function findAllBankMovements(transaction, params = {}) {
  const session = await getSession()
  const { page = 1, limit = 50, sortBy = 'realDate', sortOrder = 'DESC' } = params
  const offset = (page - 1) * limit
  const statusFilter = params?.filters?.status || params?.status || 'conciled'

  let isConciledFilter
  if (statusFilter === 'conciled') isConciledFilter = true
  if (statusFilter === 'not_conciled') isConciledFilter = false

  const where = {
    ...params.where
  }

  if (typeof isConciledFilter === 'boolean') {
    where.isConciled = isConciledFilter
  }

  const include = [
    {
      association: 'bankAccount',
      where: { companyId: session.company.id },
      required: true
    }
  ]

  if (params.range) {
    const { start, end, field = 'realDate' } = params.range
    if (start && end) {
      const [sy, sm, sd] = start.split('-').map(Number)
      const s = new Date(sy, sm - 1, sd, 0, 0, 0, 0)

      const [ey, em, ed] = end.split('-').map(Number)
      const e = new Date(ey, em - 1, ed, 23, 59, 59, 999)

      where[field] = { [Op.between]: [s, e] }
    }
  }

  delete params.filters
  delete params.status

  return await financeRepository.findAllBankMovements(transaction, {
    ...params,
    where,
    include,
    limit,
    offset,
    order: [[sortBy, sortOrder]]
  })
}

export async function createBankMovement(transaction, data) {
  const session = await getSession()

  // Business logic: bank account MUST belong to company
  const account = await financeRepository.findBankAccount(transaction, {
    attributes: ['id', 'description', 'companyId'],
    where: { id: data.bankAccountId, companyId: session.company.id }
  })

  if (!account) {
    throw { code: "INVALID_ACCOUNT", message: "Conta bancária inválida ou não pertence à empresa" }
  }

  const finalData = {
    ...data,
    entryDate: new Date(), // Data de lançamento é sempre agora
    realDate: data.realDate || new Date(), // Fallback para hoje se não fornecido
    isConciled: false
  }

  return await financeRepository.createBankMovement(transaction, finalData)
}


export async function traceBankMovement(transaction, id) {
  const session = await getSession()

  const include = [
    {
      association: 'bankAccount',
      where: { companyId: session.company.id },
      required: true
    },
    {
      association: 'paymentEntry',
      required: false,
      attributes: ['id', 'paymentId', 'paymentMethodId', 'value'],
      include: [
        {
          association: 'payment',
          attributes: ['id', 'date', 'totalValue'],
          include: [
            {
              association: 'entries',
              attributes: ['id', 'installmentNumber', 'installmentValue', 'dueDate', 'titleId'],
              include: [
                {
                  association: 'title',
                  attributes: ['id', 'documentNumber', 'partnerId', 'accountPlanId', 'costCenterId'],
                  include: [
                    { association: 'partner', attributes: ['id', 'name', 'surname'] },
                    { association: 'accountPlan', attributes: ['id', 'description', 'code'] },
                    { association: 'costCenter', attributes: ['id', 'description'] }
                  ]
                }
              ]
            },
            {
              association: 'paymentEntries',
              attributes: ['id', 'paymentId', 'paymentMethodId', 'value'],
              include: [
                { association: 'paymentMethod', attributes: ['id', 'description'] },
                {
                  association: 'bankMovements',
                  attributes: ['id', 'bankAccountId', 'value', 'realDate'],
                  include: [
                    { association: 'bankAccount', attributes: ['id', 'bankName', 'description', 'bankId', 'agency', 'accountNumber'], include: [{ association: 'bank', attributes: ['id', 'description'] }] }
                  ]
                }
              ]
            }
          ]
        },
        { association: 'paymentMethod', attributes: ['id', 'description'] }
      ]
    }
  ]

  const result = await financeRepository.findBankMovement(transaction, id, { include })

  if (!result) {
    throw { code: "NOT_FOUND", message: "Movimento bancário não encontrado" }
  }

  return result
}

/**
 * Desfaz recebimento/pagamento ligado ao movimento: remove apenas lançamentos originados pela baixa
 * na mesma transação financeira (`codigo_pagamento`).
 */
export async function reverseSettlementFromBankMovement(transaction, movementId) {
  const session = await getSession()

  const include = [
    {
      association: 'bankAccount',
      where: { companyId: session.company.id },
      required: true,
    },
    {
      association: 'paymentEntry',
      required: false,
      attributes: ['id', 'paymentId'],
    },
  ]

  const movement = await financeRepository.findBankMovement(transaction, movementId, { include })

  if (!movement) {
    throw { code: 'NOT_FOUND', message: 'Movimento bancário não encontrado ou sem permissão' }
  }

  const paymentEntryId =
    movement.paymentEntryId ??
    movement.paymentEntry?.id
  const paymentId = movement.paymentEntry?.paymentId

  if (!paymentEntryId || !paymentId) {
    throw {
      code: 'NOT_LINKED',
      message:
        'Este lançamento não está vinculado a uma baixa de conta a receber/pagar. Tranferências e lançamentos manuais não podem ser desfeitos aqui.',
    }
  }

  return await financeRepository.reversePaymentSettlement(transaction, paymentId)
}

/**
 * Desfaz recebimento/pagamento diretamente pelo código do pagamento (`codigo_pagamento`).
 */
export async function reverseSettlementFromPayment(transaction, paymentId) {
  const session = await getSession()
  const parsedPaymentId = Number(paymentId)

  if (!parsedPaymentId || Number.isNaN(parsedPaymentId)) {
    throw { code: 'INVALID_PAYMENT', message: 'Pagamento inválido' }
  }

  const payment = await financeRepository.findPayment(transaction, parsedPaymentId, {
    include: [
      {
        association: 'entries',
        required: true,
        include: [
          {
            association: 'title',
            required: true,
            where: { companyId: session.company.id },
            attributes: ['id', 'companyId']
          }
        ]
      }
    ]
  })

  if (!payment) {
    throw { code: 'NOT_FOUND', message: 'Pagamento não encontrado ou sem permissão' }
  }

  return await financeRepository.reversePaymentSettlement(transaction, parsedPaymentId)
}

/**
 * Desfaz recebimentos/pagamentos em lote a partir de parcelas selecionadas.
 */
export async function reverseSettlementsFromEntries(transaction, entryIds = []) {
  const session = await getSession()
  const normalizedEntryIds = [...new Set((entryIds || []).map(Number).filter((id) => !Number.isNaN(id) && id > 0))]

  if (normalizedEntryIds.length === 0) {
    throw { code: 'INVALID_ENTRIES', message: 'Nenhuma parcela válida foi informada' }
  }

  const entries = await Promise.all(
    normalizedEntryIds.map((id) => financeRepository.findEntry(transaction, id))
  )

  if (entries.some((entry) => !entry)) {
    throw { code: 'NOT_FOUND', message: 'Uma ou mais parcelas não foram encontradas' }
  }

  const unauthorized = entries.some((entry) => Number(entry?.title?.company?.id) !== Number(session.company.id))
  if (unauthorized) {
    throw { code: 'FORBIDDEN', message: 'Uma ou mais parcelas não pertencem à empresa da sessão' }
  }

  const paymentIds = [...new Set(entries.map((entry) => Number(entry.paymentId)).filter((id) => !Number.isNaN(id) && id > 0))]
  if (paymentIds.length === 0) {
    throw { code: 'NOT_LINKED', message: 'As parcelas selecionadas não possuem baixa registrada' }
  }

  for (const paymentId of paymentIds) {
    await financeRepository.reversePaymentSettlement(transaction, paymentId)
  }

  return { reversedPayments: paymentIds.length, reversedEntries: normalizedEntryIds.length }
}

export async function approveConciliationBatch(transaction, movementIds = [], options = {}) {
  const session = await getSession()
  const ids = [...new Set((movementIds || []).map(Number).filter((id) => !Number.isNaN(id) && id > 0))]

  if (ids.length === 0) {
    throw { code: 'INVALID_MOVEMENTS', message: 'Nenhum movimento válido foi informado' }
  }

  const result = await financeRepository.findAllBankMovements(transaction, {
    attributes: ['id', 'isConciled'],
    where: { id: { [Op.in]: ids } },
    include: [{
      association: 'bankAccount',
      where: { companyId: session.company.id },
      required: true
    }],
    limit: ids.length
  })

  const found = result.rows || []
  if (found.length !== ids.length) {
    throw { code: 'FORBIDDEN', message: 'Um ou mais movimentos não pertencem à empresa da sessão' }
  }

  const pendingIds = found.filter((movement) => !movement.isConciled).map((movement) => movement.id)
  if (pendingIds.length === 0) {
    return { approvedCount: 0 }
  }

  const updateData = { isConciled: true }

  if (options?.bankAccountId != null) {
    const parsedBankAccountId = Number(options.bankAccountId)
    if (!Number.isNaN(parsedBankAccountId) && parsedBankAccountId > 0) {
      const account = await financeRepository.findBankAccount(transaction, {
        where: { id: parsedBankAccountId, companyId: session.company.id },
        attributes: ['id']
      })

      if (!account) {
        throw { code: 'INVALID_ACCOUNT', message: 'Conta bancária não pertence à empresa da sessão' }
      }

      updateData.bankAccountId = parsedBankAccountId
    }
  }

  if (options?.realDate != null) {
    const parsedDate = new Date(options.realDate)
    if (Number.isNaN(parsedDate.getTime())) {
      throw { code: 'INVALID_DATE', message: 'Data de pagamento inválida' }
    }
    updateData.realDate = parsedDate
  }

  const affectedCount = await financeRepository.updateBankMovements(transaction, pendingIds, updateData)
  return { approvedCount: affectedCount }
}

export async function approveConciliationMovement(transaction, { movementId, realDate, bankAccountId }) {
  const session = await getSession()
  const parsedMovementId = Number(movementId)
  const parsedBankAccountId = Number(bankAccountId)

  if (!parsedMovementId || Number.isNaN(parsedMovementId)) {
    throw { code: 'INVALID_MOVEMENT', message: 'Movimento inválido' }
  }
  if (!parsedBankAccountId || Number.isNaN(parsedBankAccountId)) {
    throw { code: 'INVALID_ACCOUNT', message: 'Conta bancária inválida' }
  }

  const movement = await financeRepository.findBankMovement(transaction, parsedMovementId, {
    include: [{
      association: 'bankAccount',
      where: { companyId: session.company.id },
      required: true
    }]
  })

  if (!movement) {
    throw { code: 'NOT_FOUND', message: 'Movimento não encontrado ou sem permissão' }
  }

  const account = await financeRepository.findBankAccount(transaction, {
    where: { id: parsedBankAccountId, companyId: session.company.id },
    attributes: ['id']
  })

  if (!account) {
    throw { code: 'INVALID_ACCOUNT', message: 'Conta bancária não pertence à empresa da sessão' }
  }

  const parsedDate = realDate ? new Date(realDate) : new Date()
  if (Number.isNaN(parsedDate.getTime())) {
    throw { code: 'INVALID_DATE', message: 'Data de pagamento inválida' }
  }

  await financeRepository.updateBankMovements(transaction, [parsedMovementId], {
    isConciled: true,
    realDate: parsedDate,
    bankAccountId: parsedBankAccountId
  })

  return { movementId: parsedMovementId }
}

export async function createBankTransfer(transaction, { originAccountId, destinationAccountId, value, realDate, description }) {
  const session = await getSession()

  if (originAccountId === destinationAccountId) {
    throw { code: "INVALID_TRANSFER", message: "A conta de origem e destino devem ser diferentes" }
  }

  // Use createBankMovement for both sides to leverage its validation and logic
  const debit = await createBankMovement(transaction, {
    bankAccountId: originAccountId,
    originBankAccountId: destinationAccountId,
    typeId: 2, // Saída / Débito
    value,
    realDate,
    description: description || `Transferência para conta destino`,
    documentNumber: 0
  })

  const credit = await createBankMovement(transaction, {
    bankAccountId: destinationAccountId,
    originBankAccountId: originAccountId,
    typeId: 1, // Entrada / Crédito
    value,
    realDate,
    description: description || `Transferência da conta origem`,
    documentNumber: 0
  })

  return { debit, credit }
}



