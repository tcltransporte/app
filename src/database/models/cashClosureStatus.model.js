import { DataTypes } from 'sequelize';

export class CashClosureStatus {
  id = {
    field: 'Id',
    primaryKey: true,
    type: DataTypes.INTEGER
  }

  description = {
    field: 'Descricao',
    type: DataTypes.STRING(10),
    allowNull: false
  }
}
