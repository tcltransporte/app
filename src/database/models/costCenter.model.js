import { DataTypes } from 'sequelize';

export class CostCenter {

  id = {
    field: 'ID',
    primaryKey: true,
    autoIncrement: true,
    type: DataTypes.INTEGER
  }

  description = {
    field: 'Descricao',
    type: DataTypes.STRING(100),
    allowNull: true
  }

  vehicleId = {
    field: 'IDVeiculo',
    type: DataTypes.BIGINT,
    allowNull: true
  }
}
