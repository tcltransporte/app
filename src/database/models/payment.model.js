import { DataTypes } from 'sequelize';

export class Payment {
  id = {
    field: 'codigo_pagamento',
    primaryKey: true,
    autoIncrement: true,
    type: DataTypes.BIGINT
  }

  date = {
    field: 'data_pagamento',
    type: DataTypes.DATE,
    allowNull: false
  }

  totalValue = {
    field: 'valor_total',
    type: DataTypes.DECIMAL(19, 4),
    allowNull: false
  }
}
