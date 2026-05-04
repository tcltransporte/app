import { DataTypes } from 'sequelize';

export class FinanceEntry {

  id = {
    field: 'codigo_movimento_detalhe',
    primaryKey: true,
    autoIncrement: true,
    type: DataTypes.BIGINT
  }
  
  titleId = {
    field: 'codigo_movimento',
    primaryKey: true,
    type: DataTypes.BIGINT,
    allowNull: false
  }

  installmentNumber = {
    field: 'numero_parcela',
    type: DataTypes.SMALLINT,
    allowNull: false
  }

  installmentValue = {
    field: 'valor_parcela',
    type: DataTypes.DECIMAL(19, 4),
    allowNull: false
  }

  dueDate = {
    field: 'data_vencimento',
    type: DataTypes.DATE,
    allowNull: true
  }

  systemDate = {
    field: 'data_sistema',
    type: DataTypes.DATE,
    allowNull: false
  }

  paymentId = {
    field: 'codigo_pagamento',
    type: DataTypes.BIGINT,
    allowNull: true
  }

  description = {
    field: 'Descricao',
    type: DataTypes.STRING(1000),
    allowNull: true
  }

  invoiceId = {
    field: 'IDFatura',
    type: DataTypes.BIGINT,
    allowNull: true
  }

  interestPurchaseId = {
    field: 'IDCompraJuros',
    type: DataTypes.BIGINT,
    allowNull: true
  }

  bankAccountId = {
    field: 'bankAccountId',
    type: DataTypes.SMALLINT,
    allowNull: true
  }

  paymentMethodId = {
    field: 'paymentMethodId',
    type: DataTypes.UUID,
    allowNull: true
  }

  fundMethodId = {
    field: 'fundMethodId',
    type: DataTypes.UUID,
    allowNull: true
  }

  externalId = {
    field: 'externalId',
    type: DataTypes.STRING(15),
    allowNull: true
  }

  discountValue = {
    field: 'valor_desconto',
    type: DataTypes.DECIMAL(18, 2),
    allowNull: true
  }

  status = {
    type: DataTypes.VIRTUAL,
    get() {
      const isPaid = !!this.getDataValue('paymentId')
      if (isPaid) return 'paid'
      const dueDate = this.getDataValue('dueDate')
      if (dueDate) {
        const timeZone = 'America/Sao_Paulo'
        const toDateKey = (date) =>
          date.toLocaleDateString('en-CA', { timeZone }) // YYYY-MM-DD
        const todayKey = toDateKey(new Date())

        let dueDateKey = null
        if (typeof dueDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
          // Evita deslocamento de fuso ao parsear YYYY-MM-DD com new Date(...)
          dueDateKey = dueDate
        } else {
          const due = new Date(dueDate)
          if (!Number.isNaN(due.getTime())) {
            dueDateKey = toDateKey(due)
          }
        }

        if (dueDateKey && dueDateKey < todayKey) return 'late'
      }
      return 'open'
    }
  }
}
