import { DataTypes } from 'sequelize';

export class Bill {
  id = {
    field: 'codigo_fatura',
    primaryKey: true,
    autoIncrement: true,
    type: DataTypes.BIGINT
  }

  companyId = {
    field: 'codigo_empresa_filial',
    type: DataTypes.TINYINT,
    allowNull: false
  }

  customerId = {
    field: 'codigo_cliente',
    type: DataTypes.BIGINT,
    allowNull: false
  }

  date = {
    field: 'data',
    type: DataTypes.DATE,
    allowNull: false
  }

  dueDate = {
    field: 'data_vencimento',
    type: DataTypes.DATE,
    allowNull: false
  }

  paymentTypeId = {
    field: 'codigo_tipo_pagamento',
    type: DataTypes.TINYINT,
    allowNull: false
  }

  invoiceNumber = {
    field: 'numero_fatura',
    type: DataTypes.BIGINT,
    allowNull: false
  }

  preInvoiceNumber = {
    field: 'numPreFatura',
    type: DataTypes.BIGINT,
    allowNull: true
  }

  discountValue = {
    field: 'ValorDesconto',
    type: DataTypes.DECIMAL(19, 4),
    allowNull: true
  }

  bankAccountId = {
    field: 'IDContaBanco',
    type: DataTypes.SMALLINT,
    allowNull: true
  }

  description = {
    field: 'Descricao',
    type: DataTypes.STRING(4000),
    allowNull: true
  }

  movementId = {
    field: 'IDMovimento',
    type: DataTypes.BIGINT,
    allowNull: true
  }

  value = {
    field: 'Valor',
    type: DataTypes.DECIMAL(19, 4),
    allowNull: true
  }

  interestMovementId = {
    field: 'IDMovimentoJuros',
    type: DataTypes.BIGINT,
    allowNull: true
  }

  interestValue = {
    field: 'ValorJuros',
    type: DataTypes.DECIMAL(19, 4),
    allowNull: true
  }

  ascendingOrder = {
    field: 'OrdemCrescente',
    type: DataTypes.BOOLEAN,
    allowNull: true
  }
}
