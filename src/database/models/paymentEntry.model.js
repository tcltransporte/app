import { DataTypes } from 'sequelize';

export class PaymentEntry {
  id = {
    field: 'codigo_pagamento_detalhe',
    primaryKey: true,
    autoIncrement: true,
    type: DataTypes.BIGINT
  }

  paymentId = {
    field: 'codigo_pagamento',
    type: DataTypes.BIGINT,
    allowNull: false
  }

  paymentMethodId = {
    field: 'codigo_tipo_pagamento',
    type: DataTypes.TINYINT,
    allowNull: false
  }

  value = {
    field: 'valor',
    type: DataTypes.DECIMAL(19, 4),
    allowNull: false
  }

  paymentMethodNumber = {
    field: 'numero_tipo_pagamento',
    type: DataTypes.BIGINT,
    allowNull: true
  }

  systemDate = {
    field: 'data_sistema',
    type: DataTypes.DATE,
    allowNull: false
  }
}
