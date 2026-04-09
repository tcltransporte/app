import { DataTypes } from 'sequelize';

export class PaymentMethod {
  id = {
    field: 'codigo_tipo_pagamento',
    primaryKey: true,
    type: DataTypes.TINYINT,
    allowNull: false
  }

  description = {
    field: 'descricao',
    type: DataTypes.STRING(30),
    allowNull: false
  }
}
